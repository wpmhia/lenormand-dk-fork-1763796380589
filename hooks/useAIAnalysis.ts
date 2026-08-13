import { useState, useCallback, useRef, useEffect } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { getCardById } from "@/lib/data";
import { SignificatorType } from "@/lib/spreads";
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

function significatorToPreference(value: SignificatorType): "woman" | "man" | "both" {
  if (value === "anima") return "woman";
  if (value === "animus") return "man";
  return "both";
}

export function useAIAnalysis(
  question: string,
  drawnCards: ReadingCard[],
  allCards: CardType[],
  selectedSpreadId: string,
  enabled: boolean = true,
  significatorType: SignificatorType = "none"
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
    setIsStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let fullReading = "";
    await streamReadingResponse({
      endpoint: "/api/readings/interpret",
      body: {
        question,
        cards: mapCards(),
        spreadId: selectedSpreadId,
        significatorPreference: significatorToPreference(significatorType),
      },
      signal: controller.signal,
      onChunk(text) {
        fullReading += text;
        setAiReading({ reading: fullReading, source: "mistral" });
      },
      onRetry() {
        fullReading = "";
      },
      onDone() {
        setIsStreaming(false);
        if (!fullReading) setError("No reading received");
      },
      onError(err) {
        setIsStreaming(false);
        setError(err.message);
      },
    });

    setIsLoading(false);
    setIsStreaming(false);
    abortControllerRef.current = null;
  }, [question, drawnCards, allCards, selectedSpreadId, enabled, mapCards, significatorType]);

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
      setFollowUpStreaming(true);

      let fullResponse = "";
      await streamReadingResponse({
        endpoint: "/api/readings/followup",
        body: {
          followUpQuestion,
          originalReading: aiReading.reading,
          originalQuestion: question,
          cards: mapCards(),
          spreadId: selectedSpreadId,
          significatorPreference: significatorToPreference(significatorType),
        },
        signal: controller.signal,
        onChunk(text) {
          fullResponse += text;
          setFollowUpResponse(fullResponse);
        },
        onRetry() {
          fullResponse = "";
        },
        onDone() {
          setFollowUpStreaming(false);
        },
        onError() {
          setFollowUpStreaming(false);
          setFollowUpResponse("Sorry, I couldn't process your follow-up question. Please try again.");
        },
      });

      setFollowUpLoading(false);
      setFollowUpStreaming(false);
      followUpAbortControllerRef.current = null;
    },
    [aiReading, drawnCards, selectedSpreadId, mapCards, significatorType, question],
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
