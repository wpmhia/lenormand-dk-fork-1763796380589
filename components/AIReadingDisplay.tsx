"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIThinkingIndicator } from "@/components/ui/loading";
import { RefreshCw, Copy, Check, AlertCircle, MessageCircle } from "lucide-react";

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

  const handleCopy = async () => {
    if (!aiReading?.reading) return;
    try {
      const plainText = aiReading.reading
        .replace(/^#{1,6}\s+/gm, '') // Remove # headings
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.+?)\*/g, '$1') // Remove italic
        .replace(/_(.+?)_/g, '$1') // Remove underline
        .replace(/`(.+?)`/g, '$1') // Remove code
        .replace(/^\*\s+/gm, '') // Remove bullet points
        .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
        .trim();
      
      await navigator.clipboard.writeText(plainText);
      setCopyClicked(true);
      setTimeout(() => setCopyClicked(false), 2000);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  const handleFollowUpSubmit = () => {
    if (!followUpQuestion.trim() || !onFollowUp) return;
    onFollowUp(followUpQuestion.trim());
  };

  const handleFollowUpKeyDown = (e: React.KeyboardEvent) => {
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

  // Show streaming indicator while waiting for first chunk
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
        <div className="mb-4 flex items-center justify-end">
          <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy reading to clipboard">
            {copyClicked ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="reading-content space-y-4">
          {aiReading?.reading ? (
            <ReactMarkdown
              components={{
                h1: ({ children, ...props }) => <h1 className="text-2xl font-semibold" {...props}>{children}</h1>,
                h2: ({ children, ...props }) => <h2 className="text-xl font-semibold" {...props}>{children}</h2>,
                h3: ({ children, ...props }) => <h3 className="text-lg font-semibold" {...props}>{children}</h3>,
                p: ({ children, ...props }) => <p className="leading-relaxed" {...props}>{children}</p>,
                strong: ({ children, ...props }) => <strong className="font-semibold" {...props}>{children}</strong>,
              }}
            >
              {aiReading?.reading}
            </ReactMarkdown>
          ) : null}
        </div>

        {/* Follow-up Question Section */}
        {!isStreaming && !followUpResponse && (
          <div className="mt-6 border-t pt-6">
            {!showFollowUpInput ? (
              <button
                onClick={() => setShowFollowUpInput(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                Ask a follow-up question
              </button>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  Ask a follow-up question
                </label>
                <textarea
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  onKeyDown={handleFollowUpKeyDown}
                  placeholder="What else should I know about...?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={2}
                  disabled={followUpLoading || followUpStreaming}
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
                    {followUpLoading ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-current"></div>
                        Thinking...
                      </>
                    ) : (
                      "Ask"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Follow-up Response */}
        {followUpResponse && (
          <div className="mt-6 border-t pt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircle className="h-4 w-4 text-primary" />
              Follow-up Answer
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground">
              {followUpStreaming && !followUpResponse ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-primary"></div>
                  <span>Consulting the cards...</span>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  }}
                >
                  {followUpResponse}
                </ReactMarkdown>
              )}
            </div>
            {followUpStreaming && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                <span>Streaming...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
