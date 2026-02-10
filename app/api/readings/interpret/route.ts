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

// Simple in-memory cache for readings (edge runtime compatible)
const readingsCache = new Map<string, { reading: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const MAX_CACHE_SIZE = 100;

// Generate cache key from request
function getCacheKey(cards: any[], question: string, spreadId: string): string {
  const cardIds = cards.map(c => c.id).sort().join('-');
  return `${cardIds}:${question}:${spreadId}`;
}

// Clean old cache entries
function cleanCache() {
  if (readingsCache.size <= MAX_CACHE_SIZE) return;
  
  const now = Date.now();
  const entries = Array.from(readingsCache.entries());
  
  // Remove expired entries
  for (const [key, value] of entries) {
    if (now - value.timestamp > CACHE_TTL) {
      readingsCache.delete(key);
    }
  }
  
  // If still too large, remove oldest entries
  if (readingsCache.size > MAX_CACHE_SIZE) {
    const sorted = Array.from(readingsCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = sorted.slice(0, sorted.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => readingsCache.delete(key));
  }
}

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

     // Check cache first
    const cacheKey = getCacheKey(cards, question || "What do the cards show?", spreadId || "sentence-3");
    const now = Date.now();
    const cached = readingsCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log("[API] Returning cached reading");
      return new Response(
        JSON.stringify({
          reading: cached.reading,
          source: "deepseek",
          cached: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        }
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

     // More generous timeout - 9.2s to allow complete responses
     const timeoutMs = 9200;
     const maxTokens = getTokenBudget(cardCount);

     const abortController = new AbortController();
     const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

     console.log("[API] Calling DeepSeek API with 9.2s timeout, maxTokens:", maxTokens);
     
     // Retry logic for transient failures
     let lastError: Error | null = null;
     let response: Response | null = null;
     const maxRetries = 2;
     
     for (let attempt = 0; attempt <= maxRetries; attempt++) {
       try {
         response = await fetch(`${BASE_URL}/chat/completions`, {
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
         
         if (response.ok) {
           break; // Success
         }
         
         // Only retry on 5xx errors (server errors)
         if (response.status >= 500 && attempt < maxRetries) {
           console.log(`[API] DeepSeek API error ${response.status}, retrying (${attempt + 1}/${maxRetries})...`);
           await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
           continue;
         }
         
         // Client errors (4xx) - don't retry
         const errorText = await response.text();
         console.error("[API] DeepSeek API error:", response.status, errorText);
         throw new Error(`API error: ${response.status}`);
         
       } catch (error: any) {
         lastError = error;
         if (error.name === "AbortError" || attempt === maxRetries) {
           throw error;
         }
         console.log(`[API] Request failed, retrying (${attempt + 1}/${maxRetries})...`);
         await new Promise(resolve => setTimeout(resolve, 300));
       }
     }

     clearTimeout(timeoutId);

     if (!response || !response.ok) {
       throw lastError || new Error("API request failed");
     }
     
     console.log("[API] DeepSeek response OK");

     const responseData = await response.json();
     const reading = responseData.choices?.[0]?.message?.content || "";
     
     if (!reading) {
       throw new Error("No content in API response");
     }
     
     // Cache the successful response
     cleanCache();
     readingsCache.set(cacheKey, { reading, timestamp: Date.now() });

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
           "Cache-Control": "public, max-age=300", // 5min cache for identical requests
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
    
    // Return proper error status instead of 200 to track real errors
    const status = isTimeout ? 504 : 500;
    
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
      { status, headers: { "Content-Type": "application/json" } },
    );
  }
}
