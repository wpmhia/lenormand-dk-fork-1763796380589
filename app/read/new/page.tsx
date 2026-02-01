"use client";

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";
import { getCards } from "@/lib/data";
import { AUTHENTIC_SPREADS, COMPREHENSIVE_SPREADS, Spread } from "@/lib/spreads";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";

import {
  ReadingSetup,
  PhysicalCardInput,
  VirtualDeckDraw,
  StartOverDialog,
} from "@/components/reading";
import { ReadingViewer } from "@/components/ReadingViewer";

import { ErrorBoundary } from "@/components/ErrorBoundary";

const AIReadingDisplay = lazy(() =>
  import("@/components/AIReadingDisplay").then((m) => ({
    default: m.AIReadingDisplay,
  }))
);

function LoadingFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-40 rounded-xl bg-muted/50" />
      <div className="h-20 rounded-xl bg-muted/50" />
      <div className="h-12 rounded-lg bg-muted/50" />
    </div>
  );
}

type Step = "setup" | "drawing" | "results";
type Method = "virtual" | "physical" | null;

function NewReadingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data state
  const [allCards, setAllCards] = useState<CardType[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [error, setError] = useState("");

  // Flow state
  const [step, setStep] = useState<Step>("setup");
  const [method, setMethod] = useState<Method>(null);
  const [question, setQuestion] = useState("");
  const [selectedSpread, setSelectedSpread] = useState<Spread>(AUTHENTIC_SPREADS[1]);

  // Card state
  const [drawnCards, setDrawnCards] = useState<ReadingCard[]>([]);
  const [drawnCardTypes, setDrawnCardTypes] = useState<CardType[]>([]);



  // Dialog state
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [lastResetParam, setLastResetParam] = useState<string | null>(null);

  // AI Analysis
  const {
    aiReading,
    isLoading: aiLoading,
    error: aiError,
    streamedContent,
    isPartial,
    aiMethod,
    startAnalysis,
    retryAnalysis,
    resetAnalysis,
  } = useAIAnalysis(question, drawnCards, allCards, selectedSpread.id, step === "results");

  // Reset function - defined before effects that use it
  const performReset = useCallback(
    (keepUrlParams = false) => {
      setStep("setup");
      setMethod(null);
      setDrawnCards([]);
      setDrawnCardTypes([]);
      setQuestion("");
      setSelectedSpread(AUTHENTIC_SPREADS[1]);
      setError("");

      resetAnalysis();

      if (!keepUrlParams) {
        const newUrl = new URL(window.location.href);
        newUrl.search = "";
        router.replace(newUrl.toString(), { scroll: false });
      }
    },
    [router, resetAnalysis]
  );

  // Load cards on mount
  useEffect(() => {
    async function loadData() {
      try {
        const cards = await getCards();
        if (cards.length > 0) {
          setAllCards(cards);
        } else {
          setError("Failed to load cards. Please try refreshing the page.");
        }
      } catch (err) {
        console.error("Error loading cards:", err);
        setError("An error occurred while loading the deck.");
      } finally {
        setLoadingCards(false);
      }
    }
    loadData();
  }, []);

  // Handle reset parameter
  useEffect(() => {
    const resetParam = searchParams.get("reset");
    if (resetParam && resetParam !== lastResetParam) {
      setLastResetParam(resetParam);
      performReset(false);
    }
  }, [searchParams, lastResetParam, performReset]);

  // Handle spread parameter from URL
  useEffect(() => {
    const spreadParam = searchParams.get("spread");
    if (spreadParam) {
      const spread = COMPREHENSIVE_SPREADS.find((s) => s.id === spreadParam);
      if (spread) setSelectedSpread(spread);
    }
  }, [searchParams]);

  // Auto-start AI analysis when entering results
  useEffect(() => {
    if (step === "results" && drawnCards.length > 0) {
      startAnalysis();
    }
  }, [step, drawnCards, startAnalysis]);

  // Handle setup continue
  const handleSetupContinue = useCallback(() => {
    if (method) {
      setStep("drawing");
    }
  }, [method]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (step === "drawing") {
      setStep("setup");
      setMethod(null);
    } else if (step === "results") {
      setStep("drawing");
      setDrawnCards([]);
      setDrawnCardTypes([]);
      resetAnalysis();
    }
  }, [step, resetAnalysis]);

  // Handle virtual deck draw - simplified, no complex animations
  const handleVirtualDraw = useCallback(
    (cards: CardType[]) => {
      const readingCards = cards.map((card, index) => ({
        id: card.id,
        position: index,
      }));
      setDrawnCardTypes(cards);
      setDrawnCards(readingCards);
      setStep("results");
    },
    []
  );

  // Handle physical card submit
  const handlePhysicalSubmit = useCallback(
    (cards: ReadingCard[]) => {
      const cardTypes = cards
        .map((rc) => allCards.find((c) => c.id === rc.id))
        .filter(Boolean) as CardType[];

      setDrawnCardTypes(cardTypes);
      setDrawnCards(cards);
      setStep("results");
    },
    [allCards]
  );

  // Handle start over
  const handleStartOver = useCallback(() => {
    performReset(true);
    setShowStartOverConfirm(false);
  }, [performReset]);

  // Get step label for progress
  const getStepLabel = (stepName: Step): string => {
    switch (stepName) {
      case "setup":
        return "Setup";
      case "drawing":
        return method === "physical" ? "Enter Cards" : "Draw";
      case "results":
        return "Reading & AI Insights";
      default:
        return "";
    }
  };

  return (
    <TooltipProvider>
      <div className="bg-ambience min-h-screen text-foreground">
        <div className="container relative z-10 mx-auto max-w-4xl px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="relative mb-4 text-4xl font-bold text-foreground">
              New Lenormand Reading
              <div className="absolute -bottom-2 left-1/2 h-0.5 w-32 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
            </h1>
            <p className="text-lg italic text-muted-foreground">
              Let the ancient cards reveal what your heart already knows
            </p>

            {/* Progress Indicator */}
            <div
              className="mt-8 flex items-center justify-center space-x-6"
              role="progressbar"
              aria-label="Reading progress"
            >
              {(["setup", "drawing", "results"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`flex items-center ${
                      step === s ? "text-primary" : "text-muted-foreground"
                    }`}
                    aria-current={step === s ? "step" : undefined}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        step === s
                          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "border-muted-foreground bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="ml-3 text-sm font-medium hidden sm:inline">
                      {getStepLabel(s)}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={`ml-6 h-0.5 w-12 rounded-full ${
                        ["drawing", "results"].includes(step) && i === 0
                          ? "bg-primary"
                          : step === "results" && i === 1
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Back Button */}
            {step !== "setup" && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to {step === "drawing" ? "Setup" : "Card Entry"}
                </Button>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-destructive/30 bg-destructive/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                  <AlertDescription className="mt-0.5 text-destructive-foreground">
                    {error}
                  </AlertDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError("")}
                  className="h-auto p-1 text-destructive hover:bg-destructive/10 hover:text-destructive/80"
                >
                  ✕
                </Button>
              </div>
            </Alert>
          )}

          {/* Step 1: Setup */}
          {step === "setup" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ReadingSetup
                question={question}
                onQuestionChange={setQuestion}
                spread={selectedSpread}
                onSpreadChange={setSelectedSpread}
                method={method}
                onMethodChange={setMethod}
                onContinue={handleSetupContinue}
              />
            </div>
          )}

          {/* Step 2: Drawing */}
          {step === "drawing" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {method === "virtual" ? (
                <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                  <div className="mb-6 text-center">
                    <h2 className="relative mb-2 text-2xl font-semibold text-foreground">
                      Draw Virtual Cards
                      <div className="absolute -bottom-1 left-1/2 h-0.5 w-20 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
                    </h2>
                    <p className="text-muted-foreground">
                      Drawing {selectedSpread.cards} cards from the sacred deck
                    </p>
                  </div>
                  {loadingCards ? (
                    <div className="flex justify-center p-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <VirtualDeckDraw
                      cards={allCards}
                      drawCount={selectedSpread.cards}
                      onDraw={handleVirtualDraw}

                    />
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                  <div className="mb-6 text-center">
                    <h2 className="relative mb-2 text-2xl font-semibold text-foreground">
                      Enter Your Cards
                      <div className="absolute -bottom-1 left-1/2 h-0.5 w-20 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
                    </h2>
                    <p className="text-muted-foreground">
                      Enter {selectedSpread.cards} cards from your physical deck
                    </p>
                  </div>
                  <PhysicalCardInput
                    allCards={allCards}
                    targetCount={selectedSpread.cards}
                    onSubmit={handlePhysicalSubmit}
                  />
                </div>
              )}
            </div>
          )}



          {/* Step 3: Results */}
          {step === "results" && drawnCards.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {allCards.length > 0 ? (
                <ReadingViewer
                  reading={{
                    id: "temp",
                    title: "Your Reading",
                    question,
                    layoutType: selectedSpread.cards,
                    cards: drawnCards,
                    slug: "temp",
                    isPublic: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }}
                  allCards={allCards}
                  spreadId={selectedSpread.id}

                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Loading cards...
                </div>
              )}

              {/* AI Analysis */}
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <AIReadingDisplay
                    aiReading={aiReading}
                    isLoading={aiLoading}
                    error={aiError}
                    onRetry={retryAnalysis}
                    spreadId={selectedSpread.id}
                    cards={drawnCards.map((card) => ({
                      id: card.id,
                      name: allCards.find((c) => c.id === card.id)?.name || "Unknown",
                      position: card.position,
                    }))}
                    allCards={allCards}
                    question={question}
                    isStreaming={aiLoading}
                    streamedContent={streamedContent}
                  />
                </Suspense>
              </ErrorBoundary>

              {/* Start New Reading */}
              <div className="flex justify-center pt-8">
                <Button
                  onClick={() => setShowStartOverConfirm(true)}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Start New Reading
                </Button>
              </div>
            </div>
          )}

          {/* Start Over Dialog */}
          <StartOverDialog
            open={showStartOverConfirm}
            onOpenChange={setShowStartOverConfirm}
            onConfirm={handleStartOver}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function NewReadingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading your reading...</p>
          </div>
        </div>
      }
    >
      <NewReadingPageContent />
    </Suspense>
  );
}
