"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { ReadingViewer } from "@/components/ReadingViewer";
import { AIReadingDisplay, ClassicAnalysisWithAI } from "@/components/AIReadingDisplay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import { Card as CardType, Reading, ReadingCard } from "@/lib/types";
import { decodeReadingFromUrl, getCardById, getCards } from "@/lib/data";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { buildClassicAnalysis } from "@/lib/classic-analysis";
import { AIThinkingIndicator } from "@/components/ui/loading";

interface PageProps {
  params: {
    encoded: string;
  };
}

// Map layoutType (number of cards) to primary spread ID
/** The spread for a shared layout, or null when the layout is not a supported spread. */
function getSpreadIdFromLayoutType(layoutType: number): string | null {
  switch (layoutType) {
    case 1:
      return "single-card";
    case 3:
      return "sentence-3";
    case 5:
      return "sentence-5";
    case 9:
      return "comprehensive";
    case 36:
      return "grand-tableau";
    default:
      return null;
  }
}

export default function SharedReadingPage({ params }: PageProps) {
  const cardsData = getCards();
  const [reading, setReading] = useState<Reading | null>(null);
  const [allCards, setAllCards] = useState<CardType[]>(cardsData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  // AI-related state
  const [aiReading, setAiReading] = useState<AIReadingResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiErrorDetails, setAiErrorDetails] = useState<{
    type?: string;
    helpUrl?: string;
    action?: string;
    waitTime?: number;
    fields?: string[];
  } | null>(null);
  const [aiAttempted, setAiAttempted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const decodedData = await decodeReadingFromUrl(params.encoded);

        if (!decodedData || !decodedData.cards || !decodedData.layoutType) {
          setError("This shared reading link is invalid or has expired.");
          setLoading(false);
          return;
        }

        // Create a complete reading object
        const reading: Reading = {
          id: "shared",
          title: decodedData.title || "Shared Reading",
          question: decodedData.question,
          layoutType: decodedData.layoutType,
          cards: decodedData.cards,
          slug: "shared",
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setReading(reading);
      } catch (error) {
        setError("This shared reading link is invalid or has expired.");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.encoded]);

  // AI analysis function
  const performAIAnalysis = useCallback(
    async (readingCards: ReadingCard[]) => {
      if (!mountedRef.current || !reading) return;

      // Cancel any request still in flight, so a late answer cannot overwrite the current state.
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      setAiLoading(true);
      setAiError(null);
      setAiErrorDetails(null);
      setAiAttempted(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // The client timeout is below the route's 60s maxDuration. On timeout the request is aborted,
      // so a response that arrives later cannot appear after the timeout message.
      timeoutRef.current = setTimeout(() => {
        controller.abort();
        if (mountedRef.current && requestRef.current === controller) {
          setAiLoading(false);
          setAiError("AI analysis timed out. The reading is still available.");
        }
        timeoutRef.current = null;
      }, 59000);

      try {
        const aiRequest = {
          question:
            reading.question || "What guidance do these cards have for me?",
          cards: readingCards.map((card) => ({
            id: card.id,
            name: getCardById(allCards, card.id)?.name || "Unknown",
            position: card.position,
          })),
          spreadId: getSpreadIdFromLayoutType(reading.layoutType) ?? "",
        };

        const response = await fetch("/api/readings/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiRequest),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorMessage = "Server error";
          try {
            const data = await response.json();
            errorMessage = data.error || data.reading || errorMessage;
          } catch {
            // fall through with default
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (mountedRef.current && requestRef.current === controller) {
          if (data?.reading) {
            setAiReading(data);
          } else {
            setAiError("AI service returned no analysis. The reading is still available.");
          }
        }
      } catch (error) {
        // An aborted request was superseded or timed out; its outcome is already handled.
        if (controller.signal.aborted) return;
        if (mountedRef.current && requestRef.current === controller) {
          const errorMessage =
            error instanceof Error ? error.message : "AI analysis failed";
          setAiError(errorMessage);

          if (errorMessage.includes("rate_limit")) {
            setAiErrorDetails({
              type: "rate_limit",
              action: "Wait 2 seconds before retrying",
              waitTime: 2000,
            });
          } else if (errorMessage.includes("API key")) {
            setAiErrorDetails({
              type: "configuration_needed",
              helpUrl: "https://platform.deepseek.com/",
              action: "Configure API key",
            });
          } else if (errorMessage.includes("temporarily unavailable")) {
            setAiErrorDetails({
              type: "service_unavailable",
              action: "Try again later",
            });
          } else {
            setAiErrorDetails({
              type: "service_error",
              action: "The reading is still available",
            });
          }
        }
      } finally {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (mountedRef.current) {
          setAiLoading(false);
        }
      }
    },
    [reading, allCards, mountedRef],
  );

  // Opening a shared link never calls the model. AI runs only when the visitor presses the button.
  const startSharedAI = useCallback(() => {
    if (reading?.cards) performAIAnalysis(reading.cards);
  }, [reading, performAIAnalysis]);

  // The classic analysis for the shared spread: deterministic, no model call.
  const sharedClassicAnalysis = useMemo(() => {
    if (!reading?.cards?.length || typeof reading.layoutType !== "number") return null;
    const spreadId = getSpreadIdFromLayoutType(reading.layoutType);
    if (!spreadId) return null;
    return buildClassicAnalysis(spreadId as never, reading.question ?? "", reading.cards, allCards);
  }, [reading, allCards]);

  // Cleanup on unmount. Re-arm on mount: React strict mode runs this cleanup once during the first
  // mount, which would otherwise leave mountedRef false and silently block the AI request.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (err) {
        // Clipboard is best-effort - silently fail
      }
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md px-4 text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Reading Not Found
          </h1>
          <p className="mb-6 text-muted-foreground">
            {error || "This shared reading link is invalid or has expired."}
          </p>
          <Button onClick={() => (window.location.href = "/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Shared Lenormand Reading
          </h1>
          <p className="text-muted-foreground">{reading.title}</p>
        </div>

        <ReadingViewer
          reading={reading}
          allCards={allCards}
          showShareButton={true}
          onShare={handleShare}
          showReadingHeader={false}
          significatorType="none"
          onSignificatorChange={() => {}}
        />

        {/* Card meanings now accessed via hover on spread cards - removed redundant section */}

        {/* Classic analysis and optional AI: AI starts only on the visitor's explicit press */}
        <div className="mt-6">
          {!aiAttempted && sharedClassicAnalysis && (
            <Card>
              <CardContent className="space-y-6 p-6">
                <ClassicAnalysisWithAI analysis={sharedClassicAnalysis} onStartAI={startSharedAI} />
              </CardContent>
            </Card>
          )}

          {aiLoading && (
            <AIThinkingIndicator
              message="Consulting the cards..."
              subtext="The sibyl is weaving your cards' deeper meanings"
            />
          )}

          {aiReading && (
            <AIReadingDisplay
              aiReading={aiReading}
              isLoading={false}
              isStreaming={aiLoading && !aiReading}
              error={null}
              onRetry={() => performAIAnalysis(reading.cards)}
            />
          )}

          {aiError && !aiLoading && (
            <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-center">
              <div className="font-medium text-foreground">
                We couldn&apos;t generate this interpretation
              </div>
              <div className="text-sm text-muted-foreground">{aiError}</div>
              <Button onClick={() => reading?.cards && performAIAnalysis(reading.cards)}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
