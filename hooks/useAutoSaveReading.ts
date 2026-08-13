"use client";

import { useEffect, useRef } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card } from "@/lib/types";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { useToast } from "@/hooks/use-toast";
import { getDefinition } from "@/lib/spread-definitions";

export function useAutoSaveReading(
  aiReading: AIReadingResponse | null,
  aiStreaming: boolean,
  step: string,
  drawnCardTypes: Card[],
  readingSaved: boolean,
  question: string,
  spreadLabel: string,
  setReadingSaved: (v: boolean) => void,
  spreadId?: string,
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
      !aiStreaming &&
      step === "results" &&
      drawnCardTypes.length > 0 &&
      !readingSaved &&
      !savedRef.current
    ) {
      const interpretationText = aiReading.reading || "";
      const definition = spreadId ? getDefinition(spreadId) : undefined;
      const isGrandTableau = definition?.id === "grand-tableau";
      const isSingleCard = definition?.id === "single-card" || definition?.id === "daily-card";

      const hasAnyReadingBody = /##\s*Reading[\s\S]*\S/.test(interpretationText)
        || /##\s*Grand Tableau overview[\s\S]*\S/.test(interpretationText);
      const hasPrediction = /##\s*Prediction[\s\S]*\S/.test(interpretationText);

      const complete = isGrandTableau
        ? hasAnyReadingBody
        : isSingleCard
          ? interpretationText.trim().length >= 80
          : hasPrediction;

      if (!complete) return;

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
  }, [aiReading, aiStreaming, step, drawnCardTypes, readingSaved, question, spreadLabel, spreadId, saveReading, toast, setReadingSaved]);
}
