"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, ArrowRight } from "lucide-react";
import { SpreadSelect, Spread } from "./SpreadSelect";
import { MethodToggle } from "./MethodToggle";

const SUGGESTED_QUESTIONS = [
  "What is the likely next development?",
  "What should I know about this connection?",
  "What do the cards show about work or money?",
];

interface ReadingSetupProps {
  question: string;
  onQuestionChange: (question: string) => void;
  spread: Spread;
  onSpreadChange: (spread: Spread) => void;
  method: "virtual" | "physical" | null;
  onMethodChange: (method: "virtual" | "physical") => void;
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
  disabled = false,
  isLoading = false,
}: ReadingSetupProps) {
  const charCount = question.length;

  return (
    <Card className="overflow-hidden rounded-lg border-border bg-card shadow-elevation-1 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl text-card-foreground">
          <Eye className="h-5 w-5" />
          Ask the Cards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Input */}
        <div className="space-y-3">
          <label htmlFor="question" className="text-sm font-medium text-foreground">
            Your Question
          </label>
          <Textarea
            id="question"
            value={question}
            onChange={(e) => {
              onQuestionChange(e.target.value);
            }}
            placeholder="What guidance do the cards have for me today?"
            className="min-h-[100px] resize-none rounded-md border-border bg-background text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:shadow-elevation-2 focus:ring-2 focus:ring-primary/20"
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
            <p className="text-xs text-muted-foreground">Try one:</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    onQuestionChange(q);
                  }}
                  className="shrink-0 whitespace-nowrap rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
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
      </CardContent>
    </Card>
  );
}

export type { Spread };
