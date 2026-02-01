"use client";

import { useCallback, useRef } from "react";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { Deck } from "@/components/Deck";

interface VirtualDeckDrawProps {
  cards: CardType[];
  drawCount: number;
  onDraw: (cards: CardType[]) => void;
  isProcessing?: boolean;
  setCardRef?: (index: number) => (el: HTMLElement | null) => void;
  hideDrawnCards?: boolean;
}

export function VirtualDeckDraw({
  cards,
  drawCount,
  onDraw,
  isProcessing = false,
  setCardRef,
  hideDrawnCards = false,
}: VirtualDeckDrawProps) {
  const deckCardRefs = useRef<Map<number, HTMLElement>>(new Map());

  const handleSetCardRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      if (el) {
        deckCardRefs.current.set(index, el);
        // Also call parent's setCardRef if provided
        setCardRef?.(index)(el);
      }
    },
    [setCardRef]
  );

  const handleDraw = useCallback(
    (drawnCards: ReadingCard[] | CardType[]) => {
      // Virtual deck returns CardType[]
      if (drawnCards.length > 0 && !("position" in drawnCards[0])) {
        onDraw(drawnCards as CardType[]);
      }
    },
    [onDraw]
  );

  return (
    <div className="py-4">
      <Deck
        cards={cards}
        drawCount={drawCount}
        onDraw={handleDraw}
        isProcessing={isProcessing}
        setCardRef={handleSetCardRef}
        hideDrawnCards={hideDrawnCards}
      />
    </div>
  );
}
