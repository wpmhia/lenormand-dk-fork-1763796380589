"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { getCardById } from "@/lib/data";
import { Sparkles } from "lucide-react";

interface PhysicalCardInputProps {
  allCards: CardType[];
  targetCount: number;
  onSubmit: (cards: ReadingCard[]) => void;
  isSubmitting?: boolean;
}

interface ParsedCardResult {
  cards: ReadingCard[];
  errors: string[];
  warnings: string[];
}

export function PhysicalCardInput({
  allCards,
  targetCount,
  onSubmit,
  isSubmitting = false,
}: PhysicalCardInputProps) {
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parsedCards, setParsedCards] = useState<ReadingCard[]>([]);

  const parseCards = useCallback((inputValue: string): ParsedCardResult => {
    const trimmed = inputValue.trim();
    if (!trimmed) return { cards: [], errors: [], warnings: [] };

    const inputs = trimmed
      .split(/[,;\s\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const cards: ReadingCard[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const seenIds = new Set<number>();
    const unmatched: string[] = [];

    inputs.forEach((cardInput, i) => {
      let card: CardType | undefined;

      // Try number first
      const num = parseInt(cardInput, 10);
      if (!isNaN(num)) {
        if (num < 1 || num > 36) {
          errors.push(`"${cardInput}" is not valid (must be 1-36)`);
          return;
        }
        card = allCards.find((c) => c.id === num);
      }

      // Try name/keywords
      if (!card) {
        card = allCards.find(
          (c) =>
            c.name.toLowerCase() === cardInput.toLowerCase() ||
            c.keywords.some((k) => k.toLowerCase() === cardInput.toLowerCase())
        );
      }

      if (card) {
        if (seenIds.has(card.id)) {
          warnings.push(`"${cardInput}" is a duplicate of ${card.name}`);
          return;
        }
        seenIds.add(card.id);
        cards.push({ id: card.id, position: i });
      } else {
        unmatched.push(cardInput);
      }
    });

    if (unmatched.length > 0) {
      warnings.push(`Unrecognized: ${unmatched.join(", ")}`);
    }

    return { cards, errors, warnings };
  }, [allCards]);

  // Parse on input change
  useEffect(() => {
    const result = parseCards(input);
    setParsedCards(result.cards);
    setErrors(result.errors);
    setWarnings(result.warnings);
  }, [input, parseCards]);

  // Keyboard shortcut: Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (parsedCards.length === targetCount && !isSubmitting) {
          onSubmit(parsedCards);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [parsedCards, targetCount, isSubmitting, onSubmit]);

  const isComplete = parsedCards.length === targetCount;
  const hasErrors = errors.length > 0;

  // Get full card data for chips
  const cardChips = useMemo(() => {
    return parsedCards.map((card) => ({
      ...card,
      fullCard: getCardById(allCards, card.id),
    }));
  }, [parsedCards, allCards]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="physical-cards" className="font-medium text-foreground">
            Enter Your Cards:
          </Label>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                isComplete
                  ? "text-green-600 dark:text-green-400"
                  : "text-muted-foreground"
              }`}
            >
              {parsedCards.length} / {targetCount} cards
            </span>
            {isComplete && (
              <span
                className="h-2 w-2 rounded-full bg-green-500"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <Textarea
          id="physical-cards"
          value={input}
          onChange={(e) => {
            const newValue = e.target.value;
            // Prevent entering more cards than needed
            const inputs = newValue
              .split(/[,;\s\n]+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            if (inputs.length > targetCount) {
              const truncated = inputs.slice(0, targetCount).join(", ");
              setInput(truncated);
            } else {
              setInput(newValue);
            }
          }}
          placeholder={`Enter ${targetCount} card numbers (1-36) or names\n\nExamples: 1 5 12 • Rider, Clover, Ship • Birds, 20, 36`}
          className={`min-h-[120px] resize-none rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 ${
            hasErrors ? "border-destructive focus:border-destructive" : ""
          }`}
          rows={4}
          aria-invalid={hasErrors}
        />

        {/* Live Card Chips */}
        {cardChips.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-live="polite">
            {cardChips.map((card, index) => (
              <div
                key={`${card.id}-${index}`}
                className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-sm font-medium text-primary"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
                  {card.id}
                </span>
                {card.fullCard?.name || "Unknown"}
              </div>
            ))}
          </div>
        )}

        {/* Error and Warning Messages */}
        <div className="space-y-1">
          {errors.map((error, i) => (
            <p key={`error-${i}`} className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ))}
          {warnings.map((warning, i) => (
            <p
              key={`warning-${i}`}
              className="text-xs text-amber-600 dark:text-amber-400"
              role="alert"
            >
              ⚠️ {warning}
            </p>
          ))}
          <p className="text-xs text-muted-foreground">
            💡 Use numbers (1-36) or names. Try &quot;rider&quot;, &quot;clover&quot;, &quot;ship&quot;. Press Ctrl+Enter to submit.
          </p>
        </div>
      </div>

      <Button
        onClick={() => onSubmit(parsedCards)}
        disabled={!isComplete || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Starting...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Start Reading
          </>
        )}
      </Button>
    </div>
  );
}
