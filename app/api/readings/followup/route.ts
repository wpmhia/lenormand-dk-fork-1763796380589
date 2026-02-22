export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

import { buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { getEnv } from "@/lib/env";
import { processSSEChunk, finalizeSSEStream } from "@/lib/sse-parser";

const DEEPSEEK_API_KEY = getEnv("DEEPSEEK_API_KEY");
const BASE_URL = "https://api.deepseek.com";

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

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
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        },
      );
    }

    const body = await request.json();

    if (!DEEPSEEK_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { followUpQuestion, originalReading, cards, spreadId } = body;

    if (!followUpQuestion || typeof followUpQuestion !== "string") {
      return new Response(JSON.stringify({ error: "Follow-up question required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!originalReading || typeof originalReading !== "string") {
      return new Response(JSON.stringify({ error: "Original reading required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cardCount = cards?.length || 3;
    const timeoutMs = 8000;
    const maxTokens = getTokenBudget(cardCount);

    const prompt = `Original reading: "${originalReading}"

Follow-up question: "${followUpQuestion}"

Provide a brief, direct answer to the follow-up question based on the original reading and cards. Be specific and concise.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

        try {
          const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: buildSystemPrompt() },
                { role: "user", content: prompt },
              ],
              temperature: 0.75,
              top_p: 0.9,
              max_tokens: maxTokens,
              stream: true,
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
          }

          const body = response.body;
          if (!body) {
            throw new Error("No response body");
          }
          const reader = body.getReader();

          const decoder = new TextDecoder();
          let buffer = "";
          let fullText = "";

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "headers", limit: rateLimitResult.limit, remaining: rateLimitResult.remaining })}\n\n`
          ));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const result = processSSEChunk(chunk, buffer);
            const events = result.events;
            buffer = result.buffer;

            for (const event of events) {
              const data = event as any;
              if (data && typeof data === "object") {
                const delta = data.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  const sseData = JSON.stringify({ type: "chunk", content: delta });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                }
              }
            }
          }

          const finalEvents = finalizeSSEStream(buffer);
          for (const event of finalEvents) {
            const data = event as any;
            if (data && typeof data === "object") {
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                const sseData = JSON.stringify({ type: "chunk", content: delta });
                controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
              }
            }
          }

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "done" })}\n\n`
          ));

          controller.close();
        } catch (error: any) {
          clearTimeout(timeoutId);
          const isTimeout = error.name === "AbortError" || error.message?.includes("abort");
          const errorData = JSON.stringify({
            type: "error",
            error: isTimeout ? "AI response timed out" : "Follow-up failed",
            message: error.message || "Unknown error",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
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
      },
    });
  } catch (error: any) {
    const isTimeout = error.name === "AbortError" || error.message?.includes("abort");
    const status = isTimeout ? 504 : 500;

    return new Response(
      JSON.stringify({
        error: isTimeout ? "AI response timed out" : "Follow-up failed",
        message: error.message || "Unable to process follow-up question",
      }),
      { status, headers: { "Content-Type": "application/json" } },
    );
  }
}
