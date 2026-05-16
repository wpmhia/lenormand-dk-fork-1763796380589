"use client";

import { Reading, Card } from "@/lib/types";
import {
  SignificatorType,
} from "@/lib/spreads";
import { SingleCardLayout } from "./SingleCardLayout";
import { GrandTableauLayout } from "./GrandTableauLayout";
import { LinearCardLayout } from "./LinearCardLayout";
import { CardCell } from "./CardCell";
import { getPositionInfo, getZoneIcon } from "./SpreadPositions";

interface ReadingLayoutProps {
  reading: Reading;
  allCards: Card[];
  spreadId?: string;
  setCardRef?: (index: number) => (el: HTMLElement | null) => void;
  hideCardsDuringTransition?: boolean;
  showAdvancedAnalysis: boolean;
  significatorType: SignificatorType;
  onToggleAnalysis: () => void;
  onCardClick: (card: Card) => void;
  significatorIndex: number;
  topicCards: Array<{
    cardId: number;
    index: number;
    topic: { type: string; label: string };
  }>;
  diagonals: {
    topLeft: number[];
    bottomLeft: number[];
    topRight: number[];
    bottomRight: number[];
  } | null;
  getCardByIdMemo: (id: number) => Card | undefined;
  getZoneIcon: (zone: string) => React.ReactNode;
}

export { CardCell, getPositionInfo, getZoneIcon };

export function ReadingLayout({
  reading,
  spreadId,
  setCardRef,
  hideCardsDuringTransition,
  showAdvancedAnalysis,
  significatorType,
  onToggleAnalysis,
  onCardClick,
  significatorIndex,
  topicCards,
  diagonals,
  getCardByIdMemo,
}: ReadingLayoutProps) {
  const validCards = reading.cards
    .map((readingCard, index) => ({
      card: getCardByIdMemo(readingCard.id),
      index,
    }))
    .filter((item): item is { card: Card; index: number } => item.card !== undefined);

  if (reading.layoutType === 1) {
    return (
      <SingleCardLayout
        validCards={validCards}
        setCardRef={setCardRef}
        hideCardsDuringTransition={hideCardsDuringTransition}
        onCardClick={onCardClick}
        spreadId={spreadId}
      />
    );
  }

  if (reading.layoutType === 36) {
    return (
      <GrandTableauLayout
        validCards={validCards}
        setCardRef={setCardRef}
        hideCardsDuringTransition={hideCardsDuringTransition}
        showAdvancedAnalysis={showAdvancedAnalysis}
        significatorIndex={significatorIndex}
        onToggleAnalysis={onToggleAnalysis}
        onCardClick={onCardClick}
        topicCards={topicCards}
        diagonals={diagonals}
        getCardByIdMemo={getCardByIdMemo}
      />
    );
  }

  return (
    <LinearCardLayout
      validCards={validCards}
      setCardRef={setCardRef}
      hideCardsDuringTransition={hideCardsDuringTransition}
      onCardClick={onCardClick}
      spreadId={spreadId}
    />
  );
}
