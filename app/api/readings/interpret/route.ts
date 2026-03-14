export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { buildPrompt, buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { incrementReadingCount } from "@/lib/counter";
import { COMPREHENSIVE_SPREADS } from "@/lib/spreads";
import { getEnv } from "@/lib/env";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";
import { processSSEChunk, finalizeSSEStream } from "@/lib/sse-parser";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readingUsage, memberships } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const BASE_URL = getEnv("MISTRAL_BASE_URL") || "https://api.mistral.ai";
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;
const allCards = staticCardsData as Card[];

export async function POST(request: Request) {
  try {
    // Auth gate - must be logged in
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return new Response(
        JSON.stringify({
          error: "Sign in to access AI readings",
          requiresAuth: true,
        }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = session.user.id;

    // Check membership status
    const membershipRecord = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);
    
    const now = new Date();
    const membership = membershipRecord[0];
    let isMember = false;
    
    if (membership && membership.tier === "unlimited" && membership.status === "active") {
      if (!membership.expiresAt || new Date(membership.expiresAt) > now) {
        isMember = true;
      }
    }

    // Daily limit check for non-members
    if (!isMember) {
      const today = new Date().toISOString().split("T")[0];
      const usageRecord = await db
        .select()
        .from(readingUsage)
        .where(and(eq(readingUsage.userId, userId), eq(readingUsage.date, today)))
        .limit(1);

      const usedToday = usageRecord[0]?.count ?? 0;

      if (usedToday >= 1) {
        return new Response(
          JSON.stringify({
            error: "You've used your free reading for today. Upgrade to unlimited for €2,99/month.",
            dailyLimitReached: true,
            membershipLink: "/membership",
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

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
            "Cache-Control": "no-store, must-revalidate",
            ...corsHeaders,
          },
        },
      );
    }

    const body = await request.json();

    if (!MISTRAL_API_KEY) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return new Response(JSON.stringify({ error: "Cards required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { question, cards, spreadId } = body;
    const cardCount = cards.length;

    // Note: All spreads are now available to everyone
    // Membership only affects AI interpretation limits

    const cardsWithKeywords = cards.map((c: { id: number; name: string }) => {
      const cardData = allCards.find((card: Card) => card.id === c.id);
      return { id: c.id, name: c.name, keywords: cardData?.keywords || [] };
    });

    const prompt = buildPrompt(cardsWithKeywords, spreadId || "sentence-3", question || "What do the cards show?");
    const timeoutMs = 25000;
    const maxTokens = getTokenBudget(cardCount);

    // Increment usage for non-members before streaming
    if (!isMember) {
      const today = new Date().toISOString().split("T")[0];
      await db
        .insert(readingUsage)
        .values({ userId, date: today, count: 1 })
        .onConflictDoNothing();
      // If row already exists, increment
      await db.execute(
        `UPDATE reading_usage SET count = count + 1 WHERE user_id = '${userId}' AND date = '${today}'`
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

        try {
          const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
              model: "mistral-small-latest",
              messages: [
                { role: "system", content: buildSystemPrompt() },
                { role: "user", content: prompt },
              ],
              temperature: 0.75,
              top_p: 0.9,
              max_tokens: maxTokens,
              stream: true
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) throw new Error("External service error");

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let buffer = "";
          let fullText = "";
          let isTruncated = false;

          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: "headers", isMember, remainingToday: isMember ? null : 0 })}
\n\n`
          ));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const { events, buffer: newBuffer } = processSSEChunk(chunk, buffer);
            buffer = newBuffer;

            for (const event of events) {
              const data = event as any;
              if (data && typeof data === "object") {
                const delta = data.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: delta })}\n\n`));
                }
                if (data.choices?.[0]?.finish_reason === "length") isTruncated = true;
              }
            }
          }

          for (const event of finalizeSSEStream(buffer)) {
            const data = event as any;
            if (data && typeof data === "object") {
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: delta })}\n\n`));
              }
              if (data.choices?.[0]?.finish_reason === "length") isTruncated = true;
            }
          }

          const trimmed = fullText.trim();
          if (trimmed.length > 0 && !/[.!?]$/.test(trimmed)) isTruncated = true;

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", truncated: isTruncated })}\n\n`));
          incrementReadingCount().catch(() => {});
          controller.close();
        } catch (error: any) {
          clearTimeout(timeoutId);
          const isTimeout = error.name === "AbortError" || error.message?.includes("abort");
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "error",
            error: isTimeout ? "Response timed out" : "Processing failed",
            reading: isTimeout
              ? "The AI took too long to respond. Tap to retry, or check the traditional meanings of your cards below."
              : "Unable to generate a reading right now.",
          })}\n\n`));
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
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    const isTimeout = error.name === "AbortError" || error.message?.includes("abort") || error.message?.includes("timeout");
    return new Response(
      JSON.stringify({
        error: isTimeout ? "Response timed out" : "Processing failed",
        reading: isTimeout
          ? "The AI took too long to respond. Tap to retry, or check the traditional card meanings below."
          : "Unable to generate a reading right now. Please check the traditional card meanings below, or try again.",
        source: "fallback",
        timedOut: isTimeout,
        partial: true,
      }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
