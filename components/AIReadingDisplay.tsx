"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
});
import { AIReadingResponse } from "@/lib/ai-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AIThinkingIndicator } from "@/components/ui/loading";
import { RefreshCw, Copy, Check, AlertCircle } from "lucide-react";

interface AIReadingDisplayProps {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AIReadingDisplay({
  aiReading,
  isLoading,
  error,
  onRetry,
}: AIReadingDisplayProps) {
  const [copyClicked, setCopyClicked] = useState(false);

  const handleCopy = async () => {
    if (!aiReading?.reading) return;
    try {
      await navigator.clipboard.writeText(aiReading.reading);
      setCopyClicked(true);
      setTimeout(() => setCopyClicked(false), 2000);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  if (isLoading) {
    return (
      <AIThinkingIndicator
        message="Consulting the cards..."
        subtext="Reading the cards for clear, practical guidance"
      />
    );
  }

  if (error) {
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

  if (!aiReading?.reading) {
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-end">
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            {copyClicked ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="reading-content space-y-4">
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => <h1 className="text-2xl font-semibold" {...props} />,
              h2: ({ ...props }) => <h2 className="text-xl font-semibold" {...props} />,
              h3: ({ ...props }) => <h3 className="text-lg font-semibold" {...props} />,
              p: ({ ...props }) => <p className="leading-relaxed" {...props} />,
              strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
            }}
          >
            {aiReading.reading}
          </ReactMarkdown>
        </div>

        <div className="mt-6 flex items-center justify-center border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>Reading complete</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
