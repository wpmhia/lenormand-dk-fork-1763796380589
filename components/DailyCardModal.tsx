"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  getDailyCardCache,
  setDailyCardCache,
  drawRandomCardId,
  getTodayDateString,
} from "@/lib/daily-card";
import { Card as CardType } from "@/lib/types";

interface DailyCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardType[];
}

type ViewState = "draw" | "drawing" | "result";

export function DailyCardModal({
  open,
  onOpenChange,
  cards,
}: DailyCardModalProps) {
  const [viewState, setViewState] = useState<ViewState>("draw");
  const [card, setCard] = useState<CardType | null>(null);
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <div className="space-y-6 p-8 text-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {getTodayDateString()}
        </p>
        <h3 className="mt-1 text-xl font-bold text-foreground">
          Your Daily Card
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Take a moment to focus on your day ahead, then draw your card.
        </p>
      </div>

      <button
        onClick={handleDraw}
        className="relative mx-auto block rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
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

      <p className="text-sm text-muted-foreground">Click the deck to draw</p>
    </div>
  );

  const renderDrawingState = () => (
    <div className="flex items-center justify-center p-16">
      <div className="space-y-4 text-center">
        <div className="relative">
          <div
            className="lenormand-card mx-auto animate-pulse overflow-hidden rounded-xl"
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
        <p className="animate-pulse text-sm text-muted-foreground">
          Drawing your card...
        </p>
      </div>
    </div>
  );

  const renderResultState = () => {
    if (!card) return null;

    return (
      <div className="space-y-4 p-5 sm:p-6">
        <div className="text-center">
          <p className="text-xs font-medium text-muted-foreground">
            {getTodayDateString()}
          </p>
        </div>

        <div className="relative mx-auto w-32 sm:w-40">
          <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-xl shadow-lg shadow-primary/20">
            <Image
              src={card.imageUrl || "/images/cards-placeholder.jpg"}
              alt={card.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">{card.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {card.keywords.slice(0, 2).join(" • ")}
          </p>
        </div>

        <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground/90">
          {card.meaning?.general}
        </div>

        <Link href="/read/new" onClick={handleClose}>
          <Button className="h-10 w-full gap-1.5 text-sm" size="sm">
            Full Reading
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-sm overflow-y-auto border-0 bg-gradient-to-b from-card to-background p-0 sm:max-w-md">
        {viewState === "draw" && renderDrawState()}
        {viewState === "drawing" && renderDrawingState()}
        {viewState === "result" && renderResultState()}
      </DialogContent>
    </Dialog>
  );
}
