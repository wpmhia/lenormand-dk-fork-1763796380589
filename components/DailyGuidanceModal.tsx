"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, X, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { getDailyCardId, markDailyCardViewed, getTodayDateString } from "@/lib/daily-card";
import { Card as CardType } from "@/lib/types";

interface DailyGuidanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardType[];
}

export function DailyGuidanceModal({ open, onOpenChange, cards }: DailyGuidanceModalProps) {
  const [card, setCard] = useState<CardType | null>(null);
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);

  useEffect(() => {
    if (open && cards.length > 0) {
      const cardId = getDailyCardId();
      const foundCard = cards.find((c) => c.id === cardId);
      setCard(foundCard || null);
      setLoading(false);
      setInsight("");
      setInsightLoading(true);

      // Generate AI insight
      generateInsight(foundCard);
    }
  }, [open, cards]);

  const generateInsight = async (cardData: CardType | undefined) => {
    if (!cardData) {
      setInsightLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/readings/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Give me a brief daily guidance message",
          cards: [{ id: cardData.id, name: cardData.name, position: 0 }],
          spreadId: "daily-card",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Extract just a short summary (first sentence or two)
        const text = data.reading || "";
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        setInsight(sentences.slice(0, 2).join(". ") + ".");
      } else {
        setInsight(cardData.uprightMeaning);
      }
    } catch (error) {
      console.error("Failed to generate insight:", error);
      setInsight(cardData.uprightMeaning);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleClose = () => {
    markDailyCardViewed();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-gradient-to-b from-card to-background">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : card ? (
          <div className="space-y-4 p-6">
            {/* Date */}
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {getTodayDateString()}
              </p>
              <p className="text-xs text-muted-foreground/70">Your Daily Guidance</p>
            </div>

            {/* Card Image */}
            <div className="relative mx-auto w-48">
              <div className="aspect-[2/3] relative overflow-hidden rounded-xl shadow-2xl shadow-primary/20">
                <Image
                  src={card.imageUrl || "/images/cards-placeholder.jpg"}
                  alt={card.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Card back overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>

            {/* Card Info */}
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold text-foreground">{card.name}</h3>
              <p className="text-sm text-muted-foreground">
                {card.keywords.slice(0, 3).join(" • ")}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <Sparkles className="h-4 w-4 text-primary" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>

            {/* AI Insight */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Today&apos;s Insight
              </p>
              {insightLoading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Receiving guidance...</span>
                </div>
              ) : insight ? (
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  &ldquo;{insight}&rdquo;
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  {card.uprightMeaning}
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="pt-2">
              <Link href="/read/new?spread=single-card" onClick={handleClose}>
                <Button className="w-full gap-2" size="lg">
                  Get Full Reading
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Unable to load daily card</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
