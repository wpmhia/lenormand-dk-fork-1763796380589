export const runtime = "edge";
export const maxDuration = 30;

import { buildPrompt } from "@/lib/ai-config";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { getTokenBudget } from "@/lib/streaming";
import { getEnv } from "@/lib/env";

const DEEPSEEK_API_KEY = getEnv("DEEPSEEK_API_KEY");
const BASE_URL = "https://api.deepseek.com";

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const rateLimitResult = await rateLimit(ip, RATE_LIMIT, RATE_LIMIT_WINDOW);

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { question, cards, spreadId } = body;

    if (!cards?.length) {
      return new Response(
        JSON.stringify({ error: "Cards required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = buildPrompt(cards, spreadId || "sentence-3", question || "What do the cards show?");

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 25000);

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: getTokenBudget(cards.length),
        stream: false,
      }),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const reading = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ reading }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[API] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process reading" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
