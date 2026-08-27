export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { buildPromptFromContext, buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { rateLimit, getClientIP, checkBodySize } from "@/lib/rate-limit";
import { incrementReadingCount } from "@/lib/counter";
import { getEnv } from "@/lib/env";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { createMistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import { getStructuredReadingSchema, renderStructuredReading, validateStructuredReading } from "@/lib/structured-reading";
import { API_REQUEST_TIMEOUT_MS, DEFAULT_RATE_WINDOW_MS, GRAND_TABLEAU_CARD_COUNT, getReadingRepairTimeoutMs, getReadingTimeoutMs } from "@/lib/constants";
import { normalizeReadingRequest, ValidationError } from "@/lib/reading-contract";
import {
  validateReadingOutput,
  validateReadingMarkdown,
  normalizeMarkdown,
  isCriticalIssue,
} from "@/lib/reading-validator";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = DEFAULT_RATE_WINDOW_MS;
const allCards = staticCardsData as Card[];
const cardsMap = new Map<number, Card>(allCards.map((c) => [c.id, c]));

const MISTRAL_PRODUCTION_MODEL = "mistral-small-2603";

const mistral = createMistral({
  apiKey: MISTRAL_API_KEY || "",
});

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
    const structuredSchema = getStructuredReadingSchema(validated.spreadId);

    const result = await generateText({
      model: mistral(MISTRAL_PRODUCTION_MODEL),
      system: buildSystemPrompt(cardCount),
      prompt: `${prompt}\n\nReturn only the requested structured object. Every evidence item must cite an evidence ID that appears in the deterministic evidence pack. Do not create evidence IDs.`,
      output: Output.object({ schema: structuredSchema }),
      temperature: 0.2,
      maxOutputTokens: maxTokens,
      maxRetries: 1,
      abortSignal: request.signal,
      timeout: { totalMs: Math.min(getReadingTimeoutMs(cardCount), API_REQUEST_TIMEOUT_MS - 5000) },
    });

    const drawnCardIds = validated.cards.map((c) => c.id);

    if (!result.output) {
      console.error("interpret: empty Mistral output", {
        spreadId: validated.spreadId,
        cardCount: cardCount,
        finishReason: result.finishReason,
      });
      return generationFailedResponse(rateLimitResult, "empty-output");
    }

    let finalText = normalizeMarkdown(renderStructuredReading(result.output, validated.spreadId));

    let structuredIssues = validateStructuredReading(result.output, context);
    let outputValidation = validateReadingOutput(finalText, drawnCardIds, validated.spreadId);
    let markdownValidation = validateReadingMarkdown(finalText, validated.spreadId);
    let finalCritical = [
      ...outputValidation.issues.filter(isCriticalIssue),
      ...markdownValidation.issues.filter(isCriticalIssue),
    ];
    finalCritical.push(...structuredIssues);

    if (finalCritical.length > 0) {
      const repair = await generateText({
        model: mistral(MISTRAL_PRODUCTION_MODEL),
        system: `${buildSystemPrompt(cardCount)}\n\nVALIDATION OVERRIDE: Regenerate the reading from scratch. Return only an object conforming to the supplied structured schema; do not emit Markdown headings yourself. Cite only evidence IDs supplied in the deterministic evidence pack, cover every required pair, and include every required Grand Tableau topic house.`,
        prompt: `${prompt}\n\nThe previous structured output failed validation. Return a corrected structured object only. Cite only evidence IDs from the evidence pack.`,
        output: Output.object({ schema: structuredSchema }),
        temperature: 0.1,
        maxOutputTokens: maxTokens,
        maxRetries: 0,
        abortSignal: request.signal,
        timeout: { totalMs: getReadingRepairTimeoutMs(cardCount) },
      });

      if (!repair.output) {
        return generationFailedResponse(rateLimitResult, "structured-output-empty");
      }
      finalText = normalizeMarkdown(renderStructuredReading(repair.output, validated.spreadId));
      structuredIssues = validateStructuredReading(repair.output, context);
      outputValidation = validateReadingOutput(finalText, drawnCardIds, validated.spreadId);
      markdownValidation = validateReadingMarkdown(finalText, validated.spreadId);
      finalCritical = [
        ...outputValidation.issues.filter(isCriticalIssue),
        ...markdownValidation.issues.filter(isCriticalIssue),
      ];
      finalCritical.push(...structuredIssues);
    }

    if (finalCritical.length > 0) {
      console.error("interpret: reading rejected by validator", {
        spreadId: validated.spreadId,
        cardCount: cardCount,
        issues: finalCritical.map((i) => i.message),
        output: finalText,
      });
      return generationFailedResponse(rateLimitResult, finalCritical.map((i) => i.message).join("; "));
    }

    return readingResponse(finalText, rateLimitResult);
  } catch (error: any) {
    if (error instanceof ValidationError || error.name === "SyntaxError") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const isTimeout = error.name === "AbortError" || error.message?.includes("abort") || error.message?.includes("timeout");
    console.error("interpret: generation error", {
      name: error.name,
      message: error.message,
      isTimeout,
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
