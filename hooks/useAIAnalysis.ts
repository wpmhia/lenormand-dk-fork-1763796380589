import { useState, useCallback } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { getCardById } from "@/lib/data";

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

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);

    let lastError: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const cards = drawnCards.map((card) => {
          const cardData = getCardById(allCards, card.id);
          return {
            id: card.id,
            name: cardData?.name || `Card ${card.id}`,
            position: card.position,
          };
        });

        // Use streaming endpoint
        const response = await fetch("/api/readings/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            cards,
            spreadId: selectedSpreadId,
          }),
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
          // Handle SSE streaming with proper line buffering
          console.log("[useAIAnalysis] Starting SSE stream processing");
          setIsLoading(false);
          setIsStreaming(true);
          
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullReading = "";
          let buffer = ""; // Buffer for incomplete lines

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Decode chunk and add to buffer
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              // Process complete lines
              const lines = buffer.split("\n");
              // Keep the last incomplete line in buffer
              buffer = lines[lines.length - 1];

              // Process all complete lines (all except the last one)
              for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i];
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);

                  if (data === "[DONE]") continue;

                  try {
                    const parsed = JSON.parse(data);

                    if (parsed.type === "chunk" && parsed.content) {
                      fullReading += parsed.content;
                      // Update reading progressively
                      console.log("[useAIAnalysis] Chunk received, total length:", fullReading.length);
                      setAiReading({ reading: fullReading, source: "deepseek" });
                    } else if (parsed.type === "done") {
                      setIsStreaming(false);
                      break;
                    } else if (parsed.type === "error") {
                      console.error("[useAIAnalysis] Stream error event:", parsed);
                      throw new Error(parsed.error || parsed.message || "Reading failed");
                    }
                  } catch (e) {
                    // Only ignore JSON parse errors, not thrown errors
                    if (e instanceof SyntaxError) {
                      // Ignore incomplete JSON chunks, will retry when more data arrives
                      console.log("[useAIAnalysis] Skipping incomplete JSON, will retry: ", data.substring(0, 50));
                    } else {
                      throw e;
                    }
                  }
                }
              }
            }

            // Process any remaining buffered data
            if (buffer.trim()) {
              if (buffer.startsWith("data: ")) {
                const data = buffer.slice(6);
                if (data !== "[DONE]") {
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === "chunk" && parsed.content) {
                      fullReading += parsed.content;
                      console.log("[useAIAnalysis] Final chunk received, total length:", fullReading.length);
                      setAiReading({ reading: fullReading, source: "deepseek" });
                    }
                  } catch (e) {
                    console.warn("[useAIAnalysis] Failed to parse final buffer:", e);
                  }
                }
              }
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
