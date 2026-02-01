"use client";

import { Card as CardType } from "@/lib/types";
import { Deck } from "@/components/Deck";

interface VirtualDeckDrawProps {
  cards: CardType[];
  drawCount: number;
  onDraw: (cards: CardType[]) => void;
  isProcessing?: boolean;
}

export function VirtualDeckDraw({
  cards,
  drawCount,
  onDraw,
  isProcessing = false,
}: VirtualDeckDrawProps) {
  return (
    <div className="py-4">
      <Deck
        cards={cards}
        drawCount={drawCount}
        onDraw={onDraw}
        isProcessing={isProcessing}
      />
    </div>
  );
}
