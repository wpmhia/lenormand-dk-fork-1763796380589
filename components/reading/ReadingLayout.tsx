"use client";

import { Reading, Card as CardType } from "@/lib/types";
import {
  GrandTableauPosition,
  getGrandTableauPosition,
  getPositionZone,
  SignificatorType,
  SIGNIFICATOR_CARDS,
  GRAND_TABLEAU_TOPIC_CARDS,
  GRAND_TABLEAU_CORNERS,
  GRAND_TABLEAU_CARDS_OF_FATE,
  GRAND_TABLEAU_CENTER_CARDS,
  DIRECTIONAL_ZONES,
} from "@/lib/spreads";
import { Badge } from "@/components/ui/badge";
import { MemoizedCardWithTooltip } from "@/components/CardWithTooltip";
import { MemoizedAnimatedCard } from "@/components/AnimatedCard";
import { getPositionInfo, getTopicIcon } from "./SpreadPositions";
import {
  Clock,
  Target,
  Brain,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface ReadingLayoutProps {
  reading: Reading;
  allCards: CardType[];
  spreadId?: string;
  setCardRef?: (index: number) => (el: HTMLElement | null) => void;
  hideCardsDuringTransition?: boolean;
  showAdvancedAnalysis: boolean;
  significatorType: SignificatorType;
  onToggleAnalysis: () => void;
  onCardClick: (card: CardType) => void;
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
  getCardByIdMemo: (id: number) => CardType | undefined;
  getZoneIcon: (zone: string) => React.ReactNode;
}

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
  getZoneIcon,
}: ReadingLayoutProps) {
  if (reading.layoutType === 1) {
    const validCards = reading.cards
      .map((readingCard, index) => ({
        card: getCardByIdMemo(readingCard.id),
        index,
      }))
      .filter((item) => item.card !== undefined);

    return (
      <div className="flex justify-center py-lg">
        {validCards.map(({ card: card, index }) => {
          const positionInfo = getPositionInfo(index, spreadId);

          return (
            <div
              key={index}
              ref={setCardRef ? setCardRef(index) : undefined}
              className={hideCardsDuringTransition ? "opacity-0" : undefined}
            >
              <MemoizedAnimatedCard
                delay={0}
                className="flex flex-col items-center space-y-lg"
              >
                <div className="flex flex-col items-center space-y-md">
                  <div className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-md py-sm text-sm font-semibold text-primary">
                    {positionInfo.label}
                  </div>
                  <MemoizedCardWithTooltip
                    card={card!}
                    size="lg"
                    onClick={() => onCardClick(card!)}
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
  } else if (reading.layoutType === 36) {
    return (
      <div className="space-y-sm">
        {/* Advanced Analysis Toggle */}
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

        {/* Grand Tableau directional legend - only when advanced is shown */}
        {showAdvancedAnalysis && significatorIndex !== -1 && (
          <div className="mb-lg flex flex-wrap items-center justify-center gap-lg text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-muted-foreground">Left = Past</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">Right = Future</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-muted-foreground">Above = Conscious</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">Below = Unconscious</span>
            </div>
          </div>
        )}

        <div className="-mx-4 overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:px-0">
          <div
            className="grid min-w-[320px] gap-1 sm:min-w-[600px] sm:gap-sm"
            style={{
              gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
            }}
          >
            {reading.cards
              .map((readingCard, index) => ({
                card: getCardByIdMemo(readingCard.id),
                index,
              }))
              .filter((item) => item.card !== undefined)
              .map(({ card, index }) => {
                const pos = getGrandTableauPosition(index);
                const isSignificator = index === significatorIndex;
                const isCorner = GRAND_TABLEAU_CORNERS.includes(index);
                const isCenter = GRAND_TABLEAU_CENTER_CARDS.includes(index);
                const isCardsOfFate =
                  GRAND_TABLEAU_CARDS_OF_FATE.includes(index);
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
                  // Always show significator border even in simple mode
                  borderClass = "border-amber-500 ring-2 ring-amber-500/30";
                }

                return (
                  <div
                    key={index}
                    ref={setCardRef ? setCardRef(index) : undefined}
                    className={
                      hideCardsDuringTransition ? "opacity-0" : undefined
                    }
                  >
                    <MemoizedAnimatedCard
                      delay={index * 0.08}
                      className={`flex flex-col items-center space-y-sm rounded-lg border-2 p-sm transition-all ${
                        isSignificator ? "bg-amber-50 dark:bg-amber-950/30" : ""
                      } ${borderClass}`}
                    >
                      {/* Position header */}
                      <div className="flex w-full items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">
                          {pos.row + 1}-{pos.col + 1}
                        </span>
                        {isSignificator && (
                          <Badge
                            variant="default"
                            className="bg-amber-600 text-[10px]"
                          >
                            YOU
                          </Badge>
                        )}
                        {showAdvancedAnalysis && (
                          <>
                            {isCorner && (
                              <Badge
                                variant="outline"
                                className="border-purple-500/50 text-[10px] text-purple-600"
                              >
                                Context
                              </Badge>
                            )}
                            {isCardsOfFate && (
                              <Badge
                                variant="outline"
                                className="border-red-500/50 text-[10px] text-red-600"
                              >
                                Fate
                              </Badge>
                            )}
                            {isCenter && (
                              <Badge
                                variant="outline"
                                className="border-green-500/50 text-[10px] text-green-600"
                              >
                                Heart
                              </Badge>
                            )}
                          </>
                        )}
                      </div>

                      {/* Directional indicator - only in advanced mode */}
                      {showAdvancedAnalysis &&
                        zone &&
                        significatorIndex !== -1 &&
                        !isSignificator && (
                          <div
                            className={`flex items-center gap-1 text-[10px] ${zone.color}`}
                          >
                            {getZoneIcon(zoneInfo.zone)}
                            <span>{zone.name}</span>
                            <span className="text-muted-foreground">
                              ({zoneInfo.distance})
                            </span>
                          </div>
                        )}

                      <MemoizedCardWithTooltip
                        card={card!}
                        size="sm"
                        onClick={() => onCardClick(card!)}
                        className="cursor-pointer"
                        positionLabel={
                          isSignificator
                            ? "Significator (You)"
                            : zone?.name || undefined
                        }
                        positionDescription={
                          isSignificator
                            ? "This card represents you in the reading"
                            : zoneInfo.direction
                              ? `${zone.description} - Distance: ${zoneInfo.distance}`
                              : undefined
                        }
                      />

                      {/* Topic card badge - only in advanced mode */}
                      {showAdvancedAnalysis && topicInfo && (
                        <div className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                          {getTopicIcon(topicInfo.type)}
                          <span>{topicInfo.label}</span>
                        </div>
                      )}
                    </MemoizedAnimatedCard>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Topic cards summary - only in advanced mode */}
        {showAdvancedAnalysis && topicCards.length > 0 && (
          <div className="mt-lg rounded-lg border border-border bg-card p-md">
            <h4 className="mb-md flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
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
                      const cardElement = document.querySelector(
                        `[data-card-index="${tc.index}"]`,
                      );
                      cardElement?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                  >
                    {getTopicIcon(tc.topic.type)}
                    <div>
                      <div className="text-xs font-medium">{card.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {tc.topic.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Diagonals summary - only in advanced mode */}
        {showAdvancedAnalysis && diagonals && (
          <div className="mt-lg grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                key: "topLeft",
                label: "Conscious Influences",
                cards: diagonals.topLeft,
                color: "text-violet-600",
              },
              {
                key: "bottomLeft",
                label: "Unconscious Influences",
                cards: diagonals.bottomLeft,
                color: "text-teal-600",
              },
              {
                key: "topRight",
                label: "Conscious Possibilities",
                cards: diagonals.topRight,
                color: "text-indigo-600",
              },
              {
                key: "bottomRight",
                label: "Unconscious Possibilities",
                cards: diagonals.bottomRight,
                color: "text-cyan-600",
              },
            ].map((diag) => (
              <div
                key={diag.key}
                className="rounded-lg border border-border bg-card p-md"
              >
                <div
                  className={`mb-2 flex items-center gap-2 text-sm font-medium ${diag.color}`}
                >
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
  } else {
    const validCards = reading.cards
      .map((readingCard, index) => ({
        card: getCardByIdMemo(readingCard.id),
        index,
      }))
      .filter((item) => item.card !== undefined);

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
                  <MemoizedCardWithTooltip
                    card={card!}
                    size="lg"
                    onClick={() => onCardClick(card!)}
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
}
