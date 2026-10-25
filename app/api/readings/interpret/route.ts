export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { getTokenBudget } from "@/lib/prompt-builder";
import { buildLenormandContext } from "@/lib/lenormand-context";
import { rateLimit, getClientIP, readBodyWithLimit, BodyTooLargeError } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";
import { getCardCatalogMap } from "@/lib/card-catalog";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { readingModel } from "@/lib/ai-model";
import { canGenerateAIReading } from "@/lib/ai-access";
import { generateReading, isTimeoutError } from "@/lib/reading-service";
import { DEFAULT_RATE_WINDOW_MS, GRAND_TABLEAU_CARD_COUNT, GRAND_TABLEAU_GENERATION_TIMEOUT_MS, READING_GENERATION_TIMEOUT_MS } from "@/lib/constants";
import { normalizeReadingRequest, ValidationError } from "@/lib/reading-contract";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const DEEPSEEK_API_KEY = getEnv("DEEPSEEK_API");
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = DEFAULT_RATE_WINDOW_MS;
const cardsMap = getCardCatalogMap();

function classifyGenerationFailure(error: Error & { name?: string; statusCode?: number }, clientAborted: boolean): string {
  if (clientAborted) return "client_abort";
  if (error.name === "TimeoutError") return "generation_timeout";
  if (error.name === "AbortError") return "generation_aborted";
  if (error.name === "AI_NoObjectGeneratedError") return "schema_mismatch";
  if (error.name === "AI_NoOutputGeneratedError") return "empty_output";
  if (error.name === "ResponseAborted" || error.message?.toLowerCase().includes("econnreset")) return "provider_abort";
  if (error.statusCode === 401 || error.statusCode === 403) return "provider_auth";
  if (error.statusCode === 429) return "provider_rate_limit";
  return "provider_runtime";
}


/** Safe, fixed messages for upstream provider failures. Provider text and credentials are never returned. */
function upstreamFailure(error: { statusCode?: number; status?: number }): { reason: string; message: string } | null {
  const status = error.statusCode ?? error.status;
  if (status === 402) return { reason: "provider_balance", message: "The reading service is temporarily unavailable. Please try again later." };
  if (status === 401 || status === 403) return { reason: "provider_auth", message: "The reading service is temporarily unavailable. Please try again later." };
  if (status === 429) return { reason: "provider_rate_limit", message: "The reading service is busy. Please try again in a moment." };
  return null;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  let modelTimeoutMs = READING_GENERATION_TIMEOUT_MS;
  let generationStartedAt: number | undefined;
  try {
    const ip = getClientIP(request);

    let body: unknown;
    try {
      body = JSON.parse(await readBodyWithLimit(request));
    } catch (error) {
      return new Response(JSON.stringify({ error: error instanceof BodyTooLargeError ? error.message : "Invalid JSON body" }), {
        status: error instanceof BodyTooLargeError ? 413 : 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const validated = normalizeReadingRequest(body, cardsMap);
    const cardCount = validated.cards.length;

    if (!DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const effectiveLimit = cardCount >= GRAND_TABLEAU_CARD_COUNT ? Math.min(RATE_LIMIT, 5) : RATE_LIMIT;
    const rateLimitResult = await rateLimit(ip, effectiveLimit, RATE_LIMIT_WINDOW);
    if (rateLimitResult.degraded) console.warn("interpret: rate limit running in degraded mode", { spreadId: validated.spreadId });

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

    const access = canGenerateAIReading({ kind: "reading" });
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: "AI interpretation is not available for this request." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // The same shared context that "Copy for AI" uses: one source of facts and instructions.
    const lenormand = buildLenormandContext(
      validated.spreadId,
      validated.question,
      // Validated cards are already in position order; the index is the position.
      validated.cards.map((card, index) => ({ id: card.id, position: index })),
      validated.significatorPreference,
    );
    modelTimeoutMs = cardCount >= GRAND_TABLEAU_CARD_COUNT ? GRAND_TABLEAU_GENERATION_TIMEOUT_MS : READING_GENERATION_TIMEOUT_MS;
    generationStartedAt = Date.now();
    const serviceResult = await generateReading({
      model: readingModel,
      system: lenormand.instructions,
      prompt: [lenormand.facts, lenormand.jsonOutput].join("\n\n"),
      maxTokens: getTokenBudget(cardCount),
      timeoutMs: modelTimeoutMs,
      signal: request.signal,
      requestId,
    });

    if (!serviceResult.ok) {
      console.error("interpret: generation rejected", {
        requestId,
        reason: serviceResult.reason,
        spreadId: validated.spreadId,
        cardCount,
        elapsedMs: Date.now() - startedAt,
      });
      return generationFailedResponse(rateLimitResult, serviceResult.reason);
    }

    // The public counter counts completed spreads, not AI interpretations; the client reports a
    // completion through /api/readings/completed when a spread is first displayed.
    return readingResponse(serviceResult.reading, rateLimitResult);
  } catch (error: any) {
    if (error instanceof ValidationError || error.name === "SyntaxError") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const clientAborted = request.signal.aborted;
    const providerAborted = error.name === "ResponseAborted";
    const isTimeout = isTimeoutError(error);
    if (clientAborted) {
      return new Response(null, { status: 499 });
    }
    console.error("interpret: generation error", {
      requestId,
      phase: "generation",
      failureClass: classifyGenerationFailure(error, clientAborted),
      name: error.name,
      message: error.message,
      statusCode: error.statusCode ?? error.status ?? error.cause?.statusCode,
      providerCode: error.code ?? error.cause?.code,
      cause: error.cause?.message,
      isTimeout,
      clientAborted,
      providerAborted,
      modelTimeoutMs,
      generationElapsedMs: generationStartedAt ? Date.now() - generationStartedAt : undefined,
      elapsedMs: Date.now() - startedAt,
    });
    const upstream = upstreamFailure(error);
    if (!isTimeout && upstream) {
      return new Response(JSON.stringify({ error: upstream.message, reason: upstream.reason, retryable: true }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
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
      source: "deepseek",
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
      error: "We couldn't generate the interpretation. Please try again.",
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
