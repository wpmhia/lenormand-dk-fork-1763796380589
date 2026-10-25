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

export function LinearCardLayout({
  validCards,
  setCardRef,
  hideCardsDuringTransition,
  onCardClick,
  spreadId,
}: LinearCardLayoutProps) {
  const cardCount = validCards.length;
  const isPetitTableau = cardCount === 9;

  if (isPetitTableau) {
    return (
      <div className="mx-auto grid w-full max-w-[min(100%,520px)] grid-cols-3 gap-2 sm:gap-3">
        {validCards.map(({ card, index }) => {
          const positionInfo = getPositionInfo(index, spreadId);
          return (
            <div
              key={index}
              ref={setCardRef ? setCardRef(index) : undefined}
              className={`flex flex-col items-center gap-1 sm:gap-2 ${hideCardsDuringTransition ? "opacity-0" : ""}`}
            >
              <div className="text-center text-[10px] font-medium leading-tight text-primary sm:text-xs">
                {positionInfo.label}
              </div>
              <CardCell
                card={card!}
                onCardClick={onCardClick}
                size="responsive"
                className="w-[clamp(72px,22vw,130px)] cursor-pointer"
                positionLabel={positionInfo.label}
                positionDescription={positionInfo.meaning}
              />
            </div>
          );
        })}
      </div>
    );
  }

  const isSingleCard = cardCount === 1;
  const cardSize = isSingleCard ? "lg" : "responsive";

  return (
    <div className="py-lg">
      {/* Sentences always stay in one row, left to right. Compact on small screens with a
          scroll fallback so five cards never reflow into extra rows on mobile. */}
      <div
        className={
          isSingleCard
            ? "flex justify-center"
            : "-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
        }
        role={isSingleCard ? undefined : "region"}
        aria-label={isSingleCard ? undefined : "Drawn cards, horizontally scrollable"}
        tabIndex={isSingleCard ? undefined : 0}
      >
        <div
          className={
            isSingleCard
              ? "flex justify-center gap-md"
              : "flex min-w-[min(100%,fit-content)] justify-center gap-2 sm:gap-4"
          }
        >
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
                  className="flex min-w-0 flex-col items-center gap-1 space-y-md sm:gap-2"
                >
                  {!isSingleCard && (
                    <div className="truncate text-center text-[10px] font-medium leading-tight text-primary sm:text-xs">
                      {positionInfo.label}
                    </div>
                  )}
                  <CardCell
                    card={card!}
                    onCardClick={onCardClick}
                    size={cardSize}
                    className={`cursor-pointer ${isSingleCard ? "" : "w-[clamp(52px,16vw,104px)]"}`}
                    positionLabel={positionInfo.label}
                    positionDescription={positionInfo.meaning}
                  />
                </MemoizedAnimatedCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
