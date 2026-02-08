/**
 * Streaming Response Helper
 * 
 * Utility for handling streamed AI responses safely and efficiently.
 * Reduces duplication in streaming code across different routes.
 */

/**
 * Safely stream a readable stream to a response
 * Handles errors and cleanup automatically
 */
export async function streamResponse(
  readableStream: ReadableStream<Uint8Array>,
  onError?: (error: Error) => void,
): Promise<Response> {
  try {
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err);
    throw err;
  }
}

/**
 * Create a text encoder for streaming chunks
 */
const encoder = new TextEncoder();

/**
 * Helper to write a chunk to a stream writer
 */
export async function writeChunk(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  text: string,
): Promise<void> {
  const encoded = encoder.encode(text);
  await writer.write(encoded);
}

/**
 * Helper to write multiple chunks with delays
 * Useful for simulating natural streaming output
 */
export async function writeChunksWithDelay(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  chunks: string[],
  delayMs: number = 0,
): Promise<void> {
  for (const chunk of chunks) {
    await writeChunk(writer, chunk);
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Create a streaming response from an async generator
 */
export function createStreamingResponse(
  generator: AsyncGenerator<string, void, unknown>,
): Response {
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    },
  );
}

/**
 * Parse streaming response chunks
 */
export async function* parseStreamingResponse(
  response: Response,
): AsyncGenerator<string, void, unknown> {
  if (!response.body) {
    throw new Error("Response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          yield line;
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      yield buffer;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Safely handle stream timeouts
 */
export function withStreamTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Stream timeout after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}
