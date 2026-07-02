export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { buildPromptFromContext, buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { rateLimit, getClientIP, checkBodySize } from "@/lib/rate-limit";
import { incrementReadingCount } from "@/lib/counter";
import { getEnv } from "@/lib/env";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { API_REQUEST_TIMEOUT_MS, DEFAULT_RATE_WINDOW_MS, GRAND_TABLEAU_CARD_COUNT } from "@/lib/constants";
import { normalizeReadingRequest, ValidationError } from "@/lib/reading-contract";
import { validateReadingOutput, buildDeterministicFallback } from "@/lib/reading-validator";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = DEFAULT_RATE_WINDOW_MS;
const allCards = staticCardsData as Card[];
const cardsMap = new Map<number, Card>(allCards.map((c) => [c.id, c]));

const mistral = createMistral({
  apiKey: MISTRAL_API_KEY || "",
});

const REPAIR_SYSTEM_PROMPT = `You are a Lenormand editor. Fix the reading below according to these rules:
- Remove banned New Age or Tarot terms: energy, vibration, shadow work, higher self, soul lesson, chakra, archetype, the universe, spiritual journey, divine guidance, soul-purpose.
- Remove any mention of cards that were NOT drawn.
- Remove timing claims unless a timing card (Birds=days, Stork=weeks, Tree=years, Moon=phases) was drawn.
- Keep all section headings exactly as they are.
- Keep all valid card names and their meanings.
- Output only the corrected reading, nothing else.`;

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);

    const bodySize = checkBodySize(request);
    if (bodySize !== null) {
      return new Response(JSON.stringify({ error: "Request body too large" }), {
        status: 413,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await request.json();
    const validated = normalizeReadingRequest(body, cardsMap);
    const cardCount = validated.cards.length;

    if (!MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const effectiveLimit = cardCount >= GRAND_TABLEAU_CARD_COUNT ? Math.min(RATE_LIMIT, 5) : RATE_LIMIT;
    const rateLimitResult = await rateLimit(ip, effectiveLimit, RATE_LIMIT_WINDOW);

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

    const context = buildReadingContext(validated.spreadId, validated.question, validated.cards, cardsMap, validated.significatorPreference);
    const prompt = buildPromptFromContext(context);
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
      system: buildSystemPrompt(cardCount),
      prompt,
      temperature: 0.2,
      maxOutputTokens: maxTokens,
      abortSignal: abortController.signal,
    });

    let fullText = "";
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }
    clearTimeout(timeout);

    if (!fullText.trim()) {
      const fallback = buildDeterministicFallback(validated.cards, validated.spreadId, validated.question);
      return streamTextAsSSE(fallback, corsHeaders, rateLimitResult);
    }

    const drawnCardIds = validated.cards.map((c) => c.id);
    const validation = validateReadingOutput(fullText, drawnCardIds, validated.spreadId);

    let finalText = fullText;

    if (!validation.valid) {
      try {
        const repairResult = await streamText({
          model: mistral("mistral-small-latest"),
          system: REPAIR_SYSTEM_PROMPT,
          prompt: `Reading to fix:\n\n${fullText}\n\nDrawn card IDs: [${drawnCardIds.join(", ")}]`,
          temperature: 0.1,
          maxOutputTokens: maxTokens,
          abortSignal: AbortSignal.timeout(15000),
        });
        let repaired = "";
        for await (const chunk of repairResult.textStream) {
          repaired += chunk;
        }
        if (repaired.trim()) {
          const repairValidation = validateReadingOutput(repaired, drawnCardIds, validated.spreadId);
          if (repairValidation.valid) {
            finalText = repaired;
          }
        }
      } catch {
        finalText = fullText;
      }
    }

    const finalValidation = validateReadingOutput(finalText, drawnCardIds, validated.spreadId);
    if (!finalValidation.valid) {
      finalText = buildDeterministicFallback(validated.cards, validated.spreadId, validated.question);
    }

    return streamTextAsSSE(finalText, corsHeaders, rateLimitResult);
  } catch (error: any) {
    if (error instanceof ValidationError || error.name === "SyntaxError") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const isTimeout = error.name === "AbortError" || error.message?.includes("abort") || error.message?.includes("timeout");
    return new Response(
      JSON.stringify({
        error: isTimeout ? "Response timed out" : "Processing failed",
        reading: isTimeout
          ? "The AI took too long to respond."
          : "Unable to generate a reading right now.",
      }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}

function streamTextAsSSE(text: string, headers: Record<string, string>, rateLimitResult: { limit: number; remaining: number }) {
  const encoder = new TextEncoder();
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "headers", limit: rateLimitResult.limit, remaining: rateLimitResult.remaining })}
\n\n`));

      for (const sentence of sentences) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: sentence.trim() + " " })}
\n\n`));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}
\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      ...headers,
    },
  });
}
