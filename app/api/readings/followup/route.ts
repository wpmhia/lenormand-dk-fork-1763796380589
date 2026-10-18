export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { rateLimit, getClientIP, readBodyWithLimit, BodyTooLargeError } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { readingModel } from "@/lib/ai-model";
import { generateModelText, isTimeoutError } from "@/lib/reading-service";
import { DEFAULT_RATE_WINDOW_MS, MAX_QUESTION_LENGTH } from "@/lib/constants";
import { getCardCatalogMap } from "@/lib/card-catalog";
import { normalizeReadingRequest } from "@/lib/reading-contract";
import { buildFollowupPrompt, FOLLOWUP_SYSTEM_PROMPT } from "@/lib/followup-prompt";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSpreadFacts } from "@/lib/prompt-builder";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const DEEPSEEK_API_KEY = getEnv("DEEPSEEK_API");
/**
 * Thinking shares this budget with the answer, so it matches the reading budget for the same
 * spread size. A live nine-card follow-up took 24s, so the model timeout is 45s, inside the
 * route's 60s maxDuration. A slow generation then fails as a provider timeout (504), not a
 * platform kill.
 */
const FOLLOWUP_TOKEN_BUDGET = 12_288;
const FOLLOWUP_TIMEOUT_MS = 45_000;
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = DEFAULT_RATE_WINDOW_MS;
const cardsMap = getCardCatalogMap();


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

    if (!DEEPSEEK_API_KEY) {
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

    const { followUpQuestion, originalQuestion, cards, spreadId, significatorPreference } = body as {
      followUpQuestion?: unknown;
      originalQuestion?: unknown;
      cards?: unknown;
      spreadId?: unknown;
      significatorPreference?: unknown;
    };

    if (typeof followUpQuestion !== "string") {
      return new Response(JSON.stringify({ error: "Follow-up question required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const followUp = followUpQuestion.trim();
    if (!followUp) {
      return new Response(JSON.stringify({ error: "Follow-up question required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (followUp.length > MAX_QUESTION_LENGTH) {
      return new Response(JSON.stringify({ error: `Follow-up question is too long (max ${MAX_QUESTION_LENGTH} characters)` }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const safeOriginalQuestion = typeof originalQuestion === "string" ? originalQuestion : "";

    let validated;
    try {
      validated = normalizeReadingRequest({ spreadId, cards, question: safeOriginalQuestion, significatorPreference }, cardsMap);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid fixed spread" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const context = buildReadingContext(validated.spreadId, validated.question, validated.cards, cardsMap, validated.significatorPreference);
    // Model-first, like the primary reading path: the follow-up gets the complete
    // deterministic spread plus only the original and active question. The client may
    // retain follow-up turns for display, but none are accepted as model evidence.
    const prompt = buildFollowupPrompt({
      spreadFacts: buildSpreadFacts(context),
      originalQuestion: validated.question,
      activeQuestion: followUp,
    });

    // Same shared model service as the reading path; only the accepted output format differs.
    const generated = await generateModelText({
      model: readingModel,
      system: FOLLOWUP_SYSTEM_PROMPT,
      prompt,
      maxTokens: FOLLOWUP_TOKEN_BUDGET,
      timeoutMs: FOLLOWUP_TIMEOUT_MS,
      signal: request.signal,
      logLabel: "followup",
    });

    if (!generated.ok) {
      return new Response(JSON.stringify({ error: "Generation failed", reason: generated.reason }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(generated.text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-RateLimit-Limit": String(rateLimitResult.limit),
        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
        "X-RateLimit-Reset": String(rateLimitResult.reset),
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    // Only the client's own signal means the user left. The SDK's total timeout also raises an
    // AbortError, so the name alone cannot tell the two apart.
    if (request.signal.aborted) {
      return new Response(JSON.stringify({ error: "Client closed the request" }), {
        status: 499,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (error.name === "SyntaxError") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const isTimeout = isTimeoutError(error);
    return new Response(
      JSON.stringify({ error: isTimeout ? "Response timed out" : "Processing failed" }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
