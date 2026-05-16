"use client";

import { useCallback } from "react";
import { Card } from "@/lib/types";
import { MemoizedCardWithTooltip } from "@/components/CardWithTooltip";

interface CardCellProps {
  card: Card;
  onCardClick: (card: Card) => void;
  size: "sm" | "md" | "lg";
  className?: string;
  positionLabel?: string;
  positionDescription?: string;
}

export function CardCell({ card, onCardClick, size, className, positionLabel, positionDescription }: CardCellProps) {
  const handleClick = useCallback(() => onCardClick(card), [onCardClick, card]);
  return (
    <MemoizedCardWithTooltip
      card={card}
      size={size}
      onClick={handleClick}
      className={className}
      positionLabel={positionLabel}
      positionDescription={positionDescription}
    />
  );
}
