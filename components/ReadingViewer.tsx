"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { Reading, ReadingCard, Card as CardType } from "@/lib/types";
import {
  getLinearAdjacentCards,
  getGrandTableauAdjacentCards,
  getCombinationMeaning,
} from "@/lib/data";
import {
  getTopicCardsInSpread,
  getDiagonalCards,
  SignificatorType,
  SIGNIFICATOR_CARDS,
} from "@/lib/spreads";
import { MemoizedCard } from "./Card";
import { ReadingLayout } from "./reading/ReadingLayout";
import { ReadingHeader } from "./reading/ReadingHeader";
import { getPositionInfo } from "./reading/SpreadPositions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReadingViewerProps {
  reading: Reading;
  allCards: CardType[];
  showShareButton?: boolean;
  onShare?: () => void;
  showReadingHeader?: boolean;
  spreadId?: string;
  disableAnimations?: boolean;
  setCardRef?: (index: number) => (el: HTMLElement | null) => void;
  hideCardsDuringTransition?: boolean;
}

export const ReadingViewer = memo(function ReadingViewer({
  reading,
  allCards,
  showShareButton = true,
  onShare,
  showReadingHeader = true,
  spreadId,
  disableAnimations = false,
  setCardRef,
  hideCardsDuringTransition = false,
}: ReadingViewerProps) {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [shareClicked, setShareClicked] = useState(false);
  const [significatorType, setSignificatorType] =
    useState<SignificatorType>("none");
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);

  const cardIndex = useMemo(
    () => new Map(allCards.map((c) => [c.id, c])),
    [allCards],
  );
  const getCardByIdMemo = useCallback(
    (id: number) => cardIndex.get(id),
    [cardIndex],
  );

  const significatorCardId =
    significatorType !== "none" ? SIGNIFICATOR_CARDS[significatorType] : -1;
  const significatorIndex = reading.cards.findIndex(
    (c) => c.id === significatorCardId,
  );

  const topicCards = useMemo(() => {
    if (reading.layoutType !== 36) return [];
    return getTopicCardsInSpread(reading.cards.map((c) => c.id));
  }, [reading]);

  const diagonals = useMemo(() => {
    if (reading.layoutType !== 36 || significatorIndex === -1) return null;
    return getDiagonalCards(
      significatorIndex,
      reading.cards.map((c) => c.id),
    );
  }, [reading, significatorIndex]);

  const getAdjacentCards = (currentCard: ReadingCard): ReadingCard[] => {
    if (reading.layoutType === 36) {
      return getGrandTableauAdjacentCards(reading.cards, currentCard.position);
    } else {
      const index = reading.cards.findIndex(
        (c) => c.position === currentCard.position,
      );
      return getLinearAdjacentCards(reading.cards, index);
    }
  };

  return (
    <div className="space-y-xl">
      <ReadingHeader
        reading={reading}
        spreadId={spreadId}
        significatorType={significatorType}
        onSignificatorChange={setSignificatorType}
        onShare={onShare}
        showShareButton={showShareButton}
        showReadingHeader={showReadingHeader}
        shareClicked={shareClicked}
        setShareClicked={setShareClicked}
      />

      <div className={`${disableAnimations ? '' : 'animate-in fade-in slide-in-from-bottom-8 delay-150 duration-500'} overflow-visible`}>
        <div className="overflow-visible rounded-lg border border-border bg-card p-xl shadow-elevation-1">
          <h3 className="mb-lg text-xl font-semibold text-foreground">
            Your Cards
          </h3>
          <ReadingLayout
            reading={reading}
            spreadId={spreadId}
            setCardRef={setCardRef}
            hideCardsDuringTransition={hideCardsDuringTransition}
            showAdvancedAnalysis={showAdvancedAnalysis}
            significatorType={significatorType}
            onToggleAnalysis={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
            onCardClick={setSelectedCard}
            significatorIndex={significatorIndex}
            topicCards={topicCards}
            diagonals={diagonals}
            getCardByIdMemo={getCardByIdMemo}
          />
        </div>
      </div>

      <Dialog open={!!selectedCard} onOpenChange={(open) => { if (!open) setSelectedCard(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          {selectedCard && (() => {
            const readingCard = reading.cards.find(
              (c) => c.id === selectedCard.id,
            );
            const posInfo = spreadId ? getPositionInfo(readingCard?.position ?? 0, spreadId) : null;

            return (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {selectedCard.id}
                    </span>
                    {selectedCard.name}
                  </DialogTitle>
                </DialogHeader>

                {posInfo && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{posInfo.label}</div>
                    <div className="mt-0.5 text-sm text-foreground/80">{posInfo.meaning}</div>
                  </div>
                )}

                {readingCard && (() => {
                  const adjacentCards = getAdjacentCards(readingCard);
                  if (adjacentCards.length === 0) return null;

                  return (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-foreground">Adjacent Combinations</h4>
                      <div className="space-y-2">
                        {adjacentCards.map((adjCard, index) => {
                          const card = getCardByIdMemo(adjCard.id);
                          if (!card) return null;
                          const combination = getCombinationMeaning(selectedCard, card, readingCard.position, adjCard.position);
                          return (
                            <div key={index} className="flex items-center gap-2 rounded-lg border border-border bg-card/50 p-2.5">
                              <div className="flex items-center gap-1.5">
                                <MemoizedCard card={selectedCard} size="sm" />
                                <span className="text-sm font-medium text-primary">+</span>
                                <MemoizedCard card={card} size="sm" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-muted-foreground">{selectedCard.name} + {card.name}</div>
                                <div className="text-xs text-muted-foreground/80 line-clamp-2">{combination || "These cards combine to create meaning in your reading."}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {selectedCard.keywords && selectedCard.keywords.length > 0 && (
                  <div>
                    <h4 className="mb-1.5 text-sm font-semibold text-foreground">Keywords</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCard.keywords.slice(0, 5).map((kw) => (
                        <span key={kw} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={`/learn/card-meanings/${selectedCard.id}`}
                  className="block text-center text-sm text-primary hover:underline"
                  onClick={() => setSelectedCard(null)}
                >
                  View full meaning of {selectedCard.name} →
                </a>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
});
