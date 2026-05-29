"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spade, ArrowRight } from "lucide-react";
import { getDailyCardCache, setDailyCardCache, drawRandomCardId, getTodayDateString } from "@/lib/daily-card";
import { Card as CardType } from "@/lib/types";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

interface DailyCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardType[];
}

type ViewState = "draw" | "drawing" | "result";

function buildDailyReading(card: CardType): string {
  const parts: string[] = [];

  parts.push(`Today's Card: ${card.name}`);
  parts.push("");
  parts.push(`Base meaning:`);
  parts.push(card.uprightMeaning);
  parts.push("");

  if (card.meaning?.general) {
    parts.push(`Daily focus:`);
    parts.push(card.meaning.general);
    parts.push("");
  }

  if (card.meaning?.positive?.length) {
    parts.push(`Key aspects today:`);
    for (const p of card.meaning.positive.slice(0, 3)) {
      parts.push(`• ${p}`);
    }
    parts.push("");
  }

  if (card.meaning?.negative?.length) {
    parts.push(`Watch for:`);
    for (const n of card.meaning.negative.slice(0, 3)) {
      parts.push(`• ${n}`);
    }
    parts.push("");
  }

  if (card.timing || card.meaning?.timing) {
    parts.push(`Timing: ${card.timing || card.meaning.timing}`);
    parts.push("");
  }

  parts.push(`Keywords: ${card.keywords.slice(0, 3).join(" • ")}`);

  return parts.join("\n");
}

export function DailyCardModal({ open, onOpenChange, cards }: DailyCardModalProps) {
  const [viewState, setViewState] = useState<ViewState>("draw");
  const [card, setCard] = useState<CardType | null>(null);
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showInstallPrompt } = useInstallPrompt();

  useEffect(() => {
    if (viewState === "result" && card) {
      const timer = setTimeout(() => showInstallPrompt(), 1500);
      return () => clearTimeout(timer);
    }
  }, [viewState, card, showInstallPrompt]);

  useEffect(() => {
    if (!open) return;

    const cached = getDailyCardCache();
    if (cached?.drawn && cached.cardId) {
      const foundCard = cards.find((c) => c.id === cached.cardId);
      if (foundCard) {
        setCard(foundCard);
        setViewState("result");
        return;
      }
    }

    setViewState("draw");
    setCard(null);
  }, [open, cards]);

  const handleDraw = async () => {
    setViewState("drawing");

    await new Promise<void>((resolve) => {
      drawTimeoutRef.current = setTimeout(resolve, 800);
    });

    const cardId = drawRandomCardId();
    const drawnCard = cards.find((c) => c.id === cardId);

    if (!drawnCard) {
      setViewState("draw");
      return;
    }

    setCard(drawnCard);
    setDailyCardCache(cardId);
    setViewState("result");
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  const renderDrawState = () => (
    <div className="p-8 text-center space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {getTodayDateString()}
        </p>
        <h3 className="text-xl font-bold text-foreground mt-1">
          Your Daily Card
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Take a moment to focus on your day ahead, then draw your card.
        </p>
      </div>

      <button
        onClick={handleDraw}
        className="relative mx-auto block transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
        aria-label="Draw your daily card"
      >
        <div
          className="lenormand-card overflow-hidden rounded-xl shadow-2xl shadow-primary/20"
          style={{
            width: "140px",
            height: "200px",
            backgroundImage: "url(/images/card-back.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#1a1a1a",
          }}
        />
      </button>

      <p className="text-sm text-muted-foreground">
        Click the deck to draw
      </p>
    </div>
  );

  const renderDrawingState = () => (
    <div className="flex items-center justify-center p-16">
      <div className="text-center space-y-4">
        <div className="relative">
          <div
            className="lenormand-card overflow-hidden rounded-xl mx-auto animate-pulse"
            style={{
              width: "140px",
              height: "200px",
              backgroundImage: "url(/images/card-back.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: "#1a1a1a",
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Drawing your card...
        </p>
      </div>
    </div>
  );

  const renderResultState = () => {
    if (!card) return null;
    const reading = buildDailyReading(card);

    return (
      <div className="space-y-4 p-6 overflow-y-auto max-h-[calc(90vh-2rem)]">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {getTodayDateString()}
          </p>
          <p className="text-xs text-muted-foreground/70">Your Daily Card</p>
        </div>

        <div className="relative mx-auto w-48">
          <div className="aspect-[2/3] relative overflow-hidden rounded-xl shadow-2xl shadow-primary/20">
            <Image
              src={card.imageUrl || "/images/cards-placeholder.jpg"}
              alt={card.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-2xl font-bold text-foreground">{card.name}</h3>
          <p className="text-sm text-muted-foreground">
            {card.keywords.slice(0, 3).join(" • ")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <Spade className="h-4 w-4 text-primary" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>

        <div className="space-y-3">
          {reading.split("\n").map((line, i) => {
            const isBold = line === `Today's Card: ${card.name}` || line.endsWith(":");
            return (
              <p
                key={i}
                className={`text-sm leading-relaxed ${isBold ? "font-semibold text-foreground" : "text-foreground/85"}`}
              >
                {line}
              </p>
            );
          })}
        </div>

        <div className="pt-2">
          <Link href="/read/new" onClick={handleClose}>
            <Button className="w-full gap-2" size="lg">
              Do a Full Reading
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 overflow-hidden border-0 bg-gradient-to-b from-card to-background">
        {viewState === "draw" && renderDrawState()}
        {viewState === "drawing" && renderDrawingState()}
        {viewState === "result" && renderResultState()}
      </DialogContent>
    </Dialog>
  );
}
