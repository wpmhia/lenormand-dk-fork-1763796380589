export const runtime = "edge";
// Vercel Free plan: max 10s, Pro plan: max 60s
// Set to 10 for Free plan compatibility, increase to 60 if on Pro
export const maxDuration = 10;

import { buildPrompt, buildSystemPrompt } from "@/lib/prompt-builder";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { getTokenBudget } from "@/lib/streaming";
import { COMPREHENSIVE_SPREADS } from "@/lib/spreads";
import { getEnv } from "@/lib/env";
import staticCardsData from "@/public/data/cards.json";
import { Card } from "@/lib/types";

// Use getEnv for edge runtime compatibility
const DEEPSEEK_API_KEY = getEnv("DEEPSEEK_API_KEY");
const BASE_URL = "https://api.deepseek.com";

const RATE_LIMIT = 5;  // 5 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window

// Load cards data for keyword lookups
const allCards = staticCardsData as Card[];

export async function POST(request: Request) {
  try {
    console.log("[API] Interpret request started");
    
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
      console.error("[API] DEEPSEEK_API_KEY not set");
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return new Response(JSON.stringify({ error: "Cards required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { question, cards, spreadId } = body;
    const cardCount = cards.length;

    // Check if spread is disabled (premium feature)
    const spread = COMPREHENSIVE_SPREADS.find(s => s.id === spreadId);
    if (spread?.disabled) {
      return new Response(
        JSON.stringify({
          error: `${spread.label} is available for Ko-Fi supporters`,
          disabled: true,
          supporterLink: "https://ko-fi.com",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Enrich cards with keywords for better AI grounding
    const cardsWithKeywords = cards.map((c: { id: number; name: string }) => {
      const cardData = allCards.find((card: Card) => card.id === c.id);
      return {
        id: c.id,
        name: c.name,
        keywords: cardData?.keywords || [],
      };
    });

    const prompt = buildPrompt(
      cardsWithKeywords,
      spreadId || "sentence-3",
      question || "What do the cards show?",
    );

     // Timeout to stay under 10s maxDuration with buffer
     const timeoutMs = 8500; // 8.5 seconds max for DeepSeek API call
     const maxTokens = getTokenBudget(cardCount);

     const abortController = new AbortController();
     const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

     console.log("[API] Calling DeepSeek API with 8.5s timeout, maxTokens:", maxTokens);
    
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
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: abortController.signal,
    });

     clearTimeout(timeoutId);

     if (!response.ok) {
       const errorText = await response.text();
       console.error("[API] DeepSeek API error:", response.status, errorText);
       throw new Error(`API error: ${response.status}`);
     }
     
     console.log("[API] DeepSeek response OK");

     const responseData = await response.json();
     const reading = responseData.choices?.[0]?.message?.content || "";
     
     if (!reading) {
       throw new Error("No content in API response");
     }

     // Return as JSON
     return new Response(
       JSON.stringify({
         reading,
         source: "deepseek",
       }),
       {
         status: 200,
         headers: {
           "Content-Type": "application/json",
           "Cache-Control": "no-cache",
           "X-RateLimit-Limit": String(rateLimitResult.limit),
           "X-RateLimit-Remaining": String(rateLimitResult.remaining),
           "X-RateLimit-Reset": String(rateLimitResult.reset),
         },
       }
     );
  } catch (error: any) {
    console.error("[API] Interpret error:", error.name, error.message);
    
    const isTimeout = error.name === "AbortError" || 
                      error.message?.includes("abort") ||
                      error.message?.includes("timeout");
    
    return new Response(
      JSON.stringify({
        error: isTimeout ? "AI response timed out" : "Reading failed",
        reading: isTimeout 
          ? "The AI took too long to respond. Tap to retry, or check the traditional meanings of your cards below."
          : "Unable to generate a reading right now. Please check the traditional card meanings below, or try again.",
        source: "fallback",
        timedOut: isTimeout,
        partial: true,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
}
