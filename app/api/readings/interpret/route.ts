export const runtime = "edge";
// Vercel Free plan: max 10s, Pro plan: max 60s
// Set to 10 for Free plan compatibility, increase to 60 if on Pro
export const maxDuration = 10;

import { buildPrompt, buildSystemPrompt } from "@/lib/prompt-builder";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { getTokenBudget } from "@/lib/streaming";
import { COMPREHENSIVE_SPREADS } from "@/lib/spreads";
import { getEnv } from "@/lib/env";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";

// Use getEnv for edge runtime compatibility
const DEEPSEEK_API_KEY = getEnv("DEEPSEEK_API_KEY");
const BASE_URL = "https://api.deepseek.com";

const RATE_LIMIT = 5;  // 5 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

// Load cards data for keyword lookups
const allCards = staticCardsData as Card[];

export async function POST(request: Request) {
  try {
    console.log("[API] Interpret request started");
    
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

    if (!DEEPSEEK_API_KEY) {
      console.error("[API] DEEPSEEK_API_KEY not set");
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
    const cardCount = cards.length;

    // Check if spread is disabled (premium feature)
    const spread = COMPREHENSIVE_SPREADS.find(s => s.id === spreadId);
    if (spread?.disabled) {
      return new Response(
        JSON.stringify({
          error: `${spread.label} is available for Ko-Fi supporters`,
          disabled: true,
          supporterLink: "https://ko-fi.com",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Enrich cards with keywords for better AI grounding
    const cardsWithKeywords = cards.map((c: { id: number; name: string }) => {
      const cardData = allCards.find((card: Card) => card.id === c.id);
      return {
        id: c.id,
        name: c.name,
        keywords: cardData?.keywords || [],
      };
    });

    const prompt = buildPrompt(
      cardsWithKeywords,
      spreadId || "sentence-3",
      question || "What do the cards show?",
    );

    const timeoutMs = 7500;
    const maxTokens = getTokenBudget(cardCount);

    console.log("[API] Starting streaming response, maxTokens:", maxTokens);

    // Stream directly to client - no waiting for full response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

        try {
          const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: buildSystemPrompt() },
                { role: "user", content: prompt },
              ],
              temperature: 0.6,
              top_p: 0.9,
              max_tokens: maxTokens,
              stream: true,
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          const decoder = new TextDecoder();

          // Send headers first
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "headers", limit: rateLimitResult.limit, remaining: rateLimitResult.remaining })}\n\n`
          ));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: {\"type\":\"done\"}\n\n"));
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    console.log("[API] Sending chunk, length:", delta.length);
                    const sseData = JSON.stringify({ type: "chunk", content: delta });
                    controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                  }
                } catch {
                  // Ignore parse errors
                }
              }
            }
          }

          controller.close();
        } catch (error: any) {
          clearTimeout(timeoutId);
          const isTimeout = error.name === "AbortError" || error.message?.includes("abort");
          const errorData = JSON.stringify({
            type: "error",
            error: isTimeout ? "AI response timed out" : "Reading failed",
            reading: isTimeout
              ? "The AI took too long to respond. Tap to retry, or check the traditional meanings of your cards below."
              : "Unable to generate a reading right now.",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
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
    
    // Return proper error status instead of 200 to track real errors
    const status = isTimeout ? 504 : 500;
    
    return new Response(
      JSON.stringify({
        error: isTimeout ? "AI response timed out" : "Reading failed",
        reading: isTimeout 
          ? "The AI took too long to respond. Tap to retry, or check the traditional meanings of your cards below."
          : "Unable to generate a reading right now. Please check the traditional card meanings below, or try again.",
        source: "fallback",
        timedOut: isTimeout,
        partial: true,
      }),
      { status, headers: { "Content-Type": "application/json" } },
    );
  }
}
