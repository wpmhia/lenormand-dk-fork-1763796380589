import { processSSEChunk, finalizeSSEStream } from "@/lib/sse-parser";

export interface StreamOptions {
  endpoint: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
}

export async function streamReadingResponse({
  endpoint,
  body,
  signal,
  onChunk,
  onDone,
  onError,
  maxRetries = 2,
}: StreamOptions): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 429 && attempt < maxRetries) {
          const retryAfter = parseInt(data.retryAfter || "5", 10);
          await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000, 30000)));
          continue;
        }
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      const isStream = response.headers.get("content-type")?.includes("text/event-stream");

      if (isStream) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const { events, buffer: newBuffer } = processSSEChunk(chunk, buffer);
            buffer = newBuffer;

            for (const event of events) {
              if (event.type === "chunk" && event.content) {
                onChunk(event.content);
              } else if (event.type === "done") {
                onDone?.();
              } else if (event.type === "error") {
                throw new Error(event.error || "Stream error");
              }
            }
          }

          for (const event of finalizeSSEStream(buffer)) {
            if (event.type === "chunk" && event.content) {
              onChunk(event.content);
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        const data = await response.json();
        const text = data.reading || data.response || data.text || "";
        if (text) onChunk(text);
      }

      onDone?.();
      lastError = null;
      break;
    } catch (err: any) {
      if (err.name === "AbortError") return;
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  if (lastError) onError?.(lastError);
}
