export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT, getTokenBudget } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { rateLimit, getClientIP, readBodyWithLimit, BodyTooLargeError } from "@/lib/rate-limit";
import { incrementReadingCount } from "@/lib/counter";
import { getEnv } from "@/lib/env";
import { getCardCatalogMap } from "@/lib/card-catalog";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { readingModel } from "@/lib/ai-model";
import { generateReading } from "@/lib/reading-service";
import { DEFAULT_RATE_WINDOW_MS, GRAND_TABLEAU_CARD_COUNT, getReadingRepairTimeoutMs } from "@/lib/constants";
import { normalizeReadingRequest, ValidationError } from "@/lib/reading-contract";
import { parseQuestionFrame } from "@/lib/question-frame";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const DEEPSEEK_API_KEY = getEnv("DEEPSEEK_API");
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = DEFAULT_RATE_WINDOW_MS;
const cardsMap = getCardCatalogMap();

function classifyGenerationFailure(error: Error & { name?: string; statusCode?: number }, clientAborted: boolean, deadlineAborted: boolean): string {
  if (clientAborted) return "client_abort";
  if (deadlineAborted || error.name === "TimeoutError" || error.name === "AbortError") return "provider_timeout";
  if (error.name === "AI_NoObjectGeneratedError") return "schema_mismatch";
  if (error.name === "AI_NoOutputGeneratedError") return "empty_output";
  if (error.name === "ResponseAborted" || error.message?.toLowerCase().includes("econnreset")) return "provider_abort";
  if (error.statusCode === 401 || error.statusCode === 403) return "provider_auth";
  if (error.statusCode === 429) return "provider_rate_limit";
  return "provider_runtime";
}


export async function POST(request: Request) {
  const startedAt = Date.now();
  const deadlineMs = 55_000;
  const responseReserveMs = 4_000;
  const parserBudgetMs = 5_000;
  const deadlineSignal = AbortSignal.any([request.signal, AbortSignal.timeout(deadlineMs)]);
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

    const parserSignal = AbortSignal.any([request.signal, AbortSignal.timeout(parserBudgetMs)]);
    let semanticQuestion: Awaited<ReturnType<typeof parseQuestionFrame>> | null = null;
    if (validated.spreadId === "grand-tableau") {
      try {
        semanticQuestion = await parseQuestionFrame(validated.question, readingModel, parserSignal);
      } catch (error) {
        console.warn("interpret: question parser failed; continuing with raw question context", {
          name: error instanceof Error ? error.name : "unknown",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const context = buildReadingContext(validated.spreadId, validated.question, validated.cards, cardsMap, validated.significatorPreference, validated.situationContext, semanticQuestion, true);
    const prompt = buildSimpleReadingPrompt(context);
    const maxTokens = getTokenBudget(cardCount);
    const remainingMs = Math.max(1_000, deadlineMs - (Date.now() - startedAt));
    const repairBudgetMs = getReadingRepairTimeoutMs(cardCount);
    const initialBudgetMs = Math.max(1_000, remainingMs - responseReserveMs);
    const serviceResult = await generateReading({ context, model: readingModel, system: SIMPLE_LENORMAND_SYSTEM_PROMPT, prompt: `${prompt}\n\nReturn only the requested structured object.`, cardCount, maxTokens, initialTimeoutMs: initialBudgetMs, repairTimeoutMs: repairBudgetMs, deadlineAt: startedAt + deadlineMs, signal: deadlineSignal });

    if (!serviceResult.ok && serviceResult.reason === "empty-output") {
      console.error("interpret: empty model output", {
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
        issues: serviceResult.issues.map((i) => ({ type: i.type, message: i.message })),
        elapsedMs: Date.now() - startedAt,
      });
      return generationFailedResponse(rateLimitResult, serviceResult.reason);
    }

    await incrementReadingCount();
    return readingResponse(serviceResult.reading, rateLimitResult);
  } catch (error: any) {
    if (error instanceof ValidationError || error.name === "SyntaxError") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const clientAborted = request.signal.aborted;
    const deadlineAborted = deadlineSignal.aborted && !clientAborted;
    const providerAborted = error.name === "ResponseAborted";
    const isTimeout = deadlineAborted || error.name === "AbortError" || error.message?.includes("abort") || error.message?.includes("timeout");
      console.error("interpret: generation error", {
        phase: "generation",
        failureClass: classifyGenerationFailure(error, clientAborted, deadlineAborted),
        name: error.name,
        message: error.message,
        statusCode: error.statusCode ?? error.status ?? error.cause?.statusCode,
        providerCode: error.code ?? error.cause?.code,
        cause: error.cause?.message,
        isTimeout,
        clientAborted,
        deadlineAborted,
        providerAborted,
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
