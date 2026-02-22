export const runtime = "edge";
export const dynamic = "force-dynamic";
// Vercel Free plan: max 10s - proven to work with fixed token limits
export const maxDuration = 10;

import { buildPrompt, buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { incrementReadingCount } from "@/lib/counter";
import { COMPREHENSIVE_SPREADS } from "@/lib/spreads";
import { getEnv } from "@/lib/env";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";
import { processSSEChunk, finalizeSSEStream } from "@/lib/sse-parser";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return handleCorsPreflight();
}

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
            ...corsHeaders,
          },
        },
      );
    }

    const body = await request.json();

    if (!DEEPSEEK_API_KEY) {
      // SECURITY: Don't expose which service is not configured
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return new Response(JSON.stringify({ error: "Cards required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
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
          headers: { "Content-Type": "application/json", ...corsHeaders },
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

     const timeoutMs = 8000; // 8 seconds - with 100-300 token limit, response completes fast
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
              temperature: 0.75,
              top_p: 0.9,
              max_tokens: maxTokens,
              stream: true
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            // SECURITY: Don't expose external API error details
            throw new Error("External service error");
          }

          const body = response.body;
          if (!body) {
            throw new Error("No response body");
          }
          const reader = body.getReader();

            const decoder = new TextDecoder();
            let buffer = "";
            let fullText = "";
            let isTruncated = false;

            // Send headers first
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: "headers", limit: rateLimitResult.limit, remaining: rateLimitResult.remaining })}\n\n`
            ));

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const result = processSSEChunk(chunk, buffer);
              const events = result.events;
              buffer = result.buffer;
              
              for (const event of events) {
                const data = (event as any);
                if (data && typeof data === "object") {
                  const delta = data.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullText += delta;
                    console.log("[API] Sending chunk, length:", delta.length);
                    const sseData = JSON.stringify({ type: "chunk", content: delta });
                    controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                  }
                  // Check for finish reason
                  const finishReason = data.choices?.[0]?.finish_reason;
                  if (finishReason === "length") {
                    isTruncated = true;
                  }
                }
              }
            }

            // Process any remaining buffered data
            const finalEvents = finalizeSSEStream(buffer);
            for (const event of finalEvents) {
              const data = (event as any);
              if (data && typeof data === "object") {
                const delta = data.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  console.log("[API] Sending final chunk, length:", delta.length);
                  const sseData = JSON.stringify({ type: "chunk", content: delta });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                }
                const finishReason = data.choices?.[0]?.finish_reason;
                if (finishReason === "length") {
                  isTruncated = true;
                }
              }
            }

            // Check if text ends mid-sentence (no period, question mark, or exclamation at end)
            const trimmed = fullText.trim();
            if (trimmed.length > 0 && !/[.!?]$/.test(trimmed)) {
              isTruncated = true;
            }

            // Send done event with truncation status
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: "done", truncated: isTruncated })}\n\n`
            ));

            // Increment reading counter on successful completion
            // Fire and forget - don't block response
            console.log("[API] Reading completed, incrementing counter");
            incrementReadingCount()
              .then(newCount => console.log("[API] Counter incremented to:", newCount))
              .catch(err => console.error("[API] Counter increment failed:", err));

            controller.close();
        } catch (error: any) {
          clearTimeout(timeoutId);
          const isTimeout = error.name === "AbortError" || error.message?.includes("abort");
          // SECURITY: Don't expose internal error details to client
          const errorData = JSON.stringify({
            type: "error",
            error: isTimeout ? "Response timed out" : "Processing failed",
            reading: isTimeout
              ? "The AI took too long to respond. Tap to retry, or check the traditional meanings of your cards below."
              : "Unable to generate a reading right now.",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "X-RateLimit-Limit": String(rateLimitResult.limit),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(rateLimitResult.reset),
        ...corsHeaders,
       },
      });
  } catch (error: any) {
    const isTimeout = error.name === "AbortError" || 
                      error.message?.includes("abort") ||
                      error.message?.includes("timeout");
    
    // Return proper error status instead of 200 to track real errors
    const status = isTimeout ? 504 : 500;
    
    // SECURITY: Generic error messages - don't expose internal details
    return new Response(
      JSON.stringify({
        error: isTimeout ? "Response timed out" : "Processing failed",
        reading: isTimeout 
          ? "The AI took too long to respond. Tap to retry, or check the traditional card meanings below."
          : "Unable to generate a reading right now. Please check the traditional card meanings below, or try again.",
        source: "fallback",
        timedOut: isTimeout,
        partial: true,
      }),
      { status, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
