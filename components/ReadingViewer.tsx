"use client";

import { useState, useMemo, useCallback } from "react";
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
import { Clock, Target, Brain, Eye, Zap } from "lucide-react";

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

const getZoneIcon = (zone: string) => {
  switch (zone) {
    case "left":
      return <Clock className="h-4 w-4" />;
    case "right":
      return <Target className="h-4 w-4" />;
    case "above":
      return <Brain className="h-4 w-4" />;
    case "below":
      return <Eye className="h-4 w-4" />;
    case "top-left":
    case "top-right":
    case "bottom-left":
    case "bottom-right":
      return <Zap className="h-4 w-4" />;
    default:
      return null;
  }
};

export function ReadingViewer({
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
            allCards={allCards}
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
            getZoneIcon={getZoneIcon}
          />
        </div>
      </div>

      {selectedCard && (
        <div className={`${disableAnimations ? '' : 'animate-in fade-in slide-in-from-bottom-8 duration-500'} rounded-lg border border-border bg-card p-xl shadow-elevation-1`}>
          <h3 className="mb-lg text-xl font-semibold text-foreground">
            Card Combinations
          </h3>
          <div className="space-y-md">
            {(() => {
              const readingCard = reading.cards.find(
                (c) => c.id === selectedCard.id,
              );
              if (!readingCard) return null;

              const adjacentCards = getAdjacentCards(readingCard);

              if (adjacentCards.length === 0) {
                return (
                  <div className="py-xl text-center text-muted-foreground/60">
                    <p className="mb-md italic">
                      No adjacent cards in this layout
                    </p>
                    <p className="text-sm">
                      In larger spreads, this card would interact with nearby
                      cards
                    </p>
                  </div>
                );
              }

              return adjacentCards.map((adjCard, index) => {
                const card = getCardByIdMemo(adjCard.id);
                if (!card) return null;

                const combination = getCombinationMeaning(
                  selectedCard,
                  card,
                  readingCard.position,
                  adjCard.position,
                );

                return (
                  <div
                    key={index}
                    className="flex items-center gap-md rounded-lg border border-border bg-card/50 p-md"
                  >
                    <div className="flex items-center gap-md">
                      <MemoizedCard card={selectedCard} size="sm" />
                      <span className="text-lg font-medium text-primary">
                        +
                      </span>
                      <MemoizedCard card={card} size="sm" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-sm font-medium text-muted-foreground">
                        {selectedCard.name} + {card.name}
                      </div>
                      <div className="text-sm text-muted-foreground/80">
                        {combination ||
                          "These cards work together to create a unique meaning in your reading."}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
