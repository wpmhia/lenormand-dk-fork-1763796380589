export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { buildPrompt, buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { incrementReadingCount } from "@/lib/counter";
import { getEnv } from "@/lib/env";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { API_REQUEST_TIMEOUT_MS, ERROR_MESSAGES, DEFAULT_RATE_LIMIT, DEFAULT_RATE_WINDOW_MS } from "@/lib/constants";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const RATE_LIMIT = 20;
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
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    if (!MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await request.json();

    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return new Response(JSON.stringify({ error: "Cards required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { question, cards, spreadId } = body;
    const cardCount = cards.length;

    const cardsWithKeywords = cards.map((c: { id: number; name: string }) => {
      const cardData = cardsMap.get(c.id);
      return { id: c.id, name: c.name, keywords: cardData?.keywords || [] };
    });

    const prompt = buildPrompt(cardsWithKeywords, spreadId || "sentence-3", question || "What do the cards show?");
    const maxTokens = getTokenBudget(cardCount);

    const mistral = createMistral({
      apiKey: MISTRAL_API_KEY,
    });

    await incrementReadingCount();

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), API_REQUEST_TIMEOUT_MS - 5000);
    request.signal.addEventListener("abort", () => abortController.abort(), { once: true });

    const result = await streamText({
      model: mistral("mistral-small-latest"),
      system: buildSystemPrompt(),
      prompt,
      temperature: 0.75,
      maxOutputTokens: maxTokens,
      abortSignal: abortController.signal,
    });

    clearTimeout(timeout);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "headers" })}
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
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
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
      JSON.stringify({
        error: isTimeout ? "Response timed out" : "Processing failed",
        reading: isTimeout
          ? "The AI took too long to respond. Tap to retry, or check the traditional card meanings below."
          : "Unable to generate a reading right now.",
      }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
