"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card as CardType } from "@/lib/types";
import { MemoizedCard } from "./Card";
import { cn } from "@/lib/utils";

interface CardTransitionProps {
  cards: CardType[];
  sourceRects: Map<number, DOMRect>;
  targetRects: Map<number, DOMRect>;
  onComplete: () => void;
  duration?: number;
}

export function CardTransition({
  cards,
  sourceRects,
  targetRects,
  onComplete,
  duration = 800,
}: CardTransitionProps) {
  const [animatingCards, setAnimatingCards] = useState<
    Array<{
      card: CardType;
      index: number;
      from: DOMRect;
      to: DOMRect;
    }>
  >([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sourceRects.size === 0 || targetRects.size === 0) return;

    const newAnimatingCards: Array<{
      card: CardType;
      index: number;
      from: DOMRect;
      to: DOMRect;
    }> = [];

    cards.forEach((card, index) => {
      const from = sourceRects.get(index);
      const to = targetRects.get(index);

      if (from && to) {
        newAnimatingCards.push({ card, index, from, to });
      }
    });

    if (newAnimatingCards.length > 0) {
      setAnimatingCards(newAnimatingCards);
      setIsAnimating(true);

      // Staggered start for each card
      newAnimatingCards.forEach((_, i) => {
        setTimeout(() => {
          const el = document.getElementById(`flip-card-${i}`);
          if (el) {
            el.style.transform = "translate(0, 0) scale(1)";
            el.style.opacity = "1";
          }
        }, i * 200);
      });

      // Complete after all animations
      setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, duration + newAnimatingCards.length * 200);
    }
  }, [cards, sourceRects, targetRects, duration, onComplete]);

  if (!isAnimating || animatingCards.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ contain: "layout style" }}
    >
      {animatingCards.map(({ card, index, from, to }) => {
        const deltaX = to.left - from.left;
        const deltaY = to.top - from.top;
        const scaleX = to.width / from.width;
        const scaleY = to.height / from.height;

        return (
          <div
            key={`transition-${card.id}-${index}`}
            id={`flip-card-${index}`}
            className={cn(
              "absolute transition-all will-change-transform",
              "ease-out"
            )}
            style={{
              left: from.left,
              top: from.top,
              width: from.width,
              height: from.height,
              transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
              opacity: 0,
              transitionDuration: `${duration}ms`,
              transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
          >
            <MemoizedCard card={card} size="md" />
          </div>
        );
      })}
    </div>
  );
}

// Hook to measure element positions
export function useCardPositions() {
  const [positions, setPositions] = useState<Map<number, DOMRect>>(new Map());
  const refs = useRef<Map<number, HTMLElement>>(new Map());

  const setRef = useCallback((index: number) => (el: HTMLElement | null) => {
    if (el) {
      refs.current.set(index, el);
    }
  }, []);

  const measurePositions = useCallback(() => {
    const newPositions = new Map<number, DOMRect>();
    refs.current.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      newPositions.set(index, rect);
    });
    setPositions(newPositions);
    return newPositions;
  }, []);

  const clearPositions = useCallback(() => {
    setPositions(new Map());
    refs.current.clear();
  }, []);

  return { positions, setRef, measurePositions, clearPositions };
}
