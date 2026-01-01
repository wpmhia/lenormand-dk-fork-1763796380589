export const dynamic = "force-dynamic";

import { streamAIReading, AIReadingRequest } from "@/lib/deepseek";

const logger = {
  info: (msg: string, data?: any) =>
    console.log(`[INFO] ${msg}`, data ? JSON.stringify(data, null, 2) : ""),
  warn: (msg: string, data?: any) =>
    console.warn(`[WARN] ${msg}`, data ? JSON.stringify(data, null, 2) : ""),
  error: (msg: string, data?: any) =>
    console.error(`[ERROR] ${msg}`, data ? JSON.stringify(data, null, 2) : ""),
};

function validateStreamRequest(body: any): { valid: boolean; error?: string } {
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

function parseStreamingResponse(line: string): { content: string; finishReason: string | null } | null {
  if (!line.startsWith("data: ")) return null;

  const data = line.slice(6).trim();
  if (data === "[DONE]") return { content: "", finishReason: "stop" };

  try {
    const parsed = JSON.parse(data);
    const delta = parsed.choices?.[0]?.delta;
    const finishReason = parsed.choices?.[0]?.finish_reason || null;
    return { content: delta?.content || "", finishReason };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);

  logger.info(
    `[${requestId}] POST /api/readings/interpret/stream - Request received`,
  );

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      logger.warn(`[${requestId}] Failed to parse JSON`, { error: String(e) });
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    logger.info(`[${requestId}] Request validation starting`, {
      cardCount: body?.cards?.length,
      hasQuestion: !!body?.question,
      spreadId: body?.spreadId,
    });

    const validation = validateStreamRequest(body);
    if (!validation.valid) {
      logger.warn(`[${requestId}] Validation failed`, {
        error: validation.error,
      });
      return new Response(
        JSON.stringify({ error: validation.error || "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    logger.info(`[${requestId}] Validation passed, calling streamAIReading`, {
      cardCount: body.cards.length,
      spreadId: body.spreadId || "default",
    });

    const stream = await streamAIReading(body as AIReadingRequest);

    if (!stream) {
      logger.error(`[${requestId}] streamAIReading returned null`);
      return new Response(
        JSON.stringify({ error: "Failed to generate reading" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const reader = stream.getReader();
    const encoder = new TextEncoder();
    let chunkCount = 0;

    logger.info(`[${requestId}] Streaming started`);

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                if (buffer.trim()) {
                  const content = parseStreamingResponse(buffer);
                  if (content) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ content })}\n\n`,
                      ),
                    );
                    chunkCount++;
                  }
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();

                const duration = Date.now() - startTime;
                logger.info(`[${requestId}] Stream completed`, {
                  duration: `${duration}ms`,
                  chunks: chunkCount,
                });
                break;
              }

              buffer += new TextDecoder().decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.trim()) {
                  const content = parseStreamingResponse(line);
                  if (content !== null) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ content })}\n\n`,
                      ),
                    );
                    chunkCount++;
                  }
                }
              }
            }
          } catch (error) {
            const duration = Date.now() - startTime;
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            logger.error(`[${requestId}] Stream error`, {
              duration: `${duration}ms`,
              chunks: chunkCount,
              error: errorMsg,
            });
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Request-ID": requestId,
        },
      },
    );
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
        error: "An unexpected error occurred while streaming the reading",
        requestId: requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      },
    );
  }
}
