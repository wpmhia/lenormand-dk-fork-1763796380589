export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

export async function POST(request: Request) {
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
  const { followUpQuestion, originalReading, cards } = body;

  if (!followUpQuestion || typeof followUpQuestion !== "string") {
    return new Response(JSON.stringify({ error: "Follow-up question required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!originalReading || typeof originalReading !== "string") {
    return new Response(JSON.stringify({ error: "Original reading required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const cardCount = cards?.length || 3;
  const maxTokens = getTokenBudget(cardCount);

  const prompt = `Original reading: "${originalReading}"

Follow-up question: "${followUpQuestion}"

Provide a brief, direct answer to the follow-up question based on the original reading and cards. Be specific and concise.`;

  try {
    const mistral = createMistral({
      apiKey: MISTRAL_API_KEY,
    });

    const result = await streamText({
      model: mistral("mistral-small-latest"),
      system: buildSystemPrompt(),
      prompt,
      temperature: 0.75,
      maxOutputTokens: maxTokens,
    });

    // Convert to our custom SSE format for backwards compatibility
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
    const isTimeout = error.name === "AbortError" || error.message?.includes("abort");
    return new Response(
      JSON.stringify({ error: isTimeout ? "Response timed out" : "Processing failed" }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
