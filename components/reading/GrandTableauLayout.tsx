"use client";

import { Card } from "@/lib/types";
import {
  getGrandTableauPosition,
  getPositionZone,
  SIGNIFICATOR_CARDS,
  GRAND_TABLEAU_TOPIC_CARDS,
  GRAND_TABLEAU_CORNERS,
  GRAND_TABLEAU_CARDS_OF_FATE,
  GRAND_TABLEAU_CENTER_CARDS,
  DIRECTIONAL_ZONES,
} from "@/lib/spreads";
import { Badge } from "@/components/ui/badge";
import { MemoizedAnimatedCard } from "@/components/AnimatedCard";
import { CardCell } from "./CardCell";
import { getZoneIcon } from "./SpreadPositions";
import {
  Clock,
  Target,
  Brain,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
  Diamond,
} from "lucide-react";

interface GrandTableauLayoutProps {
  validCards: Array<{ card: Card; index: number }>;
  setCardRef?: (index: number) => (el: HTMLElement | null) => void;
  hideCardsDuringTransition?: boolean;
  showAdvancedAnalysis: boolean;
  significatorIndex: number;
  onToggleAnalysis: () => void;
  onCardClick: (card: Card) => void;
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
}

export function GrandTableauLayout({
  validCards,
  setCardRef,
  hideCardsDuringTransition,
  showAdvancedAnalysis,
  significatorIndex,
  onToggleAnalysis,
  onCardClick,
  topicCards,
  diagonals,
  getCardByIdMemo,
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
            Show Advanced Analysis (Significator, Directions, Topics)
          </>
        )}
      </button>

      {showAdvancedAnalysis && significatorIndex !== -1 && (
        <div className="mb-lg flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-lg">
          <div className="flex items-center gap-1 sm:gap-2">
            <Clock className="h-3 w-3 text-amber-600 sm:h-4 sm:w-4" />
            <span>Left = Past</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Target className="h-3 w-3 text-blue-600 sm:h-4 sm:w-4" />
            <span>Right = Future</span>
          </div>
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <span>Above = Visible</span>
          </div>
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            <Eye className="h-4 w-4 text-emerald-600" />
            <span>Below = Hidden</span>
          </div>
        </div>
      )}

      <div className="-mx-4 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain] sm:mx-0 sm:px-0">
        <div className="grid min-w-[752px] grid-cols-9 gap-1 sm:gap-sm">
          {validCards.map(({ card, index }) => {
            const pos = getGrandTableauPosition(index);
            const isSignificator = index === significatorIndex;
            const isCorner = GRAND_TABLEAU_CORNERS.includes(index);
            const isCenter = GRAND_TABLEAU_CENTER_CARDS.includes(index);
            const isCardsOfFate = GRAND_TABLEAU_CARDS_OF_FATE.includes(index);
            const topicInfo = GRAND_TABLEAU_TOPIC_CARDS[card!.id];

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
                borderClass = "border-purple-500/50";
              } else if (isCardsOfFate) {
                borderClass = "border-red-500/50";
              } else if (isCenter) {
                borderClass = "border-green-500/50";
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
                      <Badge variant="default" className="bg-amber-600 text-[10px]">YOU</Badge>
                    )}
                    {showAdvancedAnalysis && (
                      <>
                        {isCorner && <Badge variant="outline" className="border-purple-500/50 text-[10px] text-purple-600">Context</Badge>}
                        {isCardsOfFate && <Badge variant="outline" className="border-red-500/50 text-[10px] text-red-600">Fate</Badge>}
                        {isCenter && <Badge variant="outline" className="border-green-500/50 text-[10px] text-green-600">Heart</Badge>}
                      </>
                    )}
                  </div>

                  {showAdvancedAnalysis && zone && significatorIndex !== -1 && !isSignificator && (
                    <div className={`flex items-center gap-1 text-[10px] ${zone.color}`}>
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
                    positionLabel={isSignificator ? "Significator (You)" : zone?.name || undefined}
                    positionDescription={isSignificator ? "This card represents you in the reading" : zoneInfo.direction ? `${zone.description} - Distance: ${zoneInfo.distance}` : undefined}
                  />

                  {showAdvancedAnalysis && topicInfo && (
                    <div className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                      {getZoneIcon(topicInfo.type)}
                      <span>{topicInfo.label}</span>
                    </div>
                  )}
                </MemoizedAnimatedCard>
              </div>
            );
          })}
        </div>
      </div>

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
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <h4 className="mb-1 text-xs font-semibold text-foreground">Cards of Fate</h4>
          <p className="text-xs text-muted-foreground">
            {GRAND_TABLEAU_CARDS_OF_FATE.map((i) => validCards[i]?.card.name).filter(Boolean).join(", ")}
          </p>
        </div>
      </div>

      {showAdvancedAnalysis && topicCards.length > 0 && (
        <div className="mt-lg rounded-lg border border-border bg-card p-md">
          <h4 className="mb-md flex items-center gap-2 text-sm font-semibold">
            <Diamond className="h-4 w-4 text-primary" />
            Topic Cards in This Reading
          </h4>
          <div className="flex flex-wrap gap-md">
            {topicCards.map((tc) => {
              const card = getCardByIdMemo(tc.cardId);
              if (!card) return null;
              return (
                <div
                  key={tc.cardId}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 transition-colors hover:bg-muted"
                  onClick={() => {
                    const cardElement = document.querySelector(`[data-card-index="${tc.index}"]`);
                    cardElement?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  {getZoneIcon(tc.topic.type)}
                  <div>
                    <div className="text-xs font-medium">{card.name}</div>
                    <div className="text-[10px] text-muted-foreground">{tc.topic.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAdvancedAnalysis && diagonals && (
        <div className="mt-lg grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "topLeft", label: "Visible Influences", cards: diagonals.topLeft, color: "text-violet-600" },
            { key: "bottomLeft", label: "Hidden Influences", cards: diagonals.bottomLeft, color: "text-teal-600" },
            { key: "topRight", label: "Visible Possibilities", cards: diagonals.topRight, color: "text-indigo-600" },
            { key: "bottomRight", label: "Hidden Possibilities", cards: diagonals.bottomRight, color: "text-cyan-600" },
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
