"use client";

import { Card as CardType } from "@/lib/types";
import { MemoizedCard } from "./Card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { memo, useRef } from "react";

interface CardWithTooltipProps {
  card: CardType;
  onClick?: () => void;
  showBack?: boolean;
  size?: "sm" | "md" | "lg" | "responsive";
  className?: string;
  positionLabel?: string;
  positionDescription?: string;
}

function CardWithTooltipInner({
  card,
  onClick,
  showBack = false,
  size = "md",
  className,
  positionLabel,
  positionDescription,
}: CardWithTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-block overflow-visible", className)}>
          <MemoizedCard
            card={card}
            onClick={onClick}
            showBack={showBack}
            size={size}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent className="z-50 max-w-xs overflow-visible border-border bg-card p-4 shadow-lg">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-foreground">{card.name}</h4>
            {positionLabel && (
              <p className="text-sm font-medium text-primary">
                {positionLabel}
              </p>
            )}
            {positionDescription && (
              <p className="mt-1 text-xs text-muted-foreground">
                {positionDescription}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm leading-relaxed text-foreground">
              {card.meaning?.general || card.keywords.slice(0, 3).join(", ")}
            </p>
          </div>

          {card.keywords && card.keywords.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {card.keywords.slice(0, 3).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export const MemoizedCardWithTooltip = memo(CardWithTooltipInner);
