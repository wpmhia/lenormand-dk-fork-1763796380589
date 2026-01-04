export const dynamic = "force-dynamic";

import { streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { buildPrompt, getMaxTokens, isDeepSeekAvailable } from "@/lib/ai-config";

const deepseek = createDeepSeek({
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

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
    return { valid: false, error: "Question must be a non-empty string" };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  logger.info(`[${requestId}] POST /api/readings/interpret - Request received`);

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

    const { question, cards, spreadId } = body;

    const prompt = buildPrompt(cards, spreadId || "sentence-3", question);
    const maxTokens = getMaxTokens(cards.length);

    logger.info(`[${requestId}] Streaming response`, {
      cardCount: cards.length,
      spreadId: spreadId || "sentence-3",
      maxTokens,
    });

    try {
      const result = await streamText({
        model: deepseek("deepseek-chat"),
        prompt,
        temperature: 0.4,
        maxOutputTokens: maxTokens,
      });

      logger.info(`[${requestId}] Stream initiated, returning response`);

      return result.toTextStreamResponse();
    } catch (streamError) {
      logger.error(`[${requestId}] Stream error`, {
        error: streamError instanceof Error ? streamError.message : String(streamError),
      });
      throw streamError;
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
