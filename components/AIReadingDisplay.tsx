"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIThinkingIndicator } from "@/components/ui/loading";
import { RefreshCw, Copy, Check, AlertCircle, MessageCircle, Crown } from "lucide-react";
import { getCards } from "@/lib/data";
import Link from "next/link";
import { useSupporter } from "@/components/SupporterProvider";

const allCards = getCards();
const CARD_NAMES = allCards.map(c => c.name);
const CARD_REGEX = new RegExp(`(${CARD_NAMES.join('|')})`, 'g');

function highlightCardNames(text: string): React.ReactNode {
  const parts = text.split(CARD_REGEX);
  return parts.map((part, i) => 
    CARD_NAMES.includes(part) 
      ? <span key={i} className="text-primary font-medium">{part}</span>
      : part
  );
}

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
}

export function AIReadingDisplay({
  aiReading,
  isLoading,
  isStreaming = false,
  error,
  onRetry,
  onFollowUp,
  followUpLoading = false,
  followUpStreaming = false,
  followUpResponse = null,
}: AIReadingDisplayProps) {
  const { isSupporter } = useSupporter();
  const [copyClicked, setCopyClicked] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async () => {
    if (!aiReading?.reading) return;
    try {
      const plainText = aiReading.reading
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/^\*\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .trim();
      
      await navigator.clipboard.writeText(plainText);
      setCopyClicked(true);
      
      // Clear previous timeout and set new one
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopyClicked(false), 2000);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  const handleFollowUpSubmit = () => {
    if (!followUpQuestion.trim() || !onFollowUp) return;
    onFollowUp(followUpQuestion.trim());
  };

  const handleFollowUpKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    const isSupporterError = error.includes("supporter") || error.includes("Support");
    
    if (isSupporterError) {
      return (
        <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <Crown className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Premium Spread</AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="text-sm text-amber-700 dark:text-amber-400">
              {error}
            </div>
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/support'}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Crown className="mr-2 h-3 w-3" />
              Unlock with Code
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Interpretation Unavailable</AlertTitle>
        <AlertDescription className="space-y-3">
          <div className="text-sm">{error}</div>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!aiReading?.reading && !isStreaming) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>AI Reading Failed</AlertTitle>
        <AlertDescription>
          <p className="text-sm">The AI interpretation could not be generated.</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
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
        <div className="flex items-center justify-end mb-4">
          <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy reading">
            {copyClicked ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="reading-content space-y-4 text-foreground">
          {aiReading?.reading && (
            <div className="leading-relaxed whitespace-pre-wrap">{highlightCardNames(aiReading.reading)}</div>
          )}
        </div>

        {!isLoading && !isStreaming && !isSupporter && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <Link href="/support" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-amber-600 transition-colors">
              <Crown className="h-3 w-3" />
              <span>Unlock premium spreads</span>
            </Link>
          </div>
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
                <div className="leading-relaxed whitespace-pre-wrap">{highlightCardNames(followUpResponse || "")}</div>
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
}
