"use client";

import { notFound } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { ReadingViewer } from "@/components/ReadingViewer";
import { AIReadingDisplay } from "@/components/AIReadingDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, User, Share2, Sparkles, XCircle } from "lucide-react";
import { Card as CardType, Reading, ReadingCard } from "@/lib/types";
import { decodeReadingFromUrl, getCardById } from "@/lib/data";
import staticCardsData from "@/public/data/cards.json";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { AIThinkingIndicator } from "@/components/ui/loading";

interface PageProps {
  params: {
    encoded: string;
  };
}

// Map layoutType (number of cards) to primary spread ID
function getSpreadIdFromLayoutType(layoutType: number): string {
  switch (layoutType) {
    case 1:
      return "single-card";
    case 3:
      return "sentence-3";
    case 5:
      return "sentence-5";
    case 7:
      return "week-ahead";
    case 9:
      return "comprehensive";
    case 36:
      return "grand-tableau";
    default:
      return "sentence-3"; // default
  }
}

export default function SharedReadingPage({ params }: PageProps) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [allCards, setAllCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const cardsData = staticCardsData as CardType[];
        const decodedData = await decodeReadingFromUrl(params.encoded);

        if (!decodedData || !decodedData.cards || !decodedData.layoutType) {
          notFound();
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

        setAllCards(cardsData);
        setReading(reading);
      } catch (error) {
        notFound();
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

      setAiLoading(true);
      setAiError(null);
      setAiErrorDetails(null);
      setAiAttempted(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setAiLoading(false);
          setAiError("AI analysis timed out. The reading is still available.");
        }
        timeoutRef.current = null;
      }, 35000);

      try {
        const aiRequest = {
          question:
            reading.question || "What guidance do these cards have for me?",
          cards: readingCards.map((card) => ({
            id: card.id,
            name: getCardById(allCards, card.id)?.name || "Unknown",
            position: card.position,
          })),
        };

        const response = await fetch("/api/readings/interpret", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(aiRequest),
        });

         if (!response.ok) {
           const errorText = await response.text();
           let errorData;
           try {
             errorData = JSON.parse(errorText);
           } catch {
             errorData = { error: errorText || "Server error" };
           }
           throw new Error(errorData.error || "Server error");
         }

         // Handle streaming response
         const reader = response.body?.getReader();
         const decoder = new TextDecoder();
         let fullReading = "";

         if (reader) {
           while (true) {
             const { done, value } = await reader.read();
             if (done) break;

             const chunk = decoder.decode(value, { stream: true });
             const lines = chunk.split("\n");

             for (const line of lines) {
               if (line.startsWith("data: ")) {
                 const data = line.slice(6);
                 if (data === "[DONE]") continue;

                 try {
                   const parsed = JSON.parse(data);
                   const delta = parsed.choices?.[0]?.delta?.content;
                   if (delta) {
                     fullReading += delta;
                     if (mountedRef.current) {
                       setAiReading({ reading: fullReading });
                     }
                   }
                 } catch {
                   // Ignore parse errors for incomplete chunks
                 }
               }
             }
           }
         }

         if (!fullReading && mountedRef.current) {
           setAiError(
             "AI service returned no analysis. The reading is still available.",
           );
         }
      } catch (error) {
        if (mountedRef.current) {
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

  // Trigger AI analysis when reading is loaded
  useEffect(() => {
    if (reading && allCards.length > 0 && !aiAttempted && reading.cards) {
      performAIAnalysis(reading.cards);
    }
  }, [reading, allCards.length, aiAttempted, performAIAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
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
      <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reading) {
    notFound();
    return null;
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
        />

        {/* Card meanings now accessed via hover on spread cards - removed redundant section */}

        {/* AI Analysis Section */}
        <div className="mt-6">
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
              error={null}
              onRetry={() => performAIAnalysis(reading.cards)}
            />
          )}

          {aiError && !aiLoading && (
            <div className="bg-destructive/5 border-destructive/20 space-y-4 rounded-lg border p-6 text-center">
              <div className="text-destructive font-medium">
                AI Analysis Unavailable
              </div>
              <div className="text-sm text-muted-foreground">{aiError}</div>
              <Button
                onClick={() => performAIAnalysis(reading.cards)}
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
