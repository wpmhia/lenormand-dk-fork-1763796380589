import { useState, useCallback, useRef } from "react";
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
  followUpResponse: string | null;
  followUpLoading: boolean;
  followUpStreaming: boolean;
  submitFollowUp: (question: string) => void;
}

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY = 1000;

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
  const [followUpResponse, setFollowUpResponse] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpStreaming, setFollowUpStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startAnalysis = useCallback(async () => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!enabled || drawnCards.length === 0) return;

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);

    let lastError: any = null;
    abortControllerRef.current = new AbortController();

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const cards = drawnCards.map((card) => {
          const cardData = getCardById(allCards, card.id);
          return { id: card.id, name: cardData?.name || `Card ${card.id}`, position: card.position };
        });

        const response = await fetch("/api/readings/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, cards, spreadId: selectedSpreadId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 429 && attempt < MAX_RETRIES - 1) {
            const retryAfter = parseInt(data.retryAfter || "5", 10);
            await new Promise(resolve => setTimeout(resolve, Math.min(retryAfter * 1000, 30000)));
            continue;
          }
          throw new Error(data.error || "Failed to get reading");
        }

        const contentType = response.headers.get("content-type");
        const isStreamResponse = contentType?.includes("text/event-stream");

        if (isStreamResponse) {
          setIsLoading(false);
          setIsStreaming(true);
          
          const reader = response.body?.getReader() || null;
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
                    setAiReading({ reading: fullReading, source: "mistral" });
                  } else if (event.type === "done") {
                    setIsStreaming(false);
                    break;
                  } else if (event.type === "error") {
                    throw new Error(event.error || event.message || "Reading failed");
                  }
                }
              }

              for (const event of finalizeSSEStream(buffer)) {
                if (event.type === "chunk" && event.content) {
                  fullReading += event.content;
                  setAiReading({ reading: fullReading, source: "mistral" });
                }
              }
            } finally {
              reader.releaseLock();
            }
          }
          
          setIsStreaming(false);
          if (!fullReading) throw new Error("No reading received");
        } else {
          const data = await response.json();
          if (!data.reading) throw new Error("No reading received");
          setAiReading(data);
        }

        lastError = null;
        break;
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Don't set error on abort, just exit
          return;
        }
        lastError = err;
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, INITIAL_RETRY_DELAY * Math.pow(2, attempt)));
        }
      }
    }

    if (lastError) setError(lastError.message || "Something went wrong");
    setIsLoading(false);
    setIsStreaming(false);
    abortControllerRef.current = null;
  }, [question, drawnCards, allCards, selectedSpreadId, enabled]);

  const resetAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (followUpAbortControllerRef.current) {
      followUpAbortControllerRef.current.abort();
      followUpAbortControllerRef.current = null;
    }
    setAiReading(null);
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
    setFollowUpResponse(null);
    setFollowUpLoading(false);
    setFollowUpStreaming(false);
  }, []);

  const followUpAbortControllerRef = useRef<AbortController | null>(null);

  const submitFollowUp = useCallback(async (followUpQuestion: string) => {
    if (!aiReading?.reading || drawnCards.length === 0) return;

    // Abort any previous follow-up request
    if (followUpAbortControllerRef.current) {
      followUpAbortControllerRef.current.abort();
    }

    setFollowUpLoading(true);
    setFollowUpStreaming(false);
    followUpAbortControllerRef.current = new AbortController();

    try {
      const cards = drawnCards.map((card) => {
        const cardData = getCardById(allCards, card.id);
        return { id: card.id, name: cardData?.name || `Card ${card.id}`, position: card.position };
      });

      const response = await fetch("/api/readings/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followUpQuestion,
          originalReading: aiReading.reading,
          cards,
          spreadId: selectedSpreadId,
        }),
        signal: followUpAbortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get follow-up");
      }

      const contentType = response.headers.get("content-type");
      const isStreamResponse = contentType?.includes("text/event-stream");

      if (isStreamResponse) {
        setFollowUpLoading(false);
        setFollowUpStreaming(true);

        const reader = response.body?.getReader() || null;
        const decoder = new TextDecoder();
        let fullResponse = "";
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
                  fullResponse += event.content;
                  setFollowUpResponse(fullResponse);
                } else if (event.type === "done") {
                  break;
                } else if (event.type === "error") {
                  throw new Error(event.error || "Follow-up failed");
                }
              }
            }

            for (const event of finalizeSSEStream(buffer)) {
              if (event.type === "chunk" && event.content) {
                fullResponse += event.content;
                setFollowUpResponse(fullResponse);
              }
            }
          } finally {
            reader.releaseLock();
          }
        }

        setFollowUpStreaming(false);
      } else {
        const data = await response.json();
        setFollowUpResponse(data.reading || data.response || "No response received");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setFollowUpResponse("Sorry, I couldn't process your follow-up question. Please try again.");
      }
    } finally {
      setFollowUpLoading(false);
      setFollowUpStreaming(false);
      followUpAbortControllerRef.current = null;
    }
  }, [aiReading, drawnCards, allCards, selectedSpreadId]);

  return {
    aiReading,
    isLoading,
    isStreaming,
    error,
    startAnalysis,
    resetAnalysis,
    followUpResponse,
    followUpLoading,
    followUpStreaming,
    submitFollowUp,
  };
}
