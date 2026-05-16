"use client";

import { Card } from "@/lib/types";
import { MemoizedAnimatedCard } from "@/components/AnimatedCard";
import { getPositionInfo } from "./SpreadPositions";
import { CardCell } from "./CardCell";

interface LinearCardLayoutProps {
  validCards: Array<{ card: Card; index: number }>;
  setCardRef?: (index: number) => (el: HTMLElement | null) => void;
  hideCardsDuringTransition?: boolean;
  onCardClick: (card: Card) => void;
  spreadId?: string;
}

export function LinearCardLayout({ validCards, setCardRef, hideCardsDuringTransition, onCardClick, spreadId }: LinearCardLayoutProps) {
  return (
    <div className="flex flex-wrap justify-center gap-md py-lg">
      {validCards.map(({ card, index }) => {
        const positionInfo = getPositionInfo(index, spreadId);

        return (
          <div
            key={index}
            ref={setCardRef ? setCardRef(index) : undefined}
            className={hideCardsDuringTransition ? "opacity-0" : undefined}
          >
            <MemoizedAnimatedCard
              delay={index * 0.6}
              className="flex flex-col items-center space-y-md"
            >
              <div className="flex flex-col items-center space-y-md">
                <div className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-md py-sm text-sm font-semibold text-primary">
                  {positionInfo.label}
                </div>
                <CardCell
                  card={card!}
                  onCardClick={onCardClick}
                  size="lg"
                  className="cursor-pointer"
                  positionLabel={positionInfo.label}
                  positionDescription={positionInfo.meaning}
                />
              </div>
            </MemoizedAnimatedCard>
          </div>
        );
      })}
    </div>
  );
}
