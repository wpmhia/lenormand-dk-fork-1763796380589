"use client";

import { useState, useRef } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIThinkingIndicator } from "@/components/ui/loading";
import { RefreshCw, Copy, Check, AlertCircle, MessageCircle } from "lucide-react";
import { getCards } from "@/lib/data";

const allCards = getCards();
const CARD_NAMES = allCards.map(c => c.name);

function parseReadingText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;
  
  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      result.push(<h1 key={key++} className="text-2xl font-bold mt-4 mb-2">{parseLineContent(line.slice(2))}</h1>);
    } else if (line.startsWith('## ')) {
      result.push(<h2 key={key++} className="text-xl font-bold mt-4 mb-2">{parseLineContent(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      result.push(<h3 key={key++} className="text-lg font-bold mt-3 mb-1">{parseLineContent(line.slice(4))}</h3>);
    } else if (line.trim()) {
      result.push(<p key={key++} className="mb-2">{parseLineContent(line)}</p>);
    }
  });
  
  return result;
}

function parseLineContent(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  
  // Pattern: **bold**, *italic*, card names
  const pattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g;
  
  let match;
  while ((match = pattern.exec(remaining)) !== null) {
    // Add text before the match
    if (match.index > 0) {
      parts.push(remaining.slice(0, match.index));
    }
    
    if (match[1]) {
      // **bold**
      parts.push(<strong key={key++} className="font-bold">{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={key++} className="italic">{match[4]}</em>);
    } else if (match[5]) {
      // `code`
      parts.push(<code key={key++} className="bg-muted px-1 py-0.5 rounded text-sm">{match[6]}</code>);
    } else if (match[7]) {
      // Potential card name
      const word = match[7];
      const isCardName = CARD_NAMES.some(name => name.toLowerCase() === word.toLowerCase());
      if (isCardName) {
        parts.push(<span key={key++} className="text-primary font-medium">{word}</span>);
      } else {
        parts.push(word);
      }
    }
    
    remaining = remaining.slice(match.index + match[0].length);
    pattern.lastIndex = 0;
  }
  
  // Add remaining text
  if (remaining) {
    parts.push(remaining);
  }
  
  return parts;
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
            <div className="leading-relaxed whitespace-pre-wrap">
              {parseReadingText(aiReading.reading)}
            </div>
          )}
        </div>

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
                <div className="leading-relaxed whitespace-pre-wrap">
                  {parseReadingText(followUpResponse || "")}
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
}
