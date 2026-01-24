"use client";

import { useState, useMemo } from "react";
import { Reading, ReadingCard, Card as CardType } from "@/lib/types";
import {
  getCardById,
  getLinearAdjacentCards,
  getGrandTableauAdjacentCards,
  getCombinationMeaning,
} from "@/lib/data";
import { getStaticCombination } from "@/lib/static-data";
import {
  GrandTableauPosition,
  getGrandTableauPosition,
  getPositionZone,
  getTopicCardsInSpread,
  getDiagonalCards,
  GRAND_TABLEAU_TOPIC_CARDS,
  GRAND_TABLEAU_CORNERS,
  GRAND_TABLEAU_CARDS_OF_FATE,
  GRAND_TABLEAU_CENTER_CARDS,
  DIRECTIONAL_ZONES,
  SignificatorType,
  SIGNIFICATOR_CARDS,
} from "@/lib/spreads";
import { Card } from "./Card";
import { CardWithTooltip } from "./CardWithTooltip";
import { AnimatedCard } from "./AnimatedCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Share2,
  Heart,
  Home,
  TreeDeciduous,
  Briefcase,
  User,
  Anchor,
  Fish,
  Ship,
  Sparkles,
  Target,
  Clock,
  Eye,
  Brain,
  Zap,
} from "lucide-react";

interface ReadingViewerProps {
  reading: Reading;
  allCards: CardType[];
  showShareButton?: boolean;
  onShare?: () => void;
  showReadingHeader?: boolean;
  spreadId?: string;
}

interface PositionInfo {
  label: string;
  meaning: string;
}

const getPositionInfo = (position: number, spreadId?: string): PositionInfo => {
  const spreadPositions: Record<string, Record<number, PositionInfo>> = {
    "past-present-future": {
      0: {
        label: "Past",
        meaning: "Influences from your past that shaped your current situation",
      },
      1: {
        label: "Present",
        meaning: "Your current circumstances and immediate challenges",
      },
      2: {
        label: "Future",
        meaning: "Potential outcome based on your current path",
      },
    },
    "situation-challenge-advice": {
      0: {
        label: "Situation",
        meaning: "The current situation or question you face",
      },
      1: {
        label: "Challenge",
        meaning: "Obstacles or difficulties you may encounter",
      },
      2: {
        label: "Advice",
        meaning: "Guidance for how to proceed",
      },
    },
    "mind-body-spirit": {
      0: {
        label: "Mind",
        meaning: "Thoughts, mental state, and intellectual matters",
      },
      1: {
        label: "Body",
        meaning: "Physical health, actions, and material concerns",
      },
      2: {
        label: "Spirit",
        meaning: "Emotional well-being, spiritual growth, and inner wisdom",
      },
    },
    "yes-no-maybe": {
      0: {
        label: "First Card",
        meaning:
          "Contributes to the Yes/No count based on its positive or negative meaning",
      },
      1: {
        label: "Center Card",
        meaning:
          "Tie-breaker card if the count is equal between positive and negative cards",
      },
      2: {
        label: "Third Card",
        meaning:
          "Contributes to the Yes/No count based on its positive or negative meaning",
      },
    },
    "sentence-3": {
      0: {
        label: "Opening Element",
        meaning:
          "Primary element - can represent past, mind, or situation depending on context",
      },
      1: {
        label: "Central Element",
        meaning:
          "Core element - can represent present, body, or action depending on context",
      },
      2: {
        label: "Closing Element",
        meaning:
          "Final element - can represent future, spirit, or outcome; check mirror relationship with central element",
      },
    },
    "structured-reading": {
      0: {
        label: "Subject",
        meaning: "The opening element—who or what the story begins with",
      },
      1: {
        label: "Verb",
        meaning: "The action or descriptor—what is happening or being done",
      },
      2: {
        label: "Object",
        meaning: "The direct impact or target—what is being affected",
      },
      3: {
        label: "Modifier",
        meaning:
          "The qualifier or condition—how, when, or under what circumstance",
      },
      4: {
        label: "Outcome",
        meaning: "The result or conclusion—where this leads",
      },
    },
    "sentence-5": {
      0: {
        label: "Situation",
        meaning: "",
      },
      1: {
        label: "Challenge",
        meaning: "",
      },
      2: {
        label: "Advice",
        meaning: "",
      },
      3: {
        label: "Outcome",
        meaning: "",
      },
      4: {
        label: "Timing",
        meaning: "",
      },
    },
    "week-ahead": {
      0: {
        label: "Monday",
        meaning:
          "New beginnings, fresh starts, and initial energy for the week",
      },
      1: {
        label: "Tuesday",
        meaning: "Challenges, obstacles, and work-related matters",
      },
      2: {
        label: "Wednesday",
        meaning: "Communication, connections, and mid-week transitions",
      },
      3: {
        label: "Thursday",
        meaning: "Progress, building momentum, and preparation",
      },
      4: {
        label: "Friday",
        meaning: "Social aspects, completion, and winding down",
      },
      5: {
        label: "Saturday",
        meaning: "Rest, reflection, and personal matters",
      },
      6: {
        label: "Sunday",
        meaning: "Closure, spiritual matters, and weekly review",
      },
    },
    "relationship-double-significator": {
      0: {
        label: "Partner 1 - Past",
        meaning:
          "Left partner's past experiences and history affecting the relationship",
      },
      1: {
        label: "Partner 1 - Present",
        meaning:
          "Left partner's current feelings, thoughts, and situation in the relationship",
      },
      2: {
        label: "Partner 1 - Future",
        meaning:
          "Left partner's hopes, expectations, and vision for the relationship's future",
      },
      3: {
        label: "Relationship Core",
        meaning:
          "The central dynamic, challenge, or connection that sits between both partners",
      },
      4: {
        label: "Partner 2 - Past",
        meaning:
          "Right partner's past experiences and history affecting the relationship",
      },
      5: {
        label: "Partner 2 - Present",
        meaning:
          "Right partner's current feelings, thoughts, and situation in the relationship",
      },
      6: {
        label: "Partner 2 - Future",
        meaning:
          "Right partner's hopes, expectations, and vision for the relationship's future",
      },
    },
    comprehensive: {
      0: {
        label: "Recent Past - Inner World",
        meaning:
          "Thoughts, feelings, and personal resources from your recent past that influence your current situation",
      },
      1: {
        label: "Recent Past - Direct Actions",
        meaning:
          "Actions you took recently that shaped your current circumstances",
      },
      2: {
        label: "Recent Past - Outside World",
        meaning: "External influences and events from your recent past",
      },
      3: {
        label: "Present - Inner World",
        meaning: "Your current thoughts, feelings, and internal state",
      },
      4: {
        label: "Present - Direct Actions",
        meaning: "Your current actions and the central issue you're facing",
      },
      5: {
        label: "Present - Outside World",
        meaning:
          "Current external influences, other people, and environmental factors",
      },
      6: {
        label: "Near Future - Inner World",
        meaning:
          "How your thoughts and feelings will evolve in the near future",
      },
      7: {
        label: "Near Future - Direct Actions",
        meaning: "Actions you'll need to take in the near future",
      },
      8: {
        label: "Near Future - Outside World",
        meaning:
          "External events and influences approaching in the near future",
      },
    },
  };

  if (spreadId && spreadPositions[spreadId]) {
    return (
      spreadPositions[spreadId][position] || {
        label: "Position " + (position + 1),
        meaning: "",
      }
    );
  }
  return {
    label: "Position " + (position + 1),
    meaning: "",
  };
};

const getTopicIcon = (type: string) => {
  switch (type) {
    case "health":
      return <TreeDeciduous className="h-3 w-3" />;
    case "home":
      return <Home className="h-3 w-3" />;
    case "love":
      return <Heart className="h-3 w-3" />;
    case "job":
      return <Briefcase className="h-3 w-3" />;
    case "boss":
      return <User className="h-3 w-3" />;
    case "career":
      return <Anchor className="h-3 w-3" />;
    case "money":
      return <Fish className="h-3 w-3" />;
    case "travel":
      return <Ship className="h-3 w-3" />;
    default:
      return <Sparkles className="h-3 w-3" />;
  }
};

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
}: ReadingViewerProps) {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [shareClicked, setShareClicked] = useState(false);
  const [significatorType, setSignificatorType] =
    useState<SignificatorType>("none");

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

  const renderLayout = () => {
    if (reading.layoutType === 1) {
      const validCards = reading.cards
        .map((readingCard, index) => ({ card: getCardById(allCards, readingCard.id), index }))
        .filter(item => item.card !== undefined);

      return (
        <div className="flex justify-center py-lg">
          {validCards.map(({ card: card, index }) => {
            const positionInfo = getPositionInfo(index, spreadId);

            return (
              <AnimatedCard
                key={index}
                delay={0}
                className="flex flex-col items-center space-y-lg"
              >
                <div className="flex flex-col items-center space-y-md">
                  <div className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-md py-sm text-sm font-semibold text-primary">
                    {positionInfo.label}
                  </div>
                  <CardWithTooltip
                    card={card!}
                    size="lg"
                    onClick={() => setSelectedCard(card!)}
                    className="cursor-pointer"
                    positionLabel={positionInfo.label}
                    positionDescription={positionInfo.meaning}
                  />
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      );
    } else if (reading.layoutType === 36) {
      return (
        <div className="space-y-sm">
          {/* Grand Tableau directional legend */}
          {significatorIndex !== -1 && (
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
                <span className="text-muted-foreground">
                  Below = Unconscious
                </span>
              </div>
            </div>
          )}

          <div
            className="grid gap-sm"
            style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}
          >
            {reading.cards
              .map((readingCard, index) => ({ card: getCardById(allCards, readingCard.id), index }))
              .filter(item => item.card !== undefined)
              .map(({ card, index }) => {
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
                if (isSignificator) {
                  borderClass = "border-amber-500 ring-2 ring-amber-500/30";
                } else if (isCorner) {
                  borderClass = "border-purple-500/50";
                } else if (isCardsOfFate) {
                  borderClass = "border-red-500/50";
                } else if (isCenter) {
                  borderClass = "border-green-500/50";
                }

                return (
                  <AnimatedCard
                    key={index}
                    delay={index * 0.03}
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
                    </div>

                    {/* Directional indicator */}
                    {zone && significatorIndex !== -1 && !isSignificator && (
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

                    <CardWithTooltip
                      card={card!}
                      size="sm"
                      onClick={() => setSelectedCard(card!)}
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

                    {/* Topic card badge */}
                    {topicInfo && (
                      <div className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        {getTopicIcon(topicInfo.type)}
                        <span>{topicInfo.label}</span>
                      </div>
                    )}
                  </AnimatedCard>
                );
              })}
          </div>

          {/* Topic cards summary */}
          {topicCards.length > 0 && (
            <div className="mt-lg rounded-lg border border-border bg-card p-md">
              <h4 className="mb-md flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Topic Cards in This Reading
              </h4>
              <div className="flex flex-wrap gap-md">
                {topicCards.map((tc) => {
                  const card = getCardById(allCards, tc.cardId);
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

          {/* Diagonals summary */}
          {diagonals && (
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
        const columns =
          reading.layoutType === 3
            ? 3
            : reading.layoutType === 5
              ? 5
              : reading.layoutType === 7
                ? 7
                : 4;

        const validCards = reading.cards
          .map((readingCard, index) => ({ card: getCardById(allCards, readingCard.id), index }))
          .filter(item => item.card !== undefined);

        return (
          <div className="flex flex-wrap justify-center gap-md py-lg">
            {validCards.map(({ card, index }) => {
              const positionInfo = getPositionInfo(index, spreadId);

              return (
                <AnimatedCard
                  key={index}
                  delay={index * 0.15}
                  className="flex flex-col items-center space-y-md"
                >
                  <div className="flex flex-col items-center space-y-md">
                    <div className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-md py-sm text-sm font-semibold text-primary">
                      {positionInfo.label}
                    </div>
                    <CardWithTooltip
                      card={card!}
                      size="lg"
                      onClick={() => setSelectedCard(card!)}
                      className="cursor-pointer"
                      positionLabel={positionInfo.label}
                      positionDescription={positionInfo.meaning}
                    />
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        );
      }
  };

  return (
    <div className="space-y-xl">
      {showReadingHeader && (
        <div className="relative">
          <div className="mb-lg flex flex-wrap items-center justify-center gap-lg text-sm text-muted-foreground">
            <Badge variant="secondary">{reading.layoutType} Cards</Badge>

            {/* Significator selector for Grand Tableau */}
            {reading.layoutType === 36 && (
              <div className="flex items-center gap-2">
                <span className="text-xs">Significator:</span>
                <Select
                  value={significatorType}
                  onValueChange={(value) =>
                    setSignificatorType(value as SignificatorType)
                  }
                >
                  <SelectTrigger className="h-8 w-[120px] border-border text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="anima">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Anima (28)
                      </div>
                    </SelectItem>
                    <SelectItem value="animus">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Animus (29)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showShareButton && onShare && (
              <Button
                onClick={async () => {
                  setShareClicked(true);
                  await onShare();
                  setTimeout(() => setShareClicked(false), 2000);
                }}
                variant="outline"
                size="sm"
                className="border-border hover:bg-muted"
              >
                <Share2 className="mr-2 h-4 w-4" />
                {shareClicked ? "Copied!" : "Share"}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-8 overflow-visible delay-150 duration-500">
        <div className="overflow-visible rounded-lg border border-border bg-card p-xl shadow-elevation-1">
          <h3 className="mb-lg text-xl font-semibold text-foreground">
            Your Cards
          </h3>
          {renderLayout()}
        </div>
      </div>

      {selectedCard && (
        <div className="animate-in fade-in slide-in-from-bottom-8 rounded-lg border border-border bg-card p-xl shadow-elevation-1 duration-500">
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
                const card = getCardById(allCards, adjCard.id);
                if (!card) return null;

                const combination = getStaticCombination(
                  selectedCard.id,
                  card.id,
                ) || getCombinationMeaning(
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
                      <Card card={selectedCard} size="sm" />
                      <span className="text-lg font-medium text-primary">
                        +
                      </span>
                      <Card card={card} size="sm" />
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
