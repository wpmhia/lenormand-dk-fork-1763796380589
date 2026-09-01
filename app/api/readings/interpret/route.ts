export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { buildPromptFromContext, buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { rateLimit, getClientIP, checkBodySize } from "@/lib/rate-limit";
import { incrementReadingCount } from "@/lib/counter";
import { getEnv } from "@/lib/env";
import { getCardCatalogMap } from "@/lib/card-catalog";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { createMistral } from "@ai-sdk/mistral";
import { generateReading } from "@/lib/reading-service";
import { API_REQUEST_TIMEOUT_MS, DEFAULT_RATE_WINDOW_MS, GRAND_TABLEAU_CARD_COUNT, getReadingRepairTimeoutMs, getReadingTimeoutMs } from "@/lib/constants";
import { normalizeReadingRequest, ValidationError } from "@/lib/reading-contract";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = DEFAULT_RATE_WINDOW_MS;
const cardsMap = getCardCatalogMap();

const MISTRAL_PRODUCTION_MODEL = "mistral-small-2603";

const mistral = createMistral({
  apiKey: MISTRAL_API_KEY || "",
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const ip = getClientIP(request);

    const bodySize = checkBodySize(request);
    if (bodySize !== null) {
      return new Response(JSON.stringify({ error: "Request body too large" }), {
        status: 413,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
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

    await incrementReadingCount();

    const context = buildReadingContext(validated.spreadId, validated.question, validated.cards, cardsMap, validated.significatorPreference);
    const prompt = buildPromptFromContext(context);
    const maxTokens = getTokenBudget(cardCount);
    const serviceResult = await generateReading({
      context,
      model: mistral(MISTRAL_PRODUCTION_MODEL),
      system: buildSystemPrompt(cardCount),
      prompt: `${prompt}\n\nReturn only the requested structured object. Every evidence item must cite an evidence ID that appears in the deterministic evidence pack. Do not create evidence IDs.`,
      cardCount,
      maxTokens,
      initialTimeoutMs: Math.min(getReadingTimeoutMs(cardCount), API_REQUEST_TIMEOUT_MS - 5000),
      repairTimeoutMs: getReadingRepairTimeoutMs(cardCount),
      signal: request.signal,
    });

    if (!serviceResult.ok && serviceResult.reason === "empty-output") {
      console.error("interpret: empty Mistral output", {
        phase: "initial",
        spreadId: validated.spreadId,
        cardCount: cardCount,
        finishReason: "empty-output",
        elapsedMs: Date.now() - startedAt,
      });
      return generationFailedResponse(rateLimitResult, "empty-output");
    }
    if (!serviceResult.ok) {
      console.error("interpret: reading rejected by validator", {
        phase: "repair",
        spreadId: validated.spreadId,
        cardCount: cardCount,
        issues: serviceResult.issues.map((i) => i.message),
        elapsedMs: Date.now() - startedAt,
      });
      return generationFailedResponse(rateLimitResult, serviceResult.reason);
    }

    return readingResponse(serviceResult.reading, rateLimitResult);
  } catch (error: any) {
    if (error instanceof ValidationError || error.name === "SyntaxError") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const isTimeout = error.name === "AbortError" || error.message?.includes("abort") || error.message?.includes("timeout");
    console.error("interpret: generation error", {
      phase: "generation",
      name: error.name,
      message: error.message,
      isTimeout,
      elapsedMs: Date.now() - startedAt,
    });
    return new Response(
      JSON.stringify({
        error: isTimeout ? "Response timed out" : "Generation failed",
        retryable: true,
      }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}

function readingResponse(
  reading: string,
  rateLimitResult: { limit: number; remaining: number; reset: number },
) {
  return new Response(
    JSON.stringify({
      reading,
      source: "mistral",
      rateLimit: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      },
    }),
    {
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

function generationFailedResponse(
  rateLimitResult: { limit: number; remaining: number; reset: number },
  reason: string,
) {
  return new Response(
    JSON.stringify({
      error: "Reading generation failed validation",
      reason,
      retryable: true,
      rateLimit: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      },
    }),
    {
      status: 502,
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
