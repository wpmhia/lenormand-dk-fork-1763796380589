"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { AIReadingResponse } from "@/lib/deepseek";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Zap,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

const PROGRESS_MESSAGES = [
  { title: "Analyzing your spread", description: "Reviewing card positions and relationships" },
  { title: "Interpreting the cards", description: "Applying Lenormand symbolism" },
  { title: "Connecting the meanings", description: "Synthesizing the reading" },
  { title: "Finalizing your interpretation", description: "Almost ready" },
] as const;

function ProgressIndicator({ cards }: { cards?: Array<{ id: number; name: string; position: number }> }) {
  const [progressIndex, setProgressIndex] = useState(0);
  const [showCards, setShowCards] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowCards(true), 500);
    const timer2 = setInterval(() => {
      setProgressIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 2000);
    return () => {
      clearTimeout(timer1);
      clearInterval(timer2);
    };
  }, []);

  return (
    <div className="space-y-3 w-full max-w-md">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="h-4 w-4" />
        <span>{PROGRESS_MESSAGES[progressIndex].title}</span>
      </div>
      {showCards && cards && cards.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {cards.slice(0, 5).map((card, i) => (
            <Badge key={card.id} variant="outline" className="text-xs">
              {card.name}
            </Badge>
          ))}
          {cards.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{cards.length - 5} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

interface AIReadingDisplayProps {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  error: string | null;
  errorDetails?: {
    type?: string;
    helpUrl?: string;
    action?: string;
    waitTime?: number;
    fields?: string[];
  } | null;
  onRetry: () => void;
  retryCount?: number;
  cards?: Array<{
    id: number;
    name: string;
    position: number;
  }>;
  allCards?: any[];
  spreadId?: string;
  question?: string;
  isStreaming?: boolean;
  streamedContent?: string;
}

export function AIReadingDisplay({
  aiReading,
  isLoading,
  error,
  errorDetails,
  onRetry,
  retryCount = 0,
  cards,
  allCards,
  spreadId,
  question,
  isStreaming = false,
  streamedContent,
}: AIReadingDisplayProps) {
  const [copyClicked, setCopyClicked] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgressStep(0);
      const interval = setInterval(() => {
        setProgressStep((prev) => (prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const progress = ((progressStep + 1) / PROGRESS_MESSAGES.length) * 100;

  const handleCopy = async () => {
    if (!aiReading?.reading) return;

    const attribution =
      "\n\n---\nGet your free reading with Lenormand Intelligence (Lenormand.dk).";
    const fullContent = aiReading.reading + attribution;

    try {
      const htmlContent = aiReading.reading
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
        .replace(/\*(.*)\*/gim, "<em>$1</em>")
        .replace(/\n- (.*$)/gim, "<li>$1</li>")
        .replace(/\n(\d+)\. (.*$)/gim, "<li>$2</li>")
        .replace(/\n\n/gim, "<br><br>")
        .replace(/\n/gim, "<br>");

      const blobHtml = new Blob(
        [
          `<div style="font-family: system-ui, sans-serif; line-height: 1.6;">${htmlContent}</div>${attribution.replace("\n\n---", "<hr>")}`,
        ],
        { type: "text/html" },
      );
      const blobText = new Blob([fullContent], { type: "text/plain" });

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText,
        }),
      ]);
      setCopyClicked(true);
      setTimeout(() => setCopyClicked(false), 2000);
    } catch (err) {
      try {
        await navigator.clipboard.writeText(fullContent);
        setCopyClicked(true);
        setTimeout(() => setCopyClicked(false), 2000);
      } catch (fallbackErr) {
      }
    }
  };

  if (isLoading && !streamedContent) {
    return (
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium text-foreground">
                Generating your reading...
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Interpreting {cards?.length || 3} cards
            </p>
            <ProgressIndicator cards={cards} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && streamedContent) {
    return (
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </div>
          <div className="reading-content space-y-4 opacity-80">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-semibold text-foreground" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-semibold text-foreground" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-semibold text-foreground" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-base leading-relaxed text-foreground/90" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 text-foreground/90" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-6 text-foreground/90" {...props} />
                ),
                li: ({ node, ...props }) => <li className="text-foreground/90" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-primary/40 pl-4 italic text-foreground/80"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-foreground" {...props} />
                ),
                em: ({ node, ...props }) => <em className="italic text-foreground/80" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-4 border-border" {...props} />,
                a: ({ node, ...props }: any) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  />
                ),
              }}
            >
              {streamedContent}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="border-destructive/20 bg-destructive/5"
      >
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Interpretation Unavailable</AlertTitle>
          <Badge variant="destructive" className="ml-auto">
            Error
          </Badge>
        </div>
        <AlertDescription className="space-y-3">
          <p>{error}</p>
          {errorDetails && (
            <div className="text-sm opacity-90">
              {errorDetails.action && (
                <p className="font-medium">{errorDetails.action}</p>
              )}
              {errorDetails.helpUrl && (
                <a
                  href={errorDetails.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-destructive-foreground mt-1 inline-flex items-center gap-1 underline"
                >
                  View Help <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-destructive/30 hover:bg-destructive/10 text-destructive-foreground mt-2"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!aiReading?.reading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                {copyClicked ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

          <div className="reading-content space-y-4">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-semibold text-foreground" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-semibold text-foreground" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-semibold text-foreground" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-base leading-relaxed text-foreground/90" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 text-foreground/90" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-6 text-foreground/90" {...props} />
                ),
                li: ({ node, ...props }) => <li className="text-foreground/90" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-primary/40 pl-4 italic text-foreground/80"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-foreground" {...props} />
                ),
                em: ({ node, ...props }) => <em className="italic text-foreground/80" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-4 border-border" {...props} />,
                a: ({ node, ...props }: any) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  />
                ),
              }}
            >
              {streamedContent || aiReading.reading}
            </ReactMarkdown>
            {isStreaming && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span>Continue receiving...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
