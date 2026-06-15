"use client";

import { useEffect, useRef } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card } from "@/lib/types";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { useToast } from "@/hooks/use-toast";

export function useAutoSaveReading(
  aiReading: AIReadingResponse | null,
  aiStreaming: boolean,
  step: string,
  drawnCardTypes: Card[],
  readingSaved: boolean,
  question: string,
  spreadLabel: string,
  setReadingSaved: (v: boolean) => void,
) {
  const { saveReading } = useReadingHistory();
  const { toast } = useToast();
  const savedRef = useRef(false);

  useEffect(() => {
    if (
      aiReading &&
      !aiStreaming &&
      step === "results" &&
      drawnCardTypes.length > 0 &&
      !readingSaved &&
      !savedRef.current
    ) {
      savedRef.current = true;
      const interpretationText = aiReading.reading || "";
      const preview = interpretationText.substring(0, 150);
      const cardData = drawnCardTypes.map((card, index) => ({
        id: card.id,
        name: card.name,
        position: `Card ${index + 1}`,
      }));

      (async () => {
        try {
          await saveReading({
            id: `reading-${Date.now()}`,
            timestamp: Date.now(),
            question,
            spreadType: spreadLabel,
            cards: cardData,
            interpretationPreview: preview,
            interpretationFull: interpretationText,
          });

          setReadingSaved(true);
          toast({ description: "Reading saved", duration: 2000 });
        } catch (error) {
          console.error("Failed to save reading:", error);
          toast({ description: "Failed to save reading", duration: 2000 });
          savedRef.current = false;
        }
      })();
    }
  }, [aiReading, aiStreaming, step, drawnCardTypes, readingSaved, question, spreadLabel, saveReading, toast, setReadingSaved]);
}
