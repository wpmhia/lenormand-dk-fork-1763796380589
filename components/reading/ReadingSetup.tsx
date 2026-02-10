"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, ArrowRight } from "lucide-react";
import { SpreadSelect, Spread } from "./SpreadSelect";
import { MethodToggle } from "./MethodToggle";

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
  const [charCount, setCharCount] = useState(question.length);

  const canContinue = method !== null;

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl text-card-foreground">
          <Eye className="h-5 w-5" />
          Your Sacred Question
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Input */}
        <div className="space-y-3">
          <Textarea
            id="question"
            value={question}
            onChange={(e) => {
              onQuestionChange(e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder="What guidance do the cards have for me today?"
            className="min-h-[100px] resize-none rounded-xl border-border bg-background text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-primary focus:shadow-lg focus:ring-2 focus:ring-primary/20"
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

        {/* Continue Button */}
        {method && (
          <Button
            onClick={onContinue}
            disabled={!canContinue || disabled || isLoading}
            loading={isLoading}
            loadingText="Loading..."
            size="lg"
            className="w-full"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export type { Spread };
