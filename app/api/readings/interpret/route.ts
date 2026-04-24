export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { buildPrompt, buildSystemPrompt, getTokenBudget } from "@/lib/prompt-builder";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { incrementReadingCount } from "@/lib/counter";
import { getEnv } from "@/lib/env";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const MISTRAL_API_KEY = getEnv("MISTRAL_API_KEY");
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;
const allCards = staticCardsData as Card[];

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
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }

  if (!MISTRAL_API_KEY) {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const body = await request.json();

  if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
    return new Response(JSON.stringify({ error: "Cards required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { question, cards, spreadId } = body;
  const cardCount = cards.length;

  const cardsWithKeywords = cards.map((c: { id: number; name: string }) => {
    const cardData = allCards.find((card: Card) => card.id === c.id);
    return { id: c.id, name: c.name, keywords: cardData?.keywords || [] };
  });

  const prompt = buildPrompt(cardsWithKeywords, spreadId || "sentence-3", question || "What do the cards show?");
  const maxTokens = getTokenBudget(cardCount);

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

    incrementReadingCount().catch(() => {});

    return result.toTextStreamResponse({
      headers: corsHeaders,
    });
  } catch (error: any) {
    const isTimeout = error.name === "AbortError" || error.message?.includes("abort") || error.message?.includes("timeout");
    return new Response(
      JSON.stringify({
        error: isTimeout ? "Response timed out" : "Processing failed",
        reading: isTimeout
          ? "The AI took too long to respond. Tap to retry, or check the traditional card meanings below."
          : "Unable to generate a reading right now.",
      }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
}
