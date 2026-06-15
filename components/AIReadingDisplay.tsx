"use client";

import { useState, useRef, memo } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIThinkingIndicator } from "@/components/ui/loading";
import Link from "next/link";
import { RefreshCw, Copy, Check, AlertCircle, MessageCircle } from "lucide-react";
import { ReadingMarkdown } from "@/lib/reading-parser";
import { trackEvent } from "@/lib/analytics";

interface AIReadingDisplayProps {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  isStreaming?: boolean;
  error: string | null;
  onRetry: () => void;
  onFollowUp?: (question: string) => void;
  followUpLoading?: boolean;
  followUpStreaming?: boolean;
  followUpResponse?: string | null;
  spreadId?: string;
  cardCount?: number;
}

export const AIReadingDisplay = memo(function AIReadingDisplay({
  aiReading,
  isLoading,
  isStreaming = false,
  error,
  onRetry,
  onFollowUp,
  followUpLoading = false,
  followUpStreaming = false,
  followUpResponse = null,
  spreadId,
  cardCount,
}: AIReadingDisplayProps) {
  const [copyClicked, setCopyClicked] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function getPlainReadingText(reading: string): string {
    return reading
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "• ")
      .replace(/^\d+\.\s+/gm, "")
      .trim();
  }

  async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall through to textarea fallback
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);

      return ok;
    } catch {
      return false;
    }
  }

  const handleCopy = async () => {
    if (!aiReading?.reading) return;
    const plainText = getPlainReadingText(aiReading.reading);
    const ok = await copyTextToClipboard(plainText);

    setCopyClicked(ok);
    setCopyError(!ok);

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopyClicked(false);
      setCopyError(false);
    }, 2000);
  };

  const handleFollowUpSubmit = () => {
    if (!followUpQuestion.trim() || !onFollowUp) return;
    onFollowUp(followUpQuestion.trim());
  };

  const handleFollowUpKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleFollowUpSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="consulting-glow rounded-2xl">
        <AIThinkingIndicator
          message="Consulting the cards..."
          subtext="Reading the cards for clear, practical guidance"
        />
      </div>
    );
  }

  if (error && !isStreaming) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">Interpretation Unavailable</h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-md">{error}</p>
          <Button onClick={onRetry} size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!aiReading?.reading && !isStreaming) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">AI Reading Failed</h3>
          <p className="mb-6 text-sm text-muted-foreground">The AI interpretation could not be generated. Please try again.</p>
          <Button onClick={onRetry} size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Reading
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isStreaming && !aiReading?.reading) {
    return (
      <div className="consulting-glow rounded-2xl">
        <AIThinkingIndicator
          message="Consulting the cards..."
          subtext="Reading the cards for clear, practical guidance"
        />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Lenormand Interpretation</span>
          <Link href="/how-readings-work" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">
            How this reading was made
          </Link>
            {isStreaming && (
              <span className="text-xs text-primary">Reading...</span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
            {copyError ? (
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            ) : copyClicked ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {copyError ? "Copy failed" : copyClicked ? "Copied" : "Copy"}
            </span>
          </Button>
        </div>

        <div className="reading-content space-y-4 text-foreground">
          {aiReading?.reading && (
            <div className="leading-relaxed">
              <ReadingMarkdown>{aiReading.reading}</ReadingMarkdown>
            </div>
          )}
        </div>

        {!isStreaming && aiReading?.reading && (
          <FeedbackButtons reading={aiReading.reading} spreadId={spreadId} cardCount={cardCount} />
        )}

        {!isStreaming && !followUpResponse && (
          <div className="mt-8 pt-6 border-t border-border/50">
            {!showFollowUpInput ? (
              <button
                onClick={() => setShowFollowUpInput(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Ask a follow-up
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  onKeyDown={handleFollowUpKeyDown}
                  placeholder="What else should I know?"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  rows={2}
                  disabled={followUpLoading || followUpStreaming}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFollowUpInput(false);
                      setFollowUpQuestion("");
                    }}
                    disabled={followUpLoading || followUpStreaming}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleFollowUpSubmit}
                    disabled={!followUpQuestion.trim() || followUpLoading || followUpStreaming}
                  >
                    {followUpLoading ? "..." : "Ask"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {(followUpResponse || followUpStreaming) && (
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              Follow-up
            </div>
            <div className="text-sm text-foreground/90">
              {followUpStreaming && !followUpResponse ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-primary"></div>
                  <span>Consulting the cards...</span>
                </div>
              ) : (
                <div className="leading-relaxed">
                  <ReadingMarkdown>{followUpResponse || ""}</ReadingMarkdown>
                </div>
              )}
            </div>
            {followUpStreaming && followUpResponse && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></div>
                <span>typing...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const FEEDBACK_KEY = "lenormand-reading-feedback";
const FEEDBACK_OPTIONS = [
  { value: "useful", label: "Useful" },
  { value: "felt_accurate", label: "Felt accurate" },
  { value: "too_vague", label: "Too vague" },
  { value: "did_not_fit", label: "Did not fit" },
] as const;

function getStoredFeedbackIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return new Set();
    const items = JSON.parse(raw);
    return new Set(items.map((i: { id: string }) => i.id));
  } catch {
    return new Set();
  }
}

function storeFeedback(id: string, rating: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const items = raw ? JSON.parse(raw) : [];
    items.push({ id, rating, createdAt: new Date().toISOString() });
    if (items.length > 100) items.splice(0, items.length - 100);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable
  }
}

function FeedbackButtons({ reading, spreadId, cardCount }: { reading: string; spreadId?: string; cardCount?: number }) {
  const [submitted, setSubmitted] = useState(false);
  const readingId = useRef(Math.random().toString(36).slice(2, 10));

  const alreadySubmitted = getStoredFeedbackIds().has(readingId.current);
  if (alreadySubmitted || submitted) {
    return (
      <div className="mt-6 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Thanks for your feedback
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t border-border/50">
      <p className="text-xs text-muted-foreground text-center mb-3">
        Was this reading helpful?
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {FEEDBACK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              storeFeedback(readingId.current, opt.value);
              trackEvent("reading_feedback", {
                rating: opt.value,
                spreadId: spreadId || "unknown",
                cardCount: cardCount || 0,
                readingLength: reading.length,
              });
              setSubmitted(true);
            }}
            className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
