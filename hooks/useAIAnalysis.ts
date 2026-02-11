import { useState, useCallback } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { getCardById } from "@/lib/data";
import { processSSEChunk, finalizeSSEStream } from "@/lib/sse-parser";

interface UseAIAnalysisReturn {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  startAnalysis: () => void;
  resetAnalysis: () => void;
}

const MAX_RETRIES = 2; // Retry on transient errors
const INITIAL_RETRY_DELAY = 1000; // 1 second

export function useAIAnalysis(
  question: string,
  drawnCards: ReadingCard[],
  allCards: CardType[],
  selectedSpreadId: string,
  enabled: boolean = true
): UseAIAnalysisReturn {
  const [aiReading, setAiReading] = useState<AIReadingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async () => {
    if (!enabled || drawnCards.length === 0) return;

    // Prevent concurrent requests (race condition fix)
    setIsLoading(true);
    setIsStreaming(false);
    setError(null);

    let lastError: any = null;
    let abortController: AbortController | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let reader: ReadableStreamDefaultReader<Uint8Array> | null | undefined = null;
      
      try {
        const cards = drawnCards.map((card) => {
          const cardData = getCardById(allCards, card.id);
          return {
            id: card.id,
            name: cardData?.name || `Card ${card.id}`,
            position: card.position,
          };
        });

        // Use abort controller to cancel requests on unmount
        abortController = new AbortController();

        // Use streaming endpoint
        const response = await fetch("/api/readings/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            cards,
            spreadId: selectedSpreadId,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const data = await response.json();

          // Rate limit - use exponential backoff
          if (response.status === 429) {
            const retryAfter = parseInt(data.retryAfter || "5", 10);
            const delayMs = Math.min(retryAfter * 1000, 30000);

            if (attempt < MAX_RETRIES - 1) {
              console.log(`[useAIAnalysis] Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
              continue;
            }
          }

          throw new Error(data.error || "Failed to get reading");
        }

        // Check if streaming response
        const contentType = response.headers.get("content-type");
        const isStreamResponse = contentType?.includes("text/event-stream");
        console.log("[useAIAnalysis] Response content-type:", contentType, "isStream:", isStreamResponse);

        if (isStreamResponse) {
          // Handle SSE streaming using shared parser
          console.log("[useAIAnalysis] Starting SSE stream processing");
          setIsLoading(false);
          setIsStreaming(true);
          
          reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullReading = "";
          let buffer = "";

          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const { events, buffer: newBuffer } = processSSEChunk(chunk, buffer);
                buffer = newBuffer;

                for (const event of events) {
                  if (event.type === "chunk" && event.content) {
                    fullReading += event.content;
                    console.log("[useAIAnalysis] Chunk received, total length:", fullReading.length);
                    setAiReading({ reading: fullReading, source: "deepseek" });
                  } else if (event.type === "done") {
                    setIsStreaming(false);
                    break;
                  } else if (event.type === "error") {
                    console.error("[useAIAnalysis] Stream error event:", event);
                    throw new Error(event.error || event.message || "Reading failed");
                  }
                }
              }

              // Process any remaining buffered data
              const finalEvents = finalizeSSEStream(buffer);
              for (const event of finalEvents) {
                if (event.type === "chunk" && event.content) {
                  fullReading += event.content;
                  console.log("[useAIAnalysis] Final chunk received, total length:", fullReading.length);
                  setAiReading({ reading: fullReading, source: "deepseek" });
                }
              }

              // Finalize decoder to handle any remaining bytes
              const finalChunk = decoder.decode();
              if (finalChunk.trim()) {
                console.warn("[useAIAnalysis] Decoder had remaining bytes:", finalChunk.length);
              }
            } finally {
              // Always release the reader lock
              reader.releaseLock();
              reader = null;
            }
          }
          
          setIsStreaming(false);
          
          if (!fullReading) {
            throw new Error("No reading received");
          }
        } else {
          // Fallback: Handle JSON response
          const data = await response.json();
          if (!data.reading) {
            throw new Error("No reading received");
          }
          setAiReading(data);
        }

        lastError = null;
        break; // Success, exit retry loop
      } catch (err: any) {
        // Clean up reader on error
        if (reader) {
          try {
            reader.releaseLock();
          } catch (e) {
            // Already released or closed
          }
          reader = null;
        }

        // Check if this was an abort error
        if (err.name === "AbortError") {
          console.log("[useAIAnalysis] Request aborted");
          break; // Don't retry aborted requests
        }

        lastError = err;
        
        // Exponential backoff for retries
        if (attempt < MAX_RETRIES - 1) {
          const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`[useAIAnalysis] Attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`, err.message);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    if (lastError) {
      setError(lastError.message || "Something went wrong");
    }

    setIsLoading(false);
    setIsStreaming(false);
  }, [question, drawnCards, allCards, selectedSpreadId, enabled]);

  const resetAnalysis = useCallback(() => {
    setAiReading(null);
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  return {
    aiReading,
    isLoading,
    isStreaming,
    error,
    startAnalysis,
    resetAnalysis,
  };
}
