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
  // First, extract all **bold** sections
  const segments: { type: 'text' | 'bold' | 'italic' | 'code' | 'card'; content: string }[] = [];
  
  // Process bold first: **text**
  let remaining = text;
  let lastIndex = 0;
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      // Add text before this match
      const beforeText = remaining.slice(lastIndex, match.index);
      if (beforeText) {
        parseRemainingText(beforeText, segments);
      }
    }
    segments.push({ type: 'bold', content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < remaining.length) {
    parseRemainingText(remaining.slice(lastIndex), segments);
  }
  
  // Convert segments to React nodes
  return segments.map((seg, key) => {
    switch (seg.type) {
      case 'bold':
        return <strong key={key} className="font-bold">{seg.content}</strong>;
      case 'italic':
        return <em key={key} className="italic">{seg.content}</em>;
      case 'code':
        return <code key={key} className="bg-muted px-1 py-0.5 rounded text-sm">{seg.content}</code>;
      case 'card':
        return <span key={key} className="text-primary font-medium">{seg.content}</span>;
      default:
        return <span key={key}>{seg.content}</span>;
    }
  });
}

function parseRemainingText(text: string, segments: { type: 'text' | 'bold' | 'italic' | 'code' | 'card'; content: string }[]) {
  // Now process remaining text for italic, code, and card names
  const pattern = /\*([^*]+)\*|`([^`]+)`|([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g;
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    
    if (match[1]) {
      segments.push({ type: 'italic', content: match[1] });
    } else if (match[2]) {
      segments.push({ type: 'code', content: match[2] });
    } else if (match[3]) {
      const word = match[3];
      const isCardName = CARD_NAMES.some(name => name.toLowerCase() === word.toLowerCase());
      if (isCardName) {
        segments.push({ type: 'card', content: word });
      } else {
        segments.push({ type: 'text', content: word });
      }
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
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
