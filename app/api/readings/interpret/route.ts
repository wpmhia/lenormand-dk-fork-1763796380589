export const runtime = "nodejs";
export const maxDuration = 60;

import { buildPrompt } from "@/lib/ai-config";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { getTokenBudget, getTimeoutMs } from "@/lib/streaming";
import { getCachedReading, cacheReading } from "@/lib/request-coalescing";

// Direct env access for Node.js runtime
const getEnvVar = (key: string): string | undefined => {
  return process.env[key];
};

const DEEPSEEK_API_KEY = getEnvVar("DEEPSEEK_API_KEY");
const BASE_URL = "https://api.deepseek.com";

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

export async function POST(request: Request) {
  try {
    console.log("[API] Interpret request started");
    
    const ip = getClientIP(request);
    console.log("[API] Client IP:", ip);
    
    const rateLimitResult = await rateLimit(ip, RATE_LIMIT, RATE_LIMIT_WINDOW);
    console.log("[API] Rate limit result:", rateLimitResult.success);

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        },
      );
    }

    const body = await request.json();

    if (!DEEPSEEK_API_KEY) {
      console.error("[API] DEEPSEEK_API_KEY not set. Value:", DEEPSEEK_API_KEY);
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("[API] DEEPSEEK_API_KEY is set, length:", DEEPSEEK_API_KEY.length);

    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return new Response(JSON.stringify({ error: "Cards required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { question, cards, spreadId } = body;
    const cardCount = cards.length;
    
    // Check in-memory cache first (saves API costs)
    const cached = getCachedReading(cards, spreadId || "sentence-3", question || "");
    if (cached) {
      console.log("[API] Cache hit - returning cached reading");
      return new Response(
        JSON.stringify({ reading: cached, cached: true }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            "X-Cache": "HIT",
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          }
        }
      );
    }
    
    const prompt = buildPrompt(
      cards,
      spreadId || "sentence-3",
      question || "What do the cards show?",
    );

    // Dynamic timeout based on card count
    const timeoutMs = getTimeoutMs(cardCount);
    const maxTokens = getTokenBudget(cardCount);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

    console.log("[API] Calling DeepSeek API with timeout:", timeoutMs, "maxTokens:", maxTokens);
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are Marie-Anne Lenormand. Give direct, practical readings using markdown formatting with **bold headers**.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
        stream: true,
      }),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API] DeepSeek API error:", response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    console.log("[API] DeepSeek response OK, streaming...");

    // Collect stream for caching while piping to client
    const streamStartTime = Date.now();
    let fullResponse = "";
    
    // Create a TransformStream to cache the response
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        fullResponse += text;
        controller.enqueue(chunk);
      },
      flush() {
        // Cache the complete response
        const duration = Date.now() - streamStartTime;
        console.log(`[API] Stream complete in ${duration}ms, caching response`);
        cacheReading(cards, spreadId || "sentence-3", question || "", fullResponse);
      }
    });
    
    // Pipe the response through our transform
    response.body?.pipeTo(writable).catch(console.error);
    
    // Stream with rate limit headers
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "X-RateLimit-Limit": String(rateLimitResult.limit),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(rateLimitResult.reset),
      },
    });
  } catch (error: any) {
    console.error("[API] Interpret error:", error.name, error.message);
    
    const isTimeout = error.name === "AbortError" || 
                      error.message?.includes("abort") ||
                      error.message?.includes("timeout");
    
    return new Response(
      JSON.stringify({
        error: isTimeout ? "AI response timed out" : "Stream failed",
        reading: isTimeout 
          ? "The spirits are taking time to whisper their message. Tap to retry, or reflect on the traditional meanings of your cards."
          : "The cards whisper through the mist. Reflect on their traditional meanings—the answer emerges from within.",
        source: "fallback",
        timedOut: isTimeout,
        partial: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
}
