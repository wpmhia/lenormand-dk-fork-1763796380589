"use client";

import { Badge } from "@/components/ui/badge";
import { Card as CardType } from "@/lib/types";
import {
  GRAND_TABLEAU_TOPIC_CARDS,
} from "@/lib/spreads";
import { getTopicIcon } from "./SpreadPositions";
import { Sparkles, Zap, Clock, Target, Brain, Eye } from "lucide-react";

interface GrandTableauAnalysisProps {
  cards: CardType[];
  allCards: CardType[];
  significatorType: string;
  showAdvancedAnalysis: boolean;
  onToggleAnalysis: () => void;
  topicCards: Array<{ cardId: number; index: number; topic: { type: string; label: string } }>;
  diagonals: {
    topLeft: number[];
    bottomLeft: number[];
    topRight: number[];
    bottomRight: number[];
  } | null;
  significatorIndex: number;
  getCardByIdMemo: (id: number) => CardType | undefined;
}

export function GrandTableauAnalysis({
  showAdvancedAnalysis,
  onToggleAnalysis,
  topicCards,
  diagonals,
  significatorIndex,
  getCardByIdMemo,
}: GrandTableauAnalysisProps) {
  return (
    <div className="space-y-sm">
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
}

export function DirectionalLegend({ significatorIndex }: { significatorIndex: number }) {
  if (significatorIndex === -1) return null;
  
  return (
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
  );
}
