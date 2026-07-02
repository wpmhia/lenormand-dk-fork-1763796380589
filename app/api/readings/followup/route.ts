export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { buildPromptFromContext, buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { rateLimit, getClientIP, checkBodySize } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { API_REQUEST_TIMEOUT_MS, DEFAULT_RATE_WINDOW_MS } from "@/lib/constants";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";
import { normalizeReadingRequest, ValidationError } from "@/lib/reading-contract";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = DEFAULT_RATE_WINDOW_MS;
const allCards = staticCardsData as Card[];
const cardsMap = new Map<number, Card>(allCards.map((c) => [c.id, c]));

export async function POST(request: Request) {
  try {
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

    if (!MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await request.json();
    const { followUpQuestion, originalReading, cards, spreadId, significatorPreference } = body;

    if (!followUpQuestion || typeof followUpQuestion !== "string") {
      return new Response(JSON.stringify({ error: "Follow-up question required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const bodySize = checkBodySize(request);
    if (bodySize !== null) {
      return new Response(JSON.stringify({ error: "Request body too large" }), {
        status: 413,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!originalReading || typeof originalReading !== "string") {
      return new Response(JSON.stringify({ error: "Original reading required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const MAX_READING_LENGTH = 10000;
    const safeOriginalReading = originalReading.length > MAX_READING_LENGTH
      ? originalReading.slice(0, MAX_READING_LENGTH) + "..."
      : originalReading;

    let contextPrompt = "";
    let cardCount = 3;

    if (spreadId && cards && Array.isArray(cards) && cards.length > 0) {
      try {
        const validated = normalizeReadingRequest({ spreadId, cards, question: "", significatorPreference }, cardsMap);
        cardCount = validated.cards.length;
        const context = buildReadingContext(validated.spreadId, validated.question, validated.cards, cardsMap, validated.significatorPreference);
        contextPrompt = buildPromptFromContext(context);
      } catch {
        cardCount = cards.length;
        contextPrompt = `Cards: ${cards.map((c: {name?: string; id?: number}) => c.name || (c.id ? `Card ${c.id}` : "Unknown")).join(", ")}`;
      }
    }

    const maxTokens = getTokenBudget(cardCount);
    const prompt = contextPrompt
      ? `Original reading context:\n${contextPrompt}\n\nOriginal AI reading: "${safeOriginalReading}"\n\nFollow-up question: "${followUpQuestion}"\n\nAnswer the follow-up question based on the Lenormand card positions and combinations. Be specific to the cards drawn.`
      : `Original reading: "${safeOriginalReading}"\n\nFollow-up question: "${followUpQuestion}"\n\nProvide a brief, direct answer based on the original reading and cards.`;

    const mistral = createMistral({
      apiKey: MISTRAL_API_KEY,
    });

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), API_REQUEST_TIMEOUT_MS - 5000);
    request.signal.addEventListener("abort", () => abortController.abort(), { once: true });

    const result = await streamText({
      model: mistral("mistral-small-latest"),
      system: buildSystemPrompt(cardCount),
      prompt,
      temperature: 0.2,
      maxOutputTokens: maxTokens,
      abortSignal: abortController.signal,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "headers", limit: rateLimitResult.limit, remaining: rateLimitResult.remaining })}
\n\n`));

        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk })}
\n\n`));
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}
\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Stream interrupted" })}
\n\n`));
          controller.close();
        } finally {
          clearTimeout(timeout);
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
    if (error.name === "SyntaxError") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const isTimeout = error.name === "AbortError" || error.message?.includes("abort") || error.message?.includes("timeout");
    return new Response(
      JSON.stringify({ error: isTimeout ? "Response timed out" : "Processing failed" }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
