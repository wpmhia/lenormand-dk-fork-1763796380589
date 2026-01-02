"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card as CardType } from "@/lib/types";
import { getCards } from "@/lib/data";
import { ChevronDown } from "lucide-react";

interface CardModalProps {
  card: CardType;
  onClose: () => void;
  layoutType?: number;
  position?: number;
}

export function CardModal({
  card,
  onClose,
  layoutType,
  position,
}: CardModalProps) {
  const [fullCard, setFullCard] = useState<CardType | null>(null);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    combinations: false,
    house: false,
  });

  useEffect(() => {
    const cards = getCards();
    setAllCards(cards);
    const completeCard = cards.find((c) => c.id === card.id);
    setFullCard(completeCard || null);
  }, [card.id]);

  const combos =
    fullCard && Array.isArray(fullCard.combos) ? fullCard.combos : [];

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!fullCard) {
    return (
      <Dialog
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onClose();
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto border-border bg-card p-md text-card-foreground sm:max-h-[90vh] sm:max-w-2xl sm:p-lg">
          <div className="flex h-32 items-center justify-center">
            <div className="text-muted-foreground">Loading card data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto border-border bg-card p-md text-card-foreground sm:max-h-[90vh] sm:max-w-2xl sm:p-lg">
        <DialogHeader className="pb-md">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl font-bold">{fullCard.id}.</span>
            <span className="text-xl">{fullCard.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-lg">
          {/* Card Image and Keywords - Always Visible */}
          <div className="flex items-start gap-lg">
            <div className="card-mystical relative h-64 w-48 flex-shrink-0 overflow-hidden rounded-lg border border-purple-500/30 shadow-elevation-2">
              <Image
                src={fullCard.imageUrl || ""}
                alt={fullCard.name}
                width={192}
                height={256}
                className="h-full w-full bg-card object-contain"
                sizes="192px"
              />
            </div>
            <div className="flex-1 space-y-lg">
              <div>
                <h3 className="mb-md text-sm font-semibold text-foreground">
                  Keywords
                </h3>
                <div className="flex flex-wrap gap-sm">
                  {fullCard.keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-muted text-xs text-muted-foreground"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Meaning Section - Always Visible */}
          <div className="space-y-md rounded-lg bg-muted/50 p-md">
            <h3 className="font-semibold text-foreground">Meaning</h3>
            {(() => {
              const meaning = fullCard.meaning;
              if (!meaning) {
                return (
                  <p className="text-muted-foreground">
                    {fullCard.uprightMeaning}
                  </p>
                );
              }
              return (
                <div className="space-y-lg text-sm">
                  <div>
                    <h4 className="mb-sm font-semibold text-foreground">
                      General meaning
                    </h4>
                    <p className="text-muted-foreground">{meaning.general}</p>
                  </div>

                  <div>
                    <h4 className="mb-md font-semibold text-foreground">
                      Positive aspects
                    </h4>
                    <ul className="space-y-sm">
                      {meaning.positive.map((aspect, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 flex-shrink-0 text-primary">
                            •
                          </span>
                          <span className="text-muted-foreground">
                            {aspect}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-md font-semibold text-foreground">
                      Challenging aspects
                    </h4>
                    <ul className="space-y-sm">
                      {meaning.negative.map((aspect, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-destructive mt-1 flex-shrink-0">
                            •
                          </span>
                          <span className="text-muted-foreground">
                            {aspect}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {meaning.relationships && (
                    <div>
                      <h4 className="mb-sm font-semibold text-foreground">
                        In relationships
                      </h4>
                      <p className="text-muted-foreground">
                        {meaning.relationships}
                      </p>
                    </div>
                  )}

                  {meaning.careerFinance && (
                    <div>
                      <h4 className="mb-sm font-semibold text-foreground">
                        Career & finance
                      </h4>
                      <p className="text-muted-foreground">
                        {meaning.careerFinance}
                      </p>
                    </div>
                  )}

                  {meaning.timing && (
                    <div>
                      <h4 className="mb-sm font-semibold text-foreground">
                        Timing
                      </h4>
                      <p className="text-muted-foreground">{meaning.timing}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* House Meaning - Grand Tableau Only */}
          {layoutType === 36 && position !== undefined && (
            <div className="space-y-md rounded-lg bg-muted/50 p-md">
              <button
                onClick={() => toggleSection("house")}
                className="flex w-full items-center justify-between px-md py-md transition-colors hover:bg-muted/70"
              >
                <h3 className="font-semibold text-foreground">House Meaning</h3>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${openSections.house ? "rotate-180" : ""}`}
                />
              </button>
              {openSections.house && (
                <div className="border-l-2 border-primary/30 px-md py-md text-sm text-muted-foreground">
                  <p className="mb-md">
                    Position {position + 1} in Grand Tableau represents:
                  </p>
                  <p className="font-medium text-foreground">
                    {(() => {
                      const houseMeanings = [
                        "Messages, news, communication, movement",
                        "Luck, opportunities, small joys",
                        "Travel, distance, foreign matters",
                        "Home, family, stability, foundation",
                        "Health, growth, longevity, nature",
                        "Confusion, uncertainty, dreams, illusions",
                        "Betrayal, deception, wisdom, healing",
                        "Endings, transformation, closure, rebirth",
                        "Gifts, celebrations, beauty, social success",
                        "Cutting change, decisions, surgery, harvest",
                        "Conflict, repetition, arguments, discipline",
                        "Communication, anxiety, siblings, short trips",
                        "New beginnings, innocence, children, playfulness",
                        "Cunning, work, employment, intelligence",
                        "Strength, money, protection, authority",
                        "Hope, goals, wishes, spirituality, fame",
                        "Change, movement, pregnancy, relocation",
                        "Loyalty, friends, faithfulness, pets",
                        "Authority, isolation, institutions, solitude",
                        "Social life, public, gatherings, community",
                        "Obstacles, delays, challenges, steadfastness",
                        "Choices, decisions, crossroads, options",
                        "Loss, worry, theft, details, stress",
                        "Love, emotions, relationships, passion",
                        "Commitment, cycles, marriage, contracts",
                        "Secrets, learning, knowledge, education",
                        "Written communication, documents, news",
                        "Masculine energy, men, father, husband",
                        "Feminine energy, women, mother, wife",
                        "Peace, maturity, sexuality, harmony",
                        "Success, vitality, happiness, clarity",
                        "Intuition, emotions, cycles, psychic abilities",
                        "Solutions, importance, answers, unlocking",
                        "Finance, abundance, business, wealth",
                        "Stability, security, patience, grounding",
                        "Burden, fate, sacrifice, religion, suffering",
                      ];
                      return houseMeanings[position] || "Unknown house meaning";
                    })()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Combinations Section - Always Visible */}
          {combos.length > 0 && (
            <div className="space-y-md rounded-lg bg-muted/50 p-md">
              <h3 className="font-semibold text-foreground">
                Card Combinations ({combos.length})
              </h3>
              <div className="space-y-sm">
                {combos.map((combo: any, index: number) => {
                  const comboCard = allCards.find(
                    (c) => c.id === combo.withCardId,
                  );
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-sm rounded-lg bg-muted p-sm"
                    >
                      <div className="h-12 w-9 flex-shrink-0 overflow-hidden rounded border border-border bg-card">
                        {comboCard && (
                          <Image
                            src={comboCard.imageUrl || ""}
                            alt={comboCard.name}
                            width={36}
                            height={48}
                            className="h-full w-full object-cover"
                            sizes="36px"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground">
                          {comboCard
                            ? comboCard.name
                            : `Card ${combo.withCardId}`}
                        </div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {combo.meaning}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
