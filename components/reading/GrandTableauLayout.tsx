"use client";

import { Card } from "@/lib/types";
import {
  getGrandTableauPosition,
  getPositionZone,
  SIGNIFICATOR_CARDS,
  GRAND_TABLEAU_CORNERS,
  GRAND_TABLEAU_CENTER_CARDS,
  DIRECTIONAL_ZONES,
} from "@/lib/spreads";
import { Badge } from "@/components/ui/badge";
import { MemoizedAnimatedCard } from "@/components/AnimatedCard";
import { CardCell } from "./CardCell";
import { getZoneIcon } from "./SpreadPositions";
import {
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GrandTableauLayoutProps {
  validCards: Array<{ card: Card; index: number }>;
  setCardRef?: (index: number) => (el: HTMLElement | null) => void;
  hideCardsDuringTransition?: boolean;
  showAdvancedAnalysis: boolean;
  significatorIndex: number;
  onToggleAnalysis: () => void;
  onCardClick: (card: Card) => void;
  diagonals: {
    topLeft: number[];
    bottomLeft: number[];
    topRight: number[];
    bottomRight: number[];
  } | null;
}

export function GrandTableauLayout({
  validCards,
  setCardRef,
  hideCardsDuringTransition,
  showAdvancedAnalysis,
  significatorIndex,
  onToggleAnalysis,
  onCardClick,
  diagonals,
}: GrandTableauLayoutProps) {
  return (
    <div className="space-y-sm">
      <button
        onClick={onToggleAnalysis}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card/50 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      >
        {showAdvancedAnalysis ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Hide Advanced Analysis
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
          Show Advanced Analysis (Reading focus and grid geometry)
          </>
        )}
      </button>

      {showAdvancedAnalysis && significatorIndex !== -1 && (
        <div className="mb-lg flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>Relative directions describe grid position only; they do not assign chronology or known/hidden facts.</span>
        </div>
      )}

      {/* Compact swipe hint on small screens where the grid overflows. Hidden on sm and up. */}
      <p className="mb-1 text-center text-[11px] text-muted-foreground sm:hidden" role="note">
        Swipe to view all 36 cards
      </p>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain] sm:mx-0 sm:px-0" aria-label="Grand Tableau, horizontally scrollable">
        <div className="grid min-w-[752px] grid-cols-9 gap-1 sm:gap-sm">
          {validCards.map(({ card, index }) => {
            const pos = getGrandTableauPosition(index);
            const isSignificator = index === significatorIndex;
            const isCorner = GRAND_TABLEAU_CORNERS.includes(index);
            const isCenter = GRAND_TABLEAU_CENTER_CARDS.includes(index);
            const zoneInfo =
              significatorIndex !== -1
                ? getPositionZone(significatorIndex, index)
                : { zone: "general", distance: 0, direction: "" };

            const zone = DIRECTIONAL_ZONES[zoneInfo.zone];

            let borderClass = "border-border";
            if (showAdvancedAnalysis) {
              if (isSignificator) {
                borderClass = "border-amber-500 ring-2 ring-amber-500/30";
              } else if (isCorner) {
                borderClass = "gt-context";
              } else if (isCenter) {
                borderClass = "gt-center";
              }
            } else if (isSignificator) {
              borderClass = "border-amber-500 ring-2 ring-amber-500/30";
            }

            return (
              <div
                key={index}
                ref={setCardRef ? setCardRef(index) : undefined}
                className={hideCardsDuringTransition ? "opacity-0" : undefined}
              >
                <MemoizedAnimatedCard
                  delay={index * 0.03}
                  className={`flex flex-col items-center space-y-sm rounded-lg border-2 p-sm transition-all ${
                    isSignificator ? "bg-amber-50 dark:bg-amber-950/30" : ""
                  } ${borderClass}`}
                >
                  <div className="flex w-full items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      {pos.row + 1}-{pos.col + 1}
                    </span>
                    {isSignificator && (
                      <Badge variant="default" className="bg-amber-600 text-[11px]">FOCUS</Badge>
                    )}
                    {showAdvancedAnalysis && (
                      <>
                        {isCorner && <Badge variant="outline" className="gt-context text-[11px]">Context</Badge>}
                        {isCenter && <Badge variant="outline" className="gt-center text-[11px]">Heart</Badge>}
                      </>
                    )}
                  </div>

                  {showAdvancedAnalysis && zone && significatorIndex !== -1 && !isSignificator && (
                    <div className={`flex items-center gap-1 text-[11px] ${zone.color}`}>
                      {getZoneIcon(zoneInfo.zone)}
                      <span>{zone.name}</span>
                      <span className="text-muted-foreground">({zoneInfo.distance})</span>
                    </div>
                  )}

                  <CardCell
                    card={card!}
                    onCardClick={onCardClick}
                    size="sm"
                    className="cursor-pointer"
                    positionLabel={isSignificator ? `Reading focus (${card!.name})` : zone?.name || undefined}
                    positionDescription={isSignificator ? "Selected focus only; no person identity is assigned" : zoneInfo.direction ? `${zone.description}; distance ${zoneInfo.distance}` : undefined}
                  />

                </MemoizedAnimatedCard>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground sm:hidden">Swipe horizontally to explore all 36 cards</p>

      <div className="mt-3 space-y-3 sm:hidden">
        {significatorIndex !== -1 && validCards[significatorIndex] && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-50/30 p-3 dark:bg-amber-950/20">
              <h4 className="mb-1 text-xs font-semibold text-foreground">Significator</h4>
            <p className="text-xs text-muted-foreground">
              {validCards[significatorIndex].card.name} at position {significatorIndex + 1}
            </p>
          </div>
        )}
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <h4 className="mb-1 text-xs font-semibold text-foreground">Corners</h4>
          <p className="text-xs text-muted-foreground">
            {GRAND_TABLEAU_CORNERS.map((i) => validCards[i]?.card.name).filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <h4 className="mb-1 text-xs font-semibold text-foreground">Center Four</h4>
          <p className="text-xs text-muted-foreground">
            {GRAND_TABLEAU_CENTER_CARDS.map((i) => validCards[i]?.card.name).filter(Boolean).join(", ")}
          </p>
        </div>
      </div>

      {showAdvancedAnalysis && diagonals && (
        <div className="mt-lg grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "topLeft", label: "Visible Influences", cards: diagonals.topLeft, color: "text-primary" },
            { key: "bottomLeft", label: "Hidden Influences", cards: diagonals.bottomLeft, color: "text-muted-foreground" },
            { key: "topRight", label: "Visible Possibilities", cards: diagonals.topRight, color: "text-primary" },
            { key: "bottomRight", label: "Hidden Possibilities", cards: diagonals.bottomRight, color: "text-muted-foreground" },
          ].map((diag) => (
            <div key={diag.key} className="rounded-lg border border-border bg-card p-md">
              <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${diag.color}`}>
                <Zap className="h-4 w-4" />
                {diag.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {diag.cards.length} card{diag.cards.length !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
