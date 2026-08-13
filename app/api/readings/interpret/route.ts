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
import { generateText } from "ai";
import { API_REQUEST_TIMEOUT_MS, DEFAULT_RATE_WINDOW_MS, GRAND_TABLEAU_CARD_COUNT } from "@/lib/constants";
import { normalizeReadingRequest, ValidationError } from "@/lib/reading-contract";
import {
  validateReadingOutput,
  validateReadingMarkdown,
  normalizeMarkdown,
  buildDeterministicFallback,
  isCriticalIssue,
  FallbackPair,
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

    const result = await generateText({
      model: mistral(MISTRAL_PRODUCTION_MODEL),
      system: buildSystemPrompt(cardCount),
      prompt,
      temperature: 0.2,
      maxOutputTokens: maxTokens,
      maxRetries: 1,
      abortSignal: request.signal,
      timeout: { totalMs: API_REQUEST_TIMEOUT_MS - 5000 },
    });

    const drawnCardIds = validated.cards.map((c) => c.id);

    if (!result.text.trim()) {
      const fb = buildFallbackCards(validated.cards, cardsMap);
      const fallback = buildDeterministicFallback(fb.cards, validated.spreadId, validated.question, fb.pairs);
      return jsonResponse({
        reading: fallback,
        rateLimitResult,
        source: "fallback",
        fallbackReason: "empty-mistral-output",
      });
    }

    let finalText = normalizeMarkdown(result.text);

    const outputValidation = validateReadingOutput(finalText, drawnCardIds, validated.spreadId);
    const markdownValidation = validateReadingMarkdown(finalText, validated.spreadId);
    const finalCritical = [
      ...outputValidation.issues.filter(isCriticalIssue),
      ...markdownValidation.issues.filter(isCriticalIssue),
    ];

    if (finalCritical.length > 0) {
      // Validation rejected the Mistral answer; record why and substitute the fallback.
      const fb = buildFallbackCards(validated.cards, cardsMap);
      finalText = buildDeterministicFallback(fb.cards, validated.spreadId, validated.question, fb.pairs);
      return jsonResponse({
        reading: finalText,
        rateLimitResult,
        source: "fallback",
        fallbackReason: finalCritical.map((i) => i.message).join("; "),
      });
    }

    return jsonResponse({ reading: finalText, rateLimitResult, source: "mistral" });
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

function jsonResponse({
  reading,
  rateLimitResult,
  source,
  fallbackReason,
}: {
  reading: string;
  rateLimitResult: { limit: number; remaining: number; reset: number };
  source: "mistral" | "fallback";
  fallbackReason?: string;
}) {
  return new Response(
    JSON.stringify({
      reading,
      source,
      ...(fallbackReason ? { fallbackReason } : {}),
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

interface FallbackCard {
  id: number;
  name: string;
  keywords: string[];
  meaning?: { general: string };
}

function findPairMeaning(
  aId: number,
  bId: number,
  cardsMap: Map<number, Card>,
): string | undefined {
  const a = cardsMap.get(aId);
  const b = cardsMap.get(bId);
  if (!a || !b) return undefined;
  const fwd = a.combos?.find((c) => c.withCardId === bId);
  const rev = b.combos?.find((c) => c.withCardId === aId);
  return [fwd?.meaning, rev?.meaning].filter(Boolean).join(" - ") || undefined;
}

function buildFallbackCards(
  drawnCards: { id: number; name: string; keywords: string[] }[],
  cardsMap: Map<number, Card>,
): { cards: FallbackCard[]; pairs: FallbackPair[] } {
  const cards: FallbackCard[] = drawnCards.map((c) => {
    const full = cardsMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      keywords: c.keywords,
      meaning: full?.meaning,
    };
  });

  const pairs: FallbackPair[] = [];
  const seen = new Set<string>();
  const pushPair = (i: number, j: number) => {
    const a = Math.min(i, j);
    const b = Math.max(i, j);
    const key = `${a}-${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    const meaning = findPairMeaning(cards[a].id, cards[b].id, cardsMap)
      || `${cards[a].name} combined with ${cards[b].name} sets the direction of this stretch of the line.`;
    pairs.push({
      indexA: a,
      indexB: b,
      cardAName: cards[a].name,
      cardBName: cards[b].name,
      meaning,
    });
  };

  if (cards.length === 36) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        pushPair(r * 9 + c, r * 9 + c + 1);
      }
    }
    for (let c = 0; c < 9; c++) {
      for (let r = 0; r < 3; r++) {
        pushPair(r * 9 + c, (r + 1) * 9 + c);
      }
    }
    const sigIndices = [
      cards.findIndex((c) => c.id === 28),
      cards.findIndex((c) => c.id === 29),
    ].filter((i) => i >= 0);
    for (const sigIdx of sigIndices) {
      const row = Math.floor(sigIdx / 9);
      const col = sigIdx % 9;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const ni = (row + dr) * 9 + (col + dc);
          if (ni >= 0 && ni < 36) pushPair(sigIdx, ni);
        }
      }
    }
  } else {
    for (let i = 0; i < cards.length - 1; i++) {
      pushPair(i, i + 1);
    }
  }

  return { cards, pairs };
}
