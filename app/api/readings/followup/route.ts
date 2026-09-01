export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { rateLimit, getClientIP, readBodyWithLimit, BodyTooLargeError } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";
import { DEFAULT_RATE_WINDOW_MS } from "@/lib/constants";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";
import { normalizeReadingRequest } from "@/lib/reading-contract";
import { FOLLOWUP_SYSTEM_PROMPT, FOLLOWUP_MAX_OUTPUT_TOKENS } from "@/lib/followup-prompt";
import { buildReadingContext } from "@/lib/reading-context";
import { buildPredictionContext, formatPredictionEvidenceBlock } from "@/lib/prediction-context";
import { buildLenormandEvidencePack } from "@/lib/lenormand-evidence";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = DEFAULT_RATE_WINDOW_MS;
const MISTRAL_PRODUCTION_MODEL = "mistral-small-2603";
const allCards = staticCardsData as Card[];
const cardsMap = new Map<number, Card>(allCards.map((c) => [c.id, c]));

const mistral = createMistral({
  apiKey: MISTRAL_API_KEY || "",
});

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
            "Retry-After": String(Math.max(1, Math.ceil((rateLimitResult.reset - Date.now()) / 1000))),
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

    let body: unknown;
    try {
      body = JSON.parse(await readBodyWithLimit(request));
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof BodyTooLargeError ? error.message : "Invalid JSON body" }), {
        status: error instanceof BodyTooLargeError ? 413 : 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { followUpQuestion, originalQuestion, cards, spreadId, significatorPreference, followUpHistory } = body as {
      followUpQuestion?: unknown;
      originalQuestion?: unknown;
      cards?: unknown;
      spreadId?: unknown;
      significatorPreference?: unknown;
      followUpHistory?: unknown;
    };

    if (!followUpQuestion || typeof followUpQuestion !== "string") {
      return new Response(JSON.stringify({ error: "Follow-up question required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const safeOriginalQuestion = typeof originalQuestion === "string" ? originalQuestion : "";

    if (!Array.isArray(followUpHistory) || followUpHistory.length > 12 || followUpHistory.some((turn) =>
      !turn || (turn.role !== "user" && turn.role !== "assistant") || typeof turn.content !== "string" || turn.content.length > 1200
    )) {
      return new Response(JSON.stringify({ error: "Invalid follow-up history" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let validated;
    try {
      validated = normalizeReadingRequest({ spreadId, cards, question: safeOriginalQuestion, significatorPreference }, cardsMap);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid fixed spread" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const activeQuestion = `${safeOriginalQuestion}\nActive follow-up: ${followUpQuestion}`;
    const context = buildReadingContext(validated.spreadId, activeQuestion, validated.cards, cardsMap, validated.significatorPreference);
    const predictionEvidence = formatPredictionEvidenceBlock(buildPredictionContext(context));
    const fixedCards = validated.cards.map((card, index) => `${index + 1} ${card.name}`).join(" — ");
    const progression = context.adjacentPairs
      .filter((pair) => pair.indexB === pair.indexA + 1)
      .map((pair) => `${pair.cardA.name} + ${pair.cardB.name}`)
      .join("; ");
    const history = (followUpHistory as { role: "user" | "assistant"; content: string }[])
      .map((turn) => `${turn.role}: ${turn.content}`)
      .join("\n");
    const prompt = `FIXED SPREAD (never redraw or alter):\n${fixedCards}\n\nOriginal question: ${safeOriginalQuestion || "(none)"}\nActive follow-up: ${followUpQuestion}\n\n${buildLenormandEvidencePack(context)}\n\nAdjacent progression: ${progression || "No linear progression"}\n\n${predictionEvidence}\n\nConversation history (context only; deterministic evidence above has priority):\n${history}`;

    const result = streamText({
      model: mistral(MISTRAL_PRODUCTION_MODEL),
      system: FOLLOWUP_SYSTEM_PROMPT,
      prompt,
      temperature: 0.2,
      maxOutputTokens: FOLLOWUP_MAX_OUTPUT_TOKENS,
      maxRetries: 1,
      abortSignal: request.signal,
      timeout: { totalMs: 15_000 },
    });

    return result.toTextStreamResponse({
      headers: {
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
