export const runtime = "edge";

import { buildPrompt, isDeepSeekAvailable, DEEPSEEK_BASE_URL } from "@/lib/ai-config";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getCached, setCached, getCacheKey, rateLimit } from "@/lib/cache";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

console.log("[Deepseek] API Key present:", !!DEEPSEEK_API_KEY);
console.log("[Deepseek] Base URL:", DEEPSEEK_BASE_URL);
console.log("[Deepseek] Available:", isDeepSeekAvailable());

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

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

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

    const { success, remaining } = await rateLimit(ip);
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", remaining }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, cards, spreadId } = body;
    const cacheKey = getCacheKey(question, cards, spreadId || "sentence-3");

    const cached = await getCached(cacheKey);
    if (cached) {
      return new Response(
        JSON.stringify({ reading: cached, source: "cache" }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
          } 
        }
      );
    }

    const prompt = buildPrompt(cards, spreadId || "sentence-3", question);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      console.log("[Deepseek] Streaming interpretation...");
      
      const result = streamText({
        model: deepseek.chat("deepseek-chat"),
        messages: [
          { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        maxOutputTokens: 800,
        abortSignal: controller.signal,
      });

      let reading = "";
      let chunkCount = 0;
      
      try {
        for await (const chunk of result.textStream) {
          reading += chunk;
          chunkCount++;
        }
      } catch (streamError) {
        console.error("[Deepseek] Stream error:", streamError);
        throw new Error("Stream failed");
      }
      
      clearTimeout(timeoutId);
      console.log("[Deepseek] Complete. Chunks:", chunkCount, "Length:", reading.length);

      if (!reading || reading.trim() === "") {
        throw new Error("Empty response");
      }

      const resultJson = JSON.stringify({ reading, source: "ai" });
      await setCached(cacheKey, resultJson, cards.length);

      return new Response(resultJson, { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
        } 
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("[Deepseek] Error:", error.message);
      
      const fallbackMessage = "The cards whisper their message through the mist.\n\nReflect on the cards' traditional meanings and how they speak to your question.\n\nThe answer emerges from within your own intuition.";

      return new Response(
        JSON.stringify({
          reading: fallbackMessage,
          source: "fallback",
        }),
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
          },
        }
      );
    }
  } catch (error: any) {
    console.error("[Deepseek] Request error:", error.message);
    
    const fallbackMessage = "The cards whisper their message through the mist.\n\nReflect on the cards' traditional meanings and how they speak to your question.\n\nThe answer emerges from within your own intuition.";

    return new Response(
      JSON.stringify({
        reading: fallbackMessage,
        source: "fallback",
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
        },
      }
    );
  }
}