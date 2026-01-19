"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AIReadingResponse } from "@/lib/ai-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  RefreshCw,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

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
        // Fallback silently - clipboard is best-effort
      }
    }
  };

  if (isLoading && !streamedContent) {
    return (
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating your reading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && streamedContent) {
    return (
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            <span>Generating...</span>
          </div>
          <div className="reading-content space-y-4 opacity-80">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-2xl font-semibold text-foreground"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-xl font-semibold text-foreground"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-lg font-semibold text-foreground"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="text-base leading-relaxed text-foreground/90"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc pl-6 text-foreground/90"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="list-decimal pl-6 text-foreground/90"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-foreground/90" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-primary/40 pl-4 italic text-foreground/80"
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
              {copyClicked ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="reading-content space-y-4">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-2xl font-semibold text-foreground"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-xl font-semibold text-foreground"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-lg font-semibold text-foreground"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="text-base leading-relaxed text-foreground/90"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc pl-6 text-foreground/90"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="list-decimal pl-6 text-foreground/90"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-foreground/90" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-primary/40 pl-4 italic text-foreground/80"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
