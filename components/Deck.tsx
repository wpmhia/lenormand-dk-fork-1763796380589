"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Card as CardType } from "@/lib/types";
import { MemoizedCard } from "./Card";
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
  const [deck, setDeck] = useState<CardType[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCards, setDrawnCards] = useState<CardType[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const shuffleTimeoutRef = useRef<number | null>(null);
  const drawTimeoutRef = useRef<number | null>(null);
  const revealIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setDeck(cards || []);
    setDrawnCards([]);
  }, [cards]);

  useEffect(() => {
    return () => {
      if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current);
      if (drawTimeoutRef.current) clearTimeout(drawTimeoutRef.current);
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    };
  }, []);

  const canDraw = useMemo(
    () =>
      Array.isArray(deck) &&
      deck.length >= drawCount &&
      !isDrawing &&
      !isProcessing,
    [deck, drawCount, isDrawing, isProcessing],
  );

  const shuffle = useCallback(() => {
    if (!canDraw) return;

    setIsShuffling(true);

    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setDeck(shuffled);

    shuffleTimeoutRef.current = window.setTimeout(() => {
      setIsShuffling(false);
    }, 500);
  }, [canDraw, deck]);

  const drawCards = useCallback(() => {
    if (!canDraw) return;

    setIsDrawing(true);
    setRevealedCount(0);

    const newDrawnCards: CardType[] = [];
    const remainingDeck = [...deck];

    for (let i = 0; i < drawCount; i++) {
      const randomIndex = Math.floor(Math.random() * remainingDeck.length);
      const drawnCard = remainingDeck.splice(randomIndex, 1)[0];
      newDrawnCards.push(drawnCard);
    }

    setDeck(remainingDeck);
    setDrawnCards(newDrawnCards);

    // Staggered reveal: show cards one by one with 400ms delay
    let currentIndex = 0;
    revealIntervalRef.current = window.setInterval(() => {
      currentIndex++;
      setRevealedCount(currentIndex);
      if (currentIndex >= drawCount) {
        if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
        setIsDrawing(false);
        onDraw?.(newDrawnCards);
      }
    }, 400);
  }, [canDraw, deck, drawCount, onDraw]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!canDraw) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        drawCards();
      }
    },
    [canDraw, drawCards],
  );

  const handleClick = useCallback(() => {
    if (canDraw) drawCards();
  }, [canDraw, drawCards]);

  const isReady = useMemo(
    () =>
      Array.isArray(deck) &&
      deck.length > 0 &&
      !isDrawing &&
      deck.length >= drawCount,
    [deck, isDrawing, drawCount],
  );

  return (
    <div className="space-y-6">
      <div className="slide-in-up flex justify-center gap-3">
        <Button
          onClick={shuffle}
          disabled={!canDraw || isShuffling}
          variant="outline"
          size="sm"
          aria-label={
            isShuffling
              ? "Shuffling deck..."
              : "Shuffle the deck to randomize card order"
          }
        >
          <Shuffle className="mr-2 h-4 w-4" aria-hidden="true" />
          Shuffle
        </Button>

        <Button
          onClick={drawCards}
          disabled={!canDraw}
          size="sm"
          aria-label={
            isDrawing
              ? `Drawing ${drawCount} cards...`
              : isProcessing
                ? "Processing your reading..."
                : `Draw ${drawCount} cards from the deck`
          }
        >
          <Play className="mr-2 h-4 w-4" aria-hidden="true" />
          Draw {drawCount} Cards
        </Button>
      </div>

      <div className="fade-in-scale flex justify-center">
        <div
          className={cn(
            "relative rounded-lg transition-all",
            !isReady
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          )}
          role="button"
          tabIndex={isReady ? 0 : -1}
          aria-label={
            isDrawing
              ? "Drawing cards..."
              : `Deck: ${Array.isArray(deck) ? deck.length : 0} cards. Click to draw ${drawCount} cards`
          }
          aria-disabled={!isReady}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <div>
            {Array.isArray(deck) && deck.length > 0 && (
              <div className="relative">
                {deck.slice(-3).map((card, index) => (
                  <div
                    key={card.id}
                    className="absolute"
                    style={{
                      top: `${index * 6}px`,
                      left: `${index * 6}px`,
                      zIndex: index,
                      transform: `rotate(${index === 0 ? -2 : index === 1 ? 1 : 3}deg)`,
                    }}
                  >
                    <MemoizedCard
                      card={card}
                      showBack={true}
                      size="md"
                      className="cursor-default"
                    />
                  </div>
                ))}
                {Array.isArray(deck) && deck.length > 0 && (
                  <div className="relative">
                    <MemoizedCard
                      card={deck[deck.length - 1]}
                      showBack={true}
                      size="md"
                      className={isDrawing ? "opacity-75" : ""}
                    />
                    <div className="pointer-events-none absolute right-2 top-2">
                      <span className="rounded bg-card/90 px-2 py-1 text-sm font-bold">
                        {deck.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {drawnCards.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-center text-lg font-semibold">
            {revealedCount < drawnCards.length
              ? `Revealing cards... (${revealedCount}/${drawnCards.length})`
              : "Your Cards"}
          </h3>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-4">
            {drawnCards.slice(0, revealedCount).map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="animate-in zoom-in-95 fade-in duration-500"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <MemoizedCard card={item} size="lg" />
              </div>
            ))}
            {/* Placeholder slots for unrevealed cards */}
            {Array.from({ length: Math.max(0, drawnCards.length - revealedCount) }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="h-[180px] w-[120px] rounded-xl bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      <div className="slide-in-left text-center text-sm text-muted-foreground">
        {deck.length === 0 && drawnCards.length === 0 && (
          <p>No cards in deck</p>
        )}
        {deck.length > 0 && drawnCards.length === 0 && (
          <p>
            Ready to draw {drawCount} cards from {deck.length} remaining
          </p>
        )}
        {drawnCards.length > 0 && (
          <p>
            Drew {drawnCards.length} cards • {deck.length} remaining
          </p>
        )}
      </div>
    </div>
  );
}

export const Deck = memo(DeckComponent);
