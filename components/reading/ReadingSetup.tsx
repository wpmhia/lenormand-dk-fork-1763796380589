"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";
import { SpreadSelect, Spread } from "./SpreadSelect";
import { MethodToggle } from "./MethodToggle";

const SUGGESTED_QUESTIONS = [
  "What happens next?",
  "What does this connection show?",
  "What do the cards show about work?",
];

interface ReadingSetupProps {
  question: string;
  onQuestionChange: (question: string) => void;
  spread: Spread;
  onSpreadChange: (spread: Spread) => void;
  method: "virtual" | "physical" | null;
  onMethodChange: (method: "virtual" | "physical") => void;
  onContinue: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ReadingSetup({
  question,
  onQuestionChange,
  spread,
  onSpreadChange,
  method,
  onMethodChange,
  onContinue,
  disabled = false,
  isLoading = false,
}: ReadingSetupProps) {
  const charCount = question.length;

  return (
    <section className="space-y-5" aria-label="Reading setup">
      {/* Question Input */}
      <div className="space-y-2">
        <label htmlFor="question" className="text-sm font-medium text-foreground">
          Your Question
        </label>
        <Textarea
          id="question"
          value={question}
          onChange={(e) => {
            onQuestionChange(e.target.value);
          }}
          placeholder="What would you like to know?"
          className="min-h-[88px] resize-none rounded-md border-border bg-background text-foreground transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-primary focus:shadow-elevation-2 focus:ring-2 focus:ring-primary/20"
          maxLength={500}
          aria-describedby="question-count"
        />
        <div
          id="question-count"
          className="text-right text-xs text-muted-foreground"
          aria-live="polite"
        >
          {charCount}/500 characters
        </div>
      </div>

      {/* Suggested Questions */}
      {question.length === 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Try one</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  onQuestionChange(q);
                }}
                className="max-w-full rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-left text-xs leading-4 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spread Selection */}
      <SpreadSelect
        value={spread}
        onChange={onSpreadChange}
        disabled={disabled}
      />

      {/* Method Selection */}
      <MethodToggle
        value={method}
        onChange={onMethodChange}
        disabled={disabled}
      />

      {/* Primary action */}
      <Button
        onClick={onContinue}
        disabled={isLoading}
        size="lg"
        className="w-full gap-2 text-base"
      >
        Draw the Cards
        <ArrowRight className="h-4 w-4" />
      </Button>
    </section>
  );
}

export type { Spread };
