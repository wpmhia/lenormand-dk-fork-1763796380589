"use client";

import { useEffect, useState, useRef } from "react";
import { Card as CardType } from "@/lib/types";
import { MemoizedCard } from "./Card";

interface CardTransitionProps {
  cards: CardType[];
  sourceRects: Map<number, DOMRect>;
  targetRects: Map<number, DOMRect>;
  onComplete: () => void;
  duration?: number;
}

// Global style injection for FLIP animation
const flipStyles = `
@keyframes flipMove {
  0% {
    opacity: 1;
    transform: translate(var(--start-x, 0), var(--start-y, 0)) scale(var(--start-scale-x, 1), var(--start-scale-y, 1));
  }
  100% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
}
`;

export function CardTransition({
  cards,
  sourceRects,
  targetRects,
  onComplete,
  duration = 600,
}: CardTransitionProps) {
  const [cardAnimations, setCardAnimations] = useState<
    Array<{
      card: CardType;
      index: number;
      from: DOMRect;
      to: DOMRect;
      deltaX: number;
      deltaY: number;
      scaleX: number;
      scaleY: number;
    }>
  >([]);
  const completedRef = useRef(false);

  useEffect(() => {
    if (sourceRects.size === 0 || targetRects.size === 0) return;

    const animations = cards
      .map((card, index) => {
        const from = sourceRects.get(index);
        const to = targetRects.get(index);
        if (!from || !to) return null;
        
        // FLIP: Calculate delta from target back to source
        const deltaX = from.left - to.left;
        const deltaY = from.top - to.top;
        const scaleX = from.width / to.width;
        const scaleY = from.height / to.height;
        
        return { card, index, from, to, deltaX, deltaY, scaleX, scaleY };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (animations.length === 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    setCardAnimations(animations);

    // Calculate total animation time including stagger
    const maxStagger = (animations.length - 1) * 150;
    const totalTime = duration + maxStagger + 100;

    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, totalTime);

    return () => clearTimeout(timer);
  }, [cards, sourceRects, targetRects, duration, onComplete]);

  if (cardAnimations.length === 0) return null;

  return (
    <>
      <style>{flipStyles}</style>
      <div className="pointer-events-none fixed inset-0 z-50">
        {cardAnimations.map(({ card, index, to, deltaX, deltaY, scaleX, scaleY }) => {
          const staggerDelay = index * 150;

          return (
            <div
              key={`transition-${card.id}-${index}`}
              className="absolute"
              style={{
                left: to.left,
                top: to.top,
                width: to.width,
                height: to.height,
                willChange: "transform, opacity",
                opacity: 0,
                animation: `flipMove ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1) ${staggerDelay}ms forwards`,
                // @ts-ignore - CSS custom properties
                "--start-x": `${deltaX}px`,
                "--start-y": `${deltaY}px`,
                "--start-scale-x": scaleX,
                "--start-scale-y": scaleY,
              }}
            >
              <MemoizedCard card={card} size="md" />
            </div>
          );
        })}
      </div>
    </>
  );
}
