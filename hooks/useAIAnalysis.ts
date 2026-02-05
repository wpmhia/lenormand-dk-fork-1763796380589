import { useState, useCallback } from "react";
import { AIReadingResponse } from "@/lib/ai-config";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { getCardById } from "@/lib/data";

interface UseAIAnalysisReturn {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  error: string | null;
  startAnalysis: () => void;
  resetAnalysis: () => void;
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
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async () => {
    if (!enabled || drawnCards.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const cards = drawnCards.map((card) => {
        const cardData = getCardById(allCards, card.id);
        return {
          id: card.id,
          name: cardData?.name || `Card ${card.id}`,
          position: card.position,
        };
      });

      const response = await fetch("/api/readings/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          cards,
          spreadId: selectedSpreadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get reading");
      }

      setAiReading({
        reading: data.reading,
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [question, drawnCards, allCards, selectedSpreadId, enabled]);

  const resetAnalysis = useCallback(() => {
    setAiReading(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    aiReading,
    isLoading,
    error,
    startAnalysis,
    resetAnalysis,
  };
}
