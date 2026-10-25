"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Deck } from "@/components/Deck";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Spade, ArrowLeft } from "lucide-react";
import { getCards } from "@/lib/data";
import { buildClassicAnalysis } from "@/lib/classic-analysis";
import { significatorToPreference } from "@/lib/significator";
import {
  TRADITIONAL_SPREADS,
  COMPREHENSIVE_SPREADS,
  Spread,
  SignificatorType,
} from "@/lib/spreads";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { useAutoSaveReading } from "@/hooks/useAutoSaveReading";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useToast } from "@/hooks/use-toast";

import {
  ReadingSetup,
} from "@/components/reading";

const PhysicalCardInput = dynamic(() =>
  import("@/components/reading").then((mod) => ({ default: mod.PhysicalCardInput })),
  { ssr: false }
);
const ReadingViewer = dynamic(() =>
  import("@/components/ReadingViewer").then((mod) => ({ default: mod.ReadingViewer })),
  { ssr: false }
);
const AIReadingDisplay = dynamic(() =>
  import("@/components/AIReadingDisplay").then((mod) => ({ default: mod.AIReadingDisplay })),
  { ssr: false }
);

import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  const [selectedSpread, setSelectedSpread] = useState<Spread>(
    TRADITIONAL_SPREADS.find((spread) => spread.id === "sentence-5") ?? TRADITIONAL_SPREADS[1],
  );

  // Card state
  const [drawnCards, setDrawnCards] = useState<ReadingCard[]>([]);
  const [drawnCardTypes, setDrawnCardTypes] = useState<CardType[]>([]);

  // Dialog state
  const [lastResetParam, setLastResetParam] = useState<string | null>(null);
  const [readingSaved, setReadingSaved] = useState(false);
  const [significatorType, setSignificatorType] = useState<SignificatorType>("none");
  // The user decides on AI after the classic analysis. No model call happens until they press it.
  const [aiRequested, setAiRequested] = useState(false);

  // AI Analysis
  const {
    aiReading,
    isLoading: aiLoading,
    error: aiError,
    startAnalysis,
    resetAnalysis,
    followUpResponse,
    followUpLoading,
    followUpStreaming,
    followUpHistory,
    submitFollowUp,
  } = useAIAnalysis(
    question,
    drawnCards,
    allCards,
    selectedSpread.id,
    step === "results",
    significatorType,
  );
  const aiStreaming = aiLoading && !aiReading;

  // Classic analysis: deterministic, computed from the drawn cards and the existing catalogue.
  const classicAnalysis = useMemo(() => {
    if (step !== "results" || drawnCards.length === 0) return null;
    return buildClassicAnalysis(selectedSpread.id as never, question, drawnCards, allCards);
  }, [step, drawnCards, selectedSpread.id, question, allCards]);

  // A random id for the completed spread. It is created the first time these drawn cards are
  // shown and is reused on every later display of the same spread, so repeat visits never count
  // again. A new draw creates a new array, and therefore a new id: two identical spreads each
  // count. The id never encodes the question, cards or spread contents.
  const completionIdRef = useRef<{ cards: unknown; id: string } | null>(null);
  const completionId = useMemo(() => {
    if (step !== "results" || drawnCards.length === 0) return completionIdRef.current?.id ?? null;
    const existing = completionIdRef.current;
    if (existing && existing.cards === drawnCards) return existing.id;
    const random =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    completionIdRef.current = { cards: drawnCards, id: random };
    return random;
    // The intent is identity-tracking of the drawn cards array; extra deps would mint new ids on
    // unrelated input changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, drawnCards]);

  const startAI = useCallback(() => {
    setAiRequested(true);
    startAnalysis();
  }, [startAnalysis]);

  // Reading history
  const { saveReading } = useReadingHistory();
  const { toast } = useToast();
  const { showInstallPrompt } = useInstallPrompt();

  useAutoSaveReading(aiReading, aiLoading, step, drawnCardTypes, readingSaved, question, selectedSpread.label, setReadingSaved);

  // Ask about installing only after a completed reading, once per session, never during
  // the first seconds of page load or before cards exist.
  const installPromptShownRef = useRef(false);
  useEffect(() => {
    if (step === "results" && drawnCardTypes.length > 0 && !installPromptShownRef.current) {
      installPromptShownRef.current = true;
      showInstallPrompt();
    }
  }, [step, drawnCardTypes, showInstallPrompt]);

  // Reset function - defined before effects that use it
  const performReset = useCallback(
    (keepUrlParams = false) => {
      setStep("setup");
      setMethod(null);
      setDrawnCards([]);
      setDrawnCardTypes([]);
      setQuestion("");
      setSelectedSpread(TRADITIONAL_SPREADS[1]);
      setError("");
      setReadingSaved(false);
      setSignificatorType("none");
      setAiRequested(false);

      resetAnalysis();

      if (!keepUrlParams) {
        const newUrl = new URL(window.location.href);
        newUrl.search = "";
        router.replace(newUrl.toString(), { scroll: false });
      }
    },
    [router, resetAnalysis],
  );

  const cards = useMemo(() => getCards(), []);

  // Load cards in useEffect to avoid setState during render
  useEffect(() => {
    if (cards.length > 0) {
      setAllCards(cards);
    } else {
      setError("Failed to load cards. Please try refreshing the page.");
    }
    setLoadingCards(false);
  }, [cards]);

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

  // Stable reading object to preserve ReadingViewer memo
  const readingObj = useMemo(() => ({
    id: "temp",
    title: "Your Reading",
    question,
    layoutType: selectedSpread.cards,
    cards: drawnCards,
    slug: "temp",
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }), [question, selectedSpread.cards, drawnCards]);

  // AI is never started by reaching the results. It runs only after the user presses the AI
  // button, so the classic analysis is shown first and no model call happens unasked.

  // Handle back navigation. Going back to card entry keeps the drawn cards so a manual
  // Grand Tableau or a virtual draw is not thrown away; only an explicit new reading or
  // redraw clears them.
  const handleBack = useCallback(() => {
    if (step === "drawing") {
      setStep("setup");
      setMethod(null);
    } else if (step === "results") {
      setStep("drawing");
      resetAnalysis();
      setAiRequested(false);
    }
  }, [step, resetAnalysis]);

  // Handle virtual deck draw - simplified, no complex animations
  const handleVirtualDraw = useCallback((cards: CardType[]) => {
    const readingCards = cards.map((card, index) => ({
      id: card.id,
      position: index,
    }));
    setDrawnCardTypes(cards);
    setDrawnCards(readingCards);
    setStep("results");
  }, []);

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
    [allCards],
  );

  const handleMethodChange = useCallback((selectedMethod: "virtual" | "physical") => {
    if (!question.trim()) {
      setError("Please enter a question to guide your reading.");
      return;
    }
    setMethod(selectedMethod);
    setStep("drawing");
  }, [question]);

  // Get step label for progress
  const getStepLabel = (stepName: Step): string => {
    switch (stepName) {
      case "setup":
        return "Setup";
      case "drawing":
        return method === "physical" ? "Enter Cards" : "Draw";
      case "results":
        return "Your Reading";
      default:
        return "";
    }
  };

  return (
      <div className="bg-ambience min-h-screen text-foreground">
        <div className="container-narrow relative z-10 pb-8 pt-4 md:pb-12 md:pt-8">
          {/* Header: full on setup, a compact strip once cards are in play so the reading
              and the Copy for AI action are reached without heavy scrolling. */}
          <div className={step === "setup" ? "mb-8 text-center" : "mb-4 text-center"}>
            <h1 className={`relative mb-4 font-bold text-foreground ${step === "setup" ? "" : "text-xl md:text-2xl"}`}>
              New Lenormand Reading
              {step === "setup" && (
                <div className="absolute -bottom-2 left-1/2 h-0.5 w-32 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
              )}
            </h1>
            {step === "setup" && (
              <p className="text-lg italic text-muted-foreground">
                Ask a clear question. Read the cards as a sentence.
              </p>
            )}

            {/* Progress Indicator */}
            <div
              className={`flex items-center justify-center space-x-3 sm:space-x-6 ${step === "setup" ? "mt-8" : "mt-3"}`}
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
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold sm:h-10 sm:w-10 sm:text-sm ${
                        step === s
                          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "border-muted-foreground bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="ml-2 hidden text-sm font-medium sm:ml-3 sm:inline">
                      {getStepLabel(s)}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className={`ml-3 h-0.5 w-6 rounded-full sm:ml-6 sm:w-12 ${
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
            <Alert className="border-destructive/30 bg-destructive/10 mb-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
                  <AlertDescription className="text-destructive-foreground mt-0.5">
                    {error}
                  </AlertDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError("")}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive/80 h-auto p-1"
                >
                  ✕
                </Button>
              </div>
            </Alert>
          )}

          {/* Step 1: Setup */}
          {step === "setup" && (
            <div className="step-enter">
              <ReadingSetup
                question={question}
                onQuestionChange={setQuestion}
                spread={selectedSpread}
                onSpreadChange={setSelectedSpread}
                method={method}
                onMethodChange={handleMethodChange}
              />
            </div>
          )}

          {/* Step 2: Drawing */}
          {step === "drawing" && (
            <div className="step-enter">
              {method === "virtual" ? (
                <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                  <div className="mb-6 text-center">
                    <h2 className="relative mb-2 text-2xl font-semibold text-foreground">
                      Draw Virtual Cards
                      <div className="absolute -bottom-1 left-1/2 h-0.5 w-20 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
                    </h2>
                    <p className="text-muted-foreground">
                      Drawing {selectedSpread.cards} cards from the 36-card Lenormand deck
                    </p>
                  </div>
                  {loadingCards ? (
                    <div className="flex justify-center p-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <Deck
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
                    initialCards={drawnCards}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Results */}
          {step === "results" && drawnCards.length > 0 && (
            <div className="step-enter space-y-6">
              {allCards.length > 0 ? (
                <ReadingViewer
                  reading={readingObj}
                  allCards={allCards}
                  spreadId={selectedSpread.id}
                  significatorType={significatorType}
                  onSignificatorChange={setSignificatorType}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Loading cards...
                </div>
              )}

              {/* AI Analysis */}
              <ErrorBoundary>
                <AIReadingDisplay
                  aiReading={aiReading}
                  isLoading={aiLoading}
                  isStreaming={aiStreaming}
                  error={aiError}
                  onRetry={startAnalysis}
                  onFollowUp={submitFollowUp}
                  followUpLoading={followUpLoading}
                  followUpStreaming={followUpStreaming}
                  followUpResponse={followUpResponse}
                  followUpHistory={followUpHistory}
                  spreadId={selectedSpread.id}
                  cardCount={selectedSpread.cards}
                  question={question}
                  drawnCards={drawnCardTypes.map((c) => ({ id: c.id, name: c.name }))}
                  allCards={allCards}
                  classicAnalysis={classicAnalysis}
                  completionId={completionId}
                  onStartAI={startAI}
                  aiRequested={aiRequested}
                  significatorPreference={significatorToPreference(significatorType)}
                />
              </ErrorBoundary>

               {/* Start New Reading */}
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={() => performReset(true)}
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground"
                 >
                   <Spade className="h-4 w-4" />
                   Start New Reading
                 </Button>
                </div>
              </div>
           )}
        </div>
      </div>
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
