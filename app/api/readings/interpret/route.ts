export const runtime = "edge";

import { buildPrompt, isDeepSeekAvailable } from "@/lib/ai-config";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

const deepseek = createOpenAI({
  baseURL: DEEPSEEK_BASE_URL,
  apiKey: DEEPSEEK_API_KEY,
});

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
    return { valid: false, error: "Cards must be provided as an array" };
  }

  if (!body.question || typeof body.question !== "string") {
    return { valid: false, error: "Question is required" };
  }

  return { valid: true };
}

function generateCacheKey(question: string, cards: any[], spreadId: string): string {
  const key = `${spreadId}:${question}:${cards.map(c => c.id).sort().join(",")}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `reading:${Math.abs(hash)}`;
}

const responseCache = new Map<string, { reading: string; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

async function fetchAIInterpretation(prompt: string, signal: AbortSignal): Promise<string> {
  const result = streamText({
    model: deepseek.chat("deepseek-chat"),
    messages: [
      { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    maxOutputTokens: 800,
    abortSignal: signal,
  });

  let reading = "";
  for await (const chunk of result.textStream) {
    reading += chunk;
  }
  return reading;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isDeepSeekAvailable()) {
      return new Response(
        JSON.stringify({ error: "AI interpretation is not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, cards, spreadId } = body;
    const cacheKey = generateCacheKey(question, cards, spreadId || "sentence-3");

    const now = Date.now();
    if (responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey)!;
      if (now - cached.timestamp < CACHE_TTL) {
        return new Response(
          JSON.stringify({ reading: cached.reading, source: "cache" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const prompt = buildPrompt(cards, spreadId || "sentence-3", question);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const reading = await fetchAIInterpretation(prompt, controller.signal);
      clearTimeout(timeoutId);

      if (responseCache.size >= MAX_CACHE_SIZE) {
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
      }
      responseCache.set(cacheKey, { reading, timestamp: now });

      return new Response(
        JSON.stringify({ reading, source: "ai" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    const fallbackMessage = "The cards whisper their message through the mist.\n\nReflect on the cards' traditional meanings and how they speak to your question.\n\nThe answer emerges from within your own intuition.";

    return new Response(
      JSON.stringify({
        reading: fallbackMessage,
        source: "fallback",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}