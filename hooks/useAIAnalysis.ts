import { useState, useCallback } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { getCardById } from "@/lib/data";

interface UseAIAnalysisReturn {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  error: string | null;
  startAnalysis: () => void;
  resetAnalysis: () => void;
}

const MAX_RETRIES = 1; // Reduced from 3 to prevent request multiplication
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
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async () => {
    if (!enabled || drawnCards.length === 0) return;

    setIsLoading(true);
    setError(null);

    let lastError: any = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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

         // Parse JSON response
         const data = await response.json();
         const fullReading = data.reading;

         if (!fullReading) {
           throw new Error("No reading received");
         }

         setAiReading({ reading: fullReading });
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
