"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Card as CardType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Shuffle, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeckProps {
  cards: CardType[];
  onDraw?: (cards: CardType[]) => void;
  drawCount?: number;
  isProcessing?: boolean;
}

function DeckComponent({
  cards,
  onDraw,
  drawCount = 3,
  isProcessing = false,
}: DeckProps) {
  const [isShuffling, setIsShuffling] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const shuffleTimeoutRef = useRef<number | null>(null);

  const canDraw = cards.length >= drawCount && !isDrawing && !isProcessing;

  const shuffle = useCallback(() => {
    if (!canDraw) return;
    setIsShuffling(true);
    shuffleTimeoutRef.current = window.setTimeout(() => {
      setIsShuffling(false);
    }, 500);
  }, [canDraw]);

  const drawCards = useCallback(() => {
    if (!canDraw) return;

    setIsDrawing(true);

    // Simple random selection without modifying visual deck
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const drawnCards = shuffled.slice(0, drawCount);

    // Brief delay for user feedback, then callback
    setTimeout(() => {
      setIsDrawing(false);
      onDraw?.(drawnCards);
    }, 600);
  }, [canDraw, cards, drawCount, onDraw]);

  useEffect(() => {
    return () => {
      if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={shuffle}
          disabled={!canDraw || isShuffling}
          variant="outline"
          size="sm"
          className={cn(
            "transition-all duration-300",
            isShuffling && "scale-95"
          )}
        >
          <Shuffle
            className={cn("mr-2 h-4 w-4", isShuffling && "animate-spin")}
          />
          Shuffle
        </Button>

        <Button
          onClick={drawCards}
          disabled={!canDraw}
          loading={isDrawing || isProcessing}
          loadingText={isProcessing ? "Processing..." : `Drawing ${drawCount}...`}
          size="sm"
        >
          <Play className="mr-2 h-4 w-4" />
          Draw {drawCount} Cards
        </Button>
      </div>

      {/* Single Clickable Deck */}
      <div className="flex justify-center">
        <button
          onClick={drawCards}
          disabled={!canDraw}
          className={cn(
            "relative rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            !canDraw
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:scale-105 active:scale-95 hover:shadow-lg"
          )}
          aria-label={isDrawing ? "Drawing cards..." : `Click to draw ${drawCount} cards from deck of ${cards.length}`}
          aria-disabled={!canDraw}
        >
          {/* Card Back Image */}
          <div
            className="card-mystical overflow-hidden rounded-xl"
            style={{
              width: "112px",
              height: "160px",
              backgroundImage: "url(/images/card-back.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#1a1a1a",
            }}
          />
          
          {/* Deck Count Badge */}
          <div className="pointer-events-none absolute -right-2 -top-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
              {cards.length}
            </span>
          </div>

          {/* Drawing Overlay */}
          {isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </button>
      </div>

      {/* Status Text */}
      <p className="text-center text-sm text-muted-foreground">
        {canDraw 
          ? `Click the deck or use Draw button to reveal ${drawCount} cards`
          : isProcessing 
            ? "Processing your reading..."
            : "Deck empty"
        }
      </p>
    </div>
  );
}

export const Deck = memo(DeckComponent);
