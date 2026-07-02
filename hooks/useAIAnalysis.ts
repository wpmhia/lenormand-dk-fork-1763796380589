import { useState, useCallback, useRef, useEffect } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { getCardById } from "@/lib/data";
import { streamReadingResponse } from "@/lib/stream-reading";

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
  const followUpAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      followUpAbortControllerRef.current?.abort();
    };
  }, []);

  const mapCards = useCallback(
    () =>
      drawnCards.map((card) => {
        const cardData = getCardById(allCards, card.id);
        return { id: card.id, name: cardData?.name || `Card ${card.id}`, position: card.position };
      }),
    [drawnCards, allCards],
  );

  const startAnalysis = useCallback(async () => {
    abortControllerRef.current?.abort();
    if (!enabled || drawnCards.length === 0) return;

    setIsLoading(true);
    setIsStreaming(false);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let fullReading = "";
    await streamReadingResponse({
      endpoint: "/api/readings/interpret",
      body: { question, cards: mapCards(), spreadId: selectedSpreadId },
      signal: controller.signal,
      onChunk(text) {
        fullReading += text;
        setAiReading({ reading: fullReading, source: "mistral" });
      },
      onDone() {
        setIsStreaming(false);
        if (!fullReading) setError("No reading received");
      },
      onError(err) {
        setError(err.message);
      },
    });

    setIsLoading(false);
    setIsStreaming(false);
    abortControllerRef.current = null;
  }, [question, drawnCards, allCards, selectedSpreadId, enabled, mapCards]);

  const resetAnalysis = useCallback(() => {
    abortControllerRef.current?.abort();
    followUpAbortControllerRef.current?.abort();
    setAiReading(null);
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
    setFollowUpResponse(null);
    setFollowUpLoading(false);
    setFollowUpStreaming(false);
  }, []);

  const submitFollowUp = useCallback(
    async (followUpQuestion: string) => {
      if (!aiReading?.reading || drawnCards.length === 0) return;

      followUpAbortControllerRef.current?.abort();
      const controller = new AbortController();
      followUpAbortControllerRef.current = controller;

      setFollowUpLoading(true);
      setFollowUpStreaming(false);

      let fullResponse = "";
      await streamReadingResponse({
        endpoint: "/api/readings/followup",
        body: {
          followUpQuestion,
          originalReading: aiReading.reading,
          cards: mapCards(),
          spreadId: selectedSpreadId,
        },
        signal: controller.signal,
        onChunk(text) {
          fullResponse += text;
          setFollowUpResponse(fullResponse);
        },
        onDone() {
          setFollowUpStreaming(false);
        },
        onError() {
          setFollowUpResponse("Sorry, I couldn't process your follow-up question. Please try again.");
        },
      });

      setFollowUpLoading(false);
      setFollowUpStreaming(false);
      followUpAbortControllerRef.current = null;
    },
    [aiReading, drawnCards, selectedSpreadId, mapCards],
  );

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
