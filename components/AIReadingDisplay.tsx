"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { AIReadingResponse } from "@/lib/deepseek";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { getSpreadLearningLinks } from "@/lib/spreadLearning";
import { ReadingFeedback } from "./ReadingFeedback";

const ORACLE_MESSAGES = [
  "Analyzing the question...",
  "Reviewing the spread rules...",
  "Interpreting the cards...",
  "Examining card combinations...",
  "Formulating an interpretation...",
  "Synthesizing the results...",
] as const;

const PROGRESS_STEPS = [
  "Analyzing your cards...",
  "Interpreting positions...",
  "Connecting the story...",
  "Finalizing insights...",
] as const;

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
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const spreadLearningLinks = getSpreadLearningLinks(spreadId);

  useEffect(() => {
    if (isLoading) {
      setProgressStep(0);
      const steps = cards?.length || 3;
      const interval = setInterval(() => {
        setProgressStep((prev) => (prev < steps - 1 ? prev + 1 : prev));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isLoading, cards?.length]);

  const [currentMessage, setCurrentMessage] = useState<
    typeof ORACLE_MESSAGES[number]
  >(ORACLE_MESSAGES[0]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setCurrentMessage(
          ORACLE_MESSAGES[Math.floor(Math.random() * ORACLE_MESSAGES.length)],
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const estimatedTime = cards ? Math.ceil(cards.length * 0.8) : 3;

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

  const handleFeedback = async (type: "up" | "down") => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);

    if (newFeedback === null) return;

    setFeedbackLoading(true);
    try {
      const cardData = cards
        ? cards.map((card) => ({
            id: card.id,
            name: card.name,
            position: card.position,
          }))
        : undefined;

      await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isHelpful: type === "up",
          aiInterpretationId: aiReading?.aiInterpretationId,
          spreadId,
          question,
          readingText: aiReading?.reading,
          cards: cardData,
          promptTemperature: 0.4,
        }),
      });
    } catch (err) {
      setFeedback(feedback);
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (isLoading) {
    const progress = Math.min(
      (progressStep / Math.max((cards?.length || 3) - 1, 1)) * 100,
      100,
    );
    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 loading-skeleton pointer-events-none delay-200 duration-500">
        <Card className="overflow-hidden border-border bg-card shadow-elevation-1">
          <CardContent className="space-y-xl p-xl">
            <div className="space-y-md">
              <div className="flex items-center justify-between gap-sm">
                <Badge variant="default" className="loading-skeleton-pulse">
                  <Zap className="mr-1 h-3 w-3" />
                  {
                    PROGRESS_STEPS[
                      Math.min(progressStep, PROGRESS_STEPS.length - 1)
                    ]
                  }
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ~{estimatedTime}s
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute left-0 top-0 h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="grid gap-md sm:grid-cols-2">
              <div className="space-y-sm">
                <div className="relative mx-auto aspect-square max-w-[120px]">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                  <div className="loading-spinner absolute inset-0 h-full w-full rounded-full border-4 border-primary border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="loading-skeleton-pulse h-8 w-8 text-primary" />
                  </div>
                </div>
                <p className="animate-pulse text-center text-sm font-medium text-foreground">
                  {currentMessage}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="space-y-xs text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Cards Being Read:
                  </p>
                  <div className="flex flex-wrap justify-center gap-xs">
                    {cards?.slice(0, 5).map((card, i) => (
                      <Badge
                        key={card.id}
                        variant={i <= progressStep ? "default" : "outline"}
                        className={`transition-all duration-300 ${
                          i <= progressStep
                            ? "bg-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {card.id}
                      </Badge>
                    ))}
                    {(cards?.length || 0) > 5 && (
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground"
                      >
                        +{cards?.length || 0 - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-md text-center">
              <p className="text-xs text-muted-foreground">
                Interpreting {cards?.length || 3} cards using the Lenormand method...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
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

  // Check if content appears incomplete (ends abruptly without proper ending)
  const isContentComplete =
    aiReading.reading.length > 100 &&
    (aiReading.reading.trim().endsWith(".") ||
      aiReading.reading.trim().endsWith("!") ||
      aiReading.reading.trim().endsWith("?") ||
      aiReading.reading.includes("advice") ||
      aiReading.reading.includes("guidance") ||
      aiReading.reading.includes("recommend"));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 space-y-xl delay-200 duration-500">
      <Card className="border-border bg-card shadow-elevation-2">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-lg">
            <div className="flex items-center gap-md">
              <Badge variant="secondary" className="flex items-center gap-1">
                {isStreaming ? (
                  <>
                    <Zap className="h-3 w-3" />
                    Streaming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-xl p-xl">
          <div className="reading-content">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="mb-4 mt-4 text-2xl font-semibold text-foreground"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="mb-3 mt-4 text-xl font-semibold text-foreground"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="mb-2 mt-3 text-lg font-semibold text-foreground"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="mb-3 text-base leading-relaxed text-foreground/90"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="mb-3 list-disc pl-6 text-foreground/90"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="mb-3 list-decimal pl-6 text-foreground/90"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li className="mb-1 text-foreground/90" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="mb-3 border-l-4 border-primary/40 pl-4 italic text-foreground/80"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong
                    className="font-semibold text-foreground"
                    {...props}
                  />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-foreground/80" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-4 border-border" {...props} />
                ),
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

          {spreadLearningLinks && (
            <div className="mt-xl flex items-center justify-between gap-lg border-t border-border pt-xl">
              <div className="flex items-center gap-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback("up")}
                  disabled={feedbackLoading}
                  className={`h-11 w-11 p-0 ${feedback === "up" ? "text-primary" : "text-muted-foreground hover:text-foreground"} ${feedbackLoading ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <ThumbsUp
                    className={`h-4 w-4 ${feedback === "up" ? "fill-current" : ""}`}
                  />
                  <span className="sr-only">Helpful</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFeedback("down")}
                  disabled={feedbackLoading}
                  className={`h-11 w-11 p-0 ${feedback === "down" ? "text-primary" : "text-muted-foreground hover:text-foreground"} ${feedbackLoading ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <ThumbsDown
                    className={`h-4 w-4 ${feedback === "down" ? "fill-current" : ""}`}
                  />
                  <span className="sr-only">Not helpful</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-11 w-11 p-0 text-muted-foreground hover:text-foreground"
                >
                  {copyClicked ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy reading</span>
                </Button>
              </div>

              <a
                href={spreadLearningLinks.methodologyPage}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-primary/80 text-primary-foreground hover:bg-primary"
                >
                  Learn the Method
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <ReadingFeedback
        readingId={cards ? "temp" : undefined}
        aiInterpretationId={aiReading.aiInterpretationId || undefined}
        spreadId={spreadId}
        question={question}
      />
    </div>
  );
}
