"use client";

import { useEffect, useRef } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card } from "@/lib/types";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { useToast } from "@/hooks/use-toast";
import { isReadingComplete } from "@/lib/simple-answer";

export function useAutoSaveReading(
  aiReading: AIReadingResponse | null,
  aiInProgress: boolean,
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
  const previousAiReadingRef = useRef<AIReadingResponse | null>(null);

  useEffect(() => {
    if (previousAiReadingRef.current && !aiReading) {
      savedRef.current = false;
    }
    previousAiReadingRef.current = aiReading;
  }, [aiReading]);

  useEffect(() => {
    if (
      aiReading &&
      !aiInProgress &&
      step === "results" &&
      drawnCardTypes.length > 0 &&
      !readingSaved &&
      !savedRef.current
    ) {
      const interpretationText = aiReading.reading || "";
      if (!isReadingComplete(interpretationText)) return;

      savedRef.current = true;
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
  }, [aiReading, aiInProgress, step, drawnCardTypes, readingSaved, question, spreadLabel, saveReading, toast, setReadingSaved]);
}
