"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIThinkingIndicator } from "@/components/ui/loading";
import { RefreshCw, Copy, Check, AlertCircle } from "lucide-react";

interface AIReadingDisplayProps {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  isStreaming?: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AIReadingDisplay({
  aiReading,
  isLoading,
  isStreaming = false,
  error,
  onRetry,
}: AIReadingDisplayProps) {
  const [copyClicked, setCopyClicked] = useState(false);

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
          <Button variant="ghost" size="icon" onClick={handleCopy}>
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

        <div className="mt-6 flex items-center justify-center border-t pt-4">
          {isStreaming ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-pulse rounded-full bg-primary"></div>
              <span>Streaming reading...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              <span>Reading complete</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
