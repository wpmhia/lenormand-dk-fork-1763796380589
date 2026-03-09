"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spade, ArrowRight, Loader2 } from "lucide-react";
import { getDailyCardCache, setDailyCardCache, drawRandomCardId, getTodayDateString } from "@/lib/daily-card";
import { Card as CardType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DailyCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: CardType[];
}

type ViewState = "draw" | "drawing" | "result";

export function DailyCardModal({ open, onOpenChange, cards }: DailyCardModalProps) {
  const [viewState, setViewState] = useState<ViewState>("draw");
  const [card, setCard] = useState<CardType | null>(null);
  const [insight, setInsight] = useState<string>("");
  const [insightLoading, setInsightLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const drawTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (drawTimeoutRef.current) {
        clearTimeout(drawTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    
    // Check if already drawn today
    const cached = getDailyCardCache();
    if (cached?.drawn && cached.cardId) {
      const foundCard = cards.find((c) => c.id === cached.cardId);
      if (foundCard) {
        setCard(foundCard);
        setInsight(cached.insight);
        setViewState("result");
        return;
      }
    }
    
    // Reset to draw state
    setViewState("draw");
    setCard(null);
    setInsight("");
  }, [open, cards]);

  const handleDraw = async () => {
    setViewState("drawing");
    
    // Simulate brief suspense with cancellable timeout
    await new Promise((resolve) => {
      drawTimeoutRef.current = setTimeout(resolve, 800);
    });
    
    const cardId = drawRandomCardId();
    const drawnCard = cards.find((c) => c.id === cardId);
    
    if (!drawnCard) {
      setViewState("draw");
      return;
    }
    
    setCard(drawnCard);
    setViewState("result");
    
    // Check if we have cached insight for this card today
    const cached = getDailyCardCache();
    if (cached?.cardId === cardId && cached.insight) {
      setInsight(cached.insight);
      return;
    }
    
    // Generate new insight
    setInsightLoading(true);
    generateInsight(drawnCard, cardId);
  };

  const generateInsight = async (cardData: CardType, cardId: number) => {
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch("/api/readings/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "What will happen today?",
          cards: [{ id: cardData.id, name: cardData.name, position: 0, keywords: cardData.keywords }],
          spreadId: "daily-card",
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        setInsight(cardData.uprightMeaning);
        setDailyCardCache(cardId, cardData.uprightMeaning);
        setInsightLoading(false);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) {
          setInsight(cardData.uprightMeaning);
          setDailyCardCache(cardId, cardData.uprightMeaning);
          setInsightLoading(false);
          return;
        }
        
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "chunk" && parsed.content) {
                    fullText += parsed.content;
                  } else if (parsed.type === "done") {
                    setInsight(fullText);
                    setDailyCardCache(cardId, fullText);
                    setInsightLoading(false);
                    return;
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Fallback if stream ends without done signal
        if (fullText) {
          setInsight(fullText);
          setDailyCardCache(cardId, fullText);
        } else {
          setInsight(cardData.uprightMeaning);
          setDailyCardCache(cardId, cardData.uprightMeaning);
        }
      } else {
        const data = await response.json();
        const text = data.reading || cardData.uprightMeaning;
        setInsight(text);
        setDailyCardCache(cardId, text);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Failed to generate insight:", error);
        setInsight(cardData.uprightMeaning);
        setDailyCardCache(cardId, cardData.uprightMeaning);
      }
    } finally {
      setInsightLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 overflow-hidden border-0 bg-gradient-to-b from-card to-background">
        {viewState === "draw" && (
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

            {/* Clickable Deck */}
            <button
              onClick={handleDraw}
              className="relative mx-auto block transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
              aria-label="Draw your daily card"
            >
              <div
                className="card-mystical overflow-hidden rounded-xl shadow-2xl shadow-primary/20"
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
        )}

        {viewState === "drawing" && (
          <div className="flex items-center justify-center p-16">
            <div className="text-center space-y-4">
              <div className="relative">
                <div
                  className="card-mystical overflow-hidden rounded-xl mx-auto animate-pulse"
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
        )}

        {viewState === "result" && card && (
          <div className="space-y-4 p-6 overflow-y-auto max-h-[calc(90vh-2rem)]">
            {/* Date */}
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {getTodayDateString()}
              </p>
              <p className="text-xs text-muted-foreground/70">Your Daily Card</p>
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
              <Spade className="h-4 w-4 text-primary" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>

            {/* AI Insight */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Today&apos;s Prediction
              </p>
              {insightLoading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Consulting the cards...</span>
                </div>
              ) : insight ? (
                <p className="text-sm leading-relaxed text-foreground/90 text-left">
                  {insight}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
