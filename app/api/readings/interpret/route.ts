export const dynamic = "force-dynamic";

import { buildPrompt, getMaxTokens, isDeepSeekAvailable } from "@/lib/ai-config";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

// Simple in-memory cache for request deduplication
const requestCache = new Map<string, {
  response: Response;
  timestamp: number;
  promise?: Promise<Response>;
}>();

// Cache duration: 30 minutes (extended from 5 minutes for better performance)
const CACHE_DURATION = 30 * 60 * 1000;

function getCacheKey(cards: any[], question: string, spreadId?: string): string {
  const cardIds = cards.map(c => `${c.id}-${c.name}`).sort().join('|');
  return `${cardIds}:${question}:${spreadId || 'sentence-3'}`;
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
}

const logger = {
  info: (msg: string, data?: any) =>
    console.log(`[INFO] ${msg}`, data ? JSON.stringify(data, null, 2) : ""),
  warn: (msg: string, data?: any) =>
    console.warn(`[WARN] ${msg}`, data ? JSON.stringify(data, null, 2) : ""),
  error: (msg: string, data?: any) =>
    console.error(`[ERROR] ${msg}`, data ? JSON.stringify(data, null, 2) : ""),
};

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: "Request body is empty" };
  }

  if (!body.cards || !Array.isArray(body.cards)) {
    return { valid: false, error: "Cards must be provided as an array" };
  }

  if (body.cards.length === 0) {
    return { valid: false, error: "At least one card is required" };
  }

  if (body.cards.length > 36) {
    return { valid: false, error: "Maximum 36 cards allowed" };
  }

  for (let i = 0; i < body.cards.length; i++) {
    const card = body.cards[i];
    if (!card.id || !card.name) {
      return { valid: false, error: `Card ${i + 1} is missing id or name` };
    }
  }

  if (!body.question || typeof body.question !== "string") {
    return { valid: false, error: "Question is required" };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  logger.info(`[${requestId}] POST /api/readings/interpret - Request received`);

  // Clean expired cache entries
  cleanCache();

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      logger.warn(`[${requestId}] Failed to parse JSON`, { error: String(e) });
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isDeepSeekAvailable()) {
      logger.warn(`[${requestId}] DeepSeek API key not configured`);
      return new Response(
        JSON.stringify({ error: "AI interpretation is not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      logger.warn(`[${requestId}] Validation failed`, { error: validation.error });
      return new Response(
        JSON.stringify({ error: validation.error || "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, cards, spreadId, _fallback } = body;

    // Check cache for identical requests
    const cacheKey = getCacheKey(cards, question, spreadId);
    const cached = requestCache.get(cacheKey);
    
    if (cached && !cached.promise) {
      logger.info(`[${requestId}] Cache hit for request`, { cacheKey });
      return cached.response.clone();
    }

    // If there's an ongoing request for the same cache key, wait for it
    if (cached?.promise) {
      logger.info(`[${requestId}] Waiting for existing request`, { cacheKey });
      try {
        const response = await cached.promise;
        return response.clone();
      } catch (error) {
        // If the cached request failed, remove it and proceed
        requestCache.delete(cacheKey);
      }
    }

    const prompt = buildPrompt(cards, spreadId || "sentence-3", question);
    const maxTokens = getMaxTokens(cards.length);

    logger.info(`[${requestId}] ${_fallback ? "Non-streaming" : "Streaming"} response`, {
      cardCount: cards.length,
      spreadId: spreadId || "sentence-3",
      maxTokens,
    });

    // Create and cache the request for deduplication
    const requestPromise = (async () => {
      const deepseekResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
        stream: !_fallback,
      }),
    });

      if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      logger.error(`[${requestId}] DeepSeek API error`, { status: deepseekResponse.status, error: errorText });
        throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
      }

      if (!deepseekResponse.body) {
        throw new Error("No response body from DeepSeek");
      }

      if (_fallback) {
        const data = await deepseekResponse.json();
        const content = data.choices?.[0]?.message?.content || "";
        return new Response(
          JSON.stringify({ reading: content }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      logger.info(`[${requestId}] Passing through raw stream`);

      return new Response(deepseekResponse.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    })();

    // Cache the promise for deduplication
    requestCache.set(cacheKey, {
      response: new Response(new ReadableStream(), {
        headers: { "Content-Type": "text/event-stream" },
      }),
      timestamp: Date.now(),
      promise: requestPromise,
    });

    try {
      const response = await requestPromise;
      // Update cache with actual response
      requestCache.set(cacheKey, {
        response,
        timestamp: Date.now(),
      });
      return response;
    } catch (error) {
      // Remove failed request from cache
      requestCache.delete(cacheKey);
      throw error;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(`[${requestId}] Unhandled error`, {
      duration: `${duration}ms`,
      error: errorMsg,
      stack: errorStack,
    });

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while generating the reading",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }
    );
  }
}
