"use client";

import { useEffect, useRef } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Card } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { isReadingComplete } from "@/lib/simple-answer";
import { addReading, attachAIInterpretation } from "@/lib/reading-storage";

/**
 * Saves the legging when the results are shown, without AI, and attaches the AI interpretation to
 * that same entry when the user asks for it. One entry per legging: the AI result updates the
 * classic entry by id instead of creating a second one.
 */
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
  const { toast } = useToast();
  const entryIdRef = useRef<string | null>(null);
  const attachedRef = useRef(false);
  const previousAiReadingRef = useRef<AIReadingResponse | null>(null);

  // A new legging starts a new entry; leaving the results resets the link.
  useEffect(() => {
    if (step !== "results") {
      entryIdRef.current = null;
      attachedRef.current = false;
    }
  }, [step]);

  useEffect(() => {
    if (previousAiReadingRef.current && !aiReading) {
      attachedRef.current = false;
    }
    previousAiReadingRef.current = aiReading;
  }, [aiReading]);

  // Step 1: the classic entry, saved once when the results are shown.
  useEffect(() => {
    if (step !== "results" || drawnCardTypes.length === 0 || readingSaved || entryIdRef.current) return;

    const id = `reading-${Date.now()}`;
    entryIdRef.current = id;
    const cardData = drawnCardTypes.map((card, index) => ({
      id: card.id,
      name: card.name,
      position: `Card ${index + 1}`,
    }));

    (async () => {
      try {
        await addReading({
          id,
          timestamp: Date.now(),
          question,
          spreadType: spreadLabel,
          cards: cardData,
          hasAIInterpretation: false,
        });
        setReadingSaved(true);
        toast({ description: "Reading saved", duration: 2000 });
      } catch (error) {
        console.error("Failed to save reading:", error);
        toast({ description: "Failed to save reading", duration: 2000 });
        entryIdRef.current = null;
      }
    })();
  }, [step, drawnCardTypes, readingSaved, question, spreadLabel, toast, setReadingSaved]);

  // Step 2: when AI finishes, attach the interpretation to the same entry.
  useEffect(() => {
    const id = entryIdRef.current;
    if (!aiReading || aiInProgress || step !== "results" || !id || attachedRef.current) return;
    const interpretationText = aiReading.reading || "";
    if (!isReadingComplete(interpretationText)) return;

    attachedRef.current = true;
    (async () => {
      try {
        await attachAIInterpretation(id, {
          preview: interpretationText.substring(0, 150),
          full: interpretationText,
        });
      } catch (error) {
        console.error("Failed to attach AI interpretation:", error);
        attachedRef.current = false;
      }
    })();
  }, [aiReading, aiInProgress, step]);
}
