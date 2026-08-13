"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { getCardById } from "@/lib/data";
import { SignificatorType } from "@/lib/spreads";

interface UseAIAnalysisReturn {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
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

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return data.error || data.reading || fallback;
  } catch {
    return fallback;
  }
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
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/readings/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          cards: mapCards(),
          spreadId: selectedSpreadId,
          significatorPreference: significatorToPreference(significatorType),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Request failed (${response.status})`));
      }

      const data = await response.json();
      const text: string = data.reading || "";
      if (!text.trim()) throw new Error("No reading received");
      setAiReading({ reading: text, source: data.source || "mistral" });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Processing failed");
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [question, drawnCards, allCards, selectedSpreadId, enabled, mapCards, significatorType]);

  const resetAnalysis = useCallback(() => {
    abortControllerRef.current?.abort();
    followUpAbortControllerRef.current?.abort();
    setAiReading(null);
    setError(null);
    setIsLoading(false);
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
      setFollowUpResponse("");

      let fullResponse = "";
      try {
        const response = await fetch("/api/readings/followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followUpQuestion,
            originalReading: aiReading.reading,
            originalQuestion: question,
            cards: mapCards(),
            spreadId: selectedSpreadId,
            significatorPreference: significatorToPreference(significatorType),
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(await readErrorMessage(response, "Request failed"));
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            if (text) {
              fullResponse += text;
              setFollowUpResponse(fullResponse);
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setFollowUpResponse(
          fullResponse || "Sorry, I couldn't process your follow-up question. Please try again.",
        );
      } finally {
        setFollowUpLoading(false);
        setFollowUpStreaming(false);
        followUpAbortControllerRef.current = null;
      }
    },
    [aiReading, drawnCards, selectedSpreadId, mapCards, significatorType, question],
  );

  return {
    aiReading,
    isLoading,
    error,
    startAnalysis,
    resetAnalysis,
    followUpResponse,
    followUpLoading,
    followUpStreaming,
    submitFollowUp,
  };
}
