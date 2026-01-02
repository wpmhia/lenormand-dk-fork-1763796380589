"use client";

import { useState } from "react";
import { Reading, ReadingCard, Card as CardType } from "@/lib/types";
import {
  getCardById,
  getCombinationMeaning,
  getLinearAdjacentCards,
  getGrandTableauAdjacentCards,
} from "@/lib/data";
import { Card } from "./Card";
import { CardWithTooltip } from "./CardWithTooltip";
import { AnimatedCard } from "./AnimatedCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

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
        meaning: "Contributes to the Yes/No count based on its positive or negative meaning",
      },
      1: {
        label: "Center Card",
        meaning: "Tie-breaker card if the count is equal between positive and negative cards",
      },
      2: {
        label: "Third Card",
        meaning: "Contributes to the Yes/No count based on its positive or negative meaning",
      },
    },
    "sentence-3": {
      0: {
        label: "Opening Element",
        meaning: "Primary element - can represent past, mind, or situation depending on context",
      },
      1: {
        label: "Central Element",
        meaning: "Core element - can represent present, body, or action depending on context",
      },
      2: {
        label: "Closing Element",
        meaning: "Final element - can represent future, spirit, or outcome; check mirror relationship with central element",
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
        meaning: "The qualifier or condition—how, when, or under what circumstance",
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
        meaning: "New beginnings, fresh starts, and initial energy for the week",
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
        meaning: "Left partner's past experiences and history affecting the relationship",
      },
      1: {
        label: "Partner 1 - Present",
        meaning: "Left partner's current feelings, thoughts, and situation in the relationship",
      },
      2: {
        label: "Partner 1 - Future",
        meaning: "Left partner's hopes, expectations, and vision for the relationship's future",
      },
      3: {
        label: "Relationship Core",
        meaning: "The central dynamic, challenge, or connection that sits between both partners",
      },
      4: {
        label: "Partner 2 - Past",
        meaning: "Right partner's past experiences and history affecting the relationship",
      },
      5: {
        label: "Partner 2 - Present",
        meaning: "Right partner's current feelings, thoughts, and situation in the relationship",
      },
      6: {
        label: "Partner 2 - Future",
        meaning: "Right partner's hopes, expectations, and vision for the relationship's future",
      },
    },
    comprehensive: {
      0: {
        label: "Recent Past - Inner World",
        meaning: "Thoughts, feelings, and personal resources from your recent past that influence your current situation",
      },
      1: {
        label: "Recent Past - Direct Actions",
        meaning: "Actions you took recently that shaped your current circumstances",
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
        meaning: "Current external influences, other people, and environmental factors",
      },
      6: {
        label: "Near Future - Inner World",
        meaning: "How your thoughts and feelings will evolve in the near future",
      },
      7: {
        label: "Near Future - Direct Actions",
        meaning: "Actions you'll need to take in the near future",
      },
      8: {
        label: "Near Future - Outside World",
        meaning: "External events and influences approaching in the near future",
      },
    },
  };

  if (spreadId && spreadPositions[spreadId]) {
    return spreadPositions[spreadId][position] || {
      label: "Position " + (position + 1),
      meaning: "",
    };
  }
  return {
    label: "Position " + (position + 1),
    meaning: "",
  };
};

const getGrandTableauPosition = (index: number) => {
  const row = Math.floor(index / 9);
  const col = index % 9;
  return {
    row,
    col,
    label: "R" + (row + 1) + "C" + (col + 1),
  };
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
      return (
        <div className="flex justify-center py-lg">
          {reading.cards.map((readingCard, index) => {
            const card = getCardById(allCards, readingCard.id);
            if (!card) return null;

            const positionInfo = getPositionInfo(index, spreadId);

            return (
              <AnimatedCard key={index} delay={0} className="flex flex-col items-center space-y-lg">
                <div className="flex flex-col items-center space-y-md">
                  <div className="inline-flex items-center justify-center rounded-lg border-2 border-primary bg-primary/10 px-md py-sm text-sm font-semibold text-primary">
                    {positionInfo.label}
                  </div>
                  <CardWithTooltip
                    card={card}
                    size="lg"
                    onClick={() => setSelectedCard(card)}
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
          <div className="grid gap-sm" style={{ gridTemplateColumns: "repeat(9, minmax(0, 1fr))" }}>
            {reading.cards.map((readingCard, index) => {
              const card = getCardById(allCards, readingCard.id);
              if (!card) return null;

              const pos = getGrandTableauPosition(index);

              return (
                <AnimatedCard
                  key={index}
                  delay={index * 0.05}
                  className="flex flex-col items-center space-y-sm rounded-lg border-2 border-border p-sm"
                >
                  <div className="text-center text-xs font-semibold text-muted-foreground">
                    {pos.label}
                  </div>
                  <CardWithTooltip
                    card={card}
                    size="sm"
                    onClick={() => setSelectedCard(card)}
                    className="cursor-pointer"
                    positionLabel={pos.label}
                    positionDescription={`Position ${index + 1}`}
                  />
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      );
    } else {
      const columns = reading.layoutType === 3 ? 3 : reading.layoutType === 5 ? 5 : reading.layoutType === 7 ? 7 : 4;
      return (
        <div className="flex flex-wrap justify-center gap-md py-lg">
          {reading.cards.map((readingCard, index) => {
            const card = getCardById(allCards, readingCard.id);
            if (!card) return null;

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
                    card={card}
                    size="lg"
                    onClick={() => setSelectedCard(card)}
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
          <h3 className="mb-lg text-xl font-semibold text-foreground">Your Cards</h3>
          {renderLayout()}
        </div>
      </div>

      {selectedCard && (
        <div className="animate-in fade-in slide-in-from-bottom-8 rounded-lg border border-border bg-card p-xl shadow-elevation-1 duration-500">
          <h3 className="mb-lg text-xl font-semibold text-foreground">Card Combinations</h3>
          <div className="space-y-md">
            {(() => {
              const readingCard = reading.cards.find((c) => c.id === selectedCard.id);
              if (!readingCard) return null;

              const adjacentCards = getAdjacentCards(readingCard);

              if (adjacentCards.length === 0) {
                return (
                  <div className="py-xl text-center text-muted-foreground/60">
                    <p className="mb-md italic">No adjacent cards in this layout</p>
                    <p className="text-sm">
                      In larger spreads, this card would interact with nearby cards
                    </p>
                  </div>
                );
              }

              return adjacentCards.map((adjCard, index) => {
                const card = getCardById(allCards, adjCard.id);
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
                      <Card card={selectedCard} size="sm" />
                      <span className="text-lg font-medium text-primary">+</span>
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
