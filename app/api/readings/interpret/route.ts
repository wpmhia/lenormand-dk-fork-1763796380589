export const runtime = "edge";
export const maxDuration = 30; // Vercel max duration for edge

import { buildPrompt, isDeepSeekAvailable } from "@/lib/ai-config";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com";

// Rate limit: 5 requests per minute per IP
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = await rateLimit(ip, RATE_LIMIT, RATE_LIMIT_WINDOW);

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

    if (!isDeepSeekAvailable()) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return new Response(JSON.stringify({ error: "Cards required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { question, cards, spreadId } = body;
    const prompt = buildPrompt(
      cards,
      spreadId || "sentence-3",
      question || "What do the cards show?",
    );

    // Abort controller for timeout - fail fast if API is slow
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
        messages: [
          {
            role: "system",
            content: "You are Marie-Anne Lenormand. Reply in plain text only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000, // Further reduced for faster response
        stream: true,
      }),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Zero-processing passthrough with rate limit headers
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "X-RateLimit-Limit": String(rateLimitResult.limit),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(rateLimitResult.reset),
      },
    });
  } catch (error: any) {
    // Check if it's a timeout
    const isTimeout = error.name === "AbortError" || 
                      error.message?.includes("abort") ||
                      error.message?.includes("timeout");
    
    return new Response(
      JSON.stringify({
        error: isTimeout ? "AI response timed out" : "Stream failed",
        reading: isTimeout 
          ? "The cards have been drawn, but the spirits are taking time to whisper their message. Please try again in a moment, or reflect on the traditional meanings of your cards while you wait."
          : "The cards whisper their message through the mist. Reflect on the cards' traditional meanings. The answer emerges from within.",
        source: "fallback",
        timedOut: isTimeout,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
}
