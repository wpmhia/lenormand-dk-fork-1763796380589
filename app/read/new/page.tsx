"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { Card as CardType, ReadingCard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Eye, AlertTriangle, Sparkles } from "lucide-react";
import { getCardById, getCards } from "@/lib/data";
import {
  AUTHENTIC_SPREADS,
  MODERN_SPREADS,
  COMPREHENSIVE_SPREADS,
} from "@/lib/spreads";
import { AIReadingResponse } from "@/lib/ai-config";
import { USE_STREAMING, parseSSEChunk } from "@/lib/streaming";

import { Deck } from "@/components/Deck";
import { ReadingViewer } from "@/components/ReadingViewer";
import { CardTransition } from "@/components/CardTransition";
const AIReadingDisplay = lazy(() =>
  import("@/components/AIReadingDisplay").then((m) => ({
    default: m.AIReadingDisplay,
  })),
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

function NewReadingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allCards, setAllCards] = useState<CardType[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [step, setStep] = useState<"setup" | "drawing" | "results">("setup");
  const [question, setQuestion] = useState("");
  const [selectedSpread, setSelectedSpread] = useState(AUTHENTIC_SPREADS[1]);
  const [path, setPath] = useState<"virtual" | "physical" | null>(null);
  const [physicalCards, setPhysicalCards] = useState("");
  const [physicalCardsError, setPhysicalCardsError] = useState<string | null>(
    null,
  );
  const [physicalCardsWarnings, setPhysicalCardsWarnings] = useState<string[]>([]);
  const [parsedCards, setParsedCards] = useState<ReadingCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<ReadingCard[]>([]);
  const [drawnCardTypes, setDrawnCardTypes] = useState<CardType[]>([]);
  const [error, setError] = useState("");
  
  // FLIP animation state for seamless transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sourceRects, setSourceRects] = useState<Map<number, DOMRect>>(new Map());
  const [targetRects, setTargetRects] = useState<Map<number, DOMRect>>(new Map());
  const deckCardRefs = useRef<Map<number, HTMLElement>>(new Map());
  const readingCardRefs = useRef<Map<number, HTMLElement>>(new Map());
  const transitionTimeoutRef = useRef<number | null>(null);
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [questionCharCount, setQuestionCharCount] = useState(0);
  const [lastResetParam, setLastResetParam] = useState<string | null>(null);
  const canProceed = true;

  const mountedRef = useRef(true);
  const aiAnalysisStartedRef = useRef(false);
  
  // Measure deck card positions before transition
  const measureDeckPositions = useCallback(() => {
    const positions = new Map<number, DOMRect>();
    deckCardRefs.current.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      positions.set(index, rect);
    });
    setSourceRects(positions);
    return positions;
  }, []);
  
  // Measure reading viewer card positions
  const measureReadingPositions = useCallback(() => {
    const positions = new Map<number, DOMRect>();
    readingCardRefs.current.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      positions.set(index, rect);
    });
    setTargetRects(positions);
    return positions;
  }, []);
  
  // Set refs for deck cards
  const setDeckCardRef = useCallback((index: number) => (el: HTMLElement | null) => {
    if (el) deckCardRefs.current.set(index, el);
  }, []);
  
  // Set refs for reading cards  
  const setReadingCardRef = useCallback((index: number) => (el: HTMLElement | null) => {
    if (el) readingCardRefs.current.set(index, el);
  }, []);

  const performReset = useCallback(
    (keepUrlParams = false) => {
      setStep("setup");
      setDrawnCards([]);
      setDrawnCardTypes([]);
      setQuestion("");
      setSelectedSpread(AUTHENTIC_SPREADS[1]);
      setError("");
      setAiReading(null);
      setAiLoading(false);
      setAiError(null);
      setStreamedContent("");
      setIsStreaming(false);
      setIsPartial(false);
      setPhysicalCards("");
      setPhysicalCardsError(null);
      setParsedCards([]);
      setPath(null);
      setIsTransitioning(false);
      setSourceRects(new Map());
      setTargetRects(new Map());
      deckCardRefs.current.clear();
      readingCardRefs.current.clear();
      aiAnalysisStartedRef.current = false;

      cleanupEventSource();
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }

      if (!keepUrlParams) {
        const newUrl = new URL(window.location.href);
        newUrl.search = "";
        router.replace(newUrl.toString(), { scroll: false });
      }
    },
    [router],
  );

  // Handle reset parameter from New Reading button
  useEffect(() => {
    const resetParam = searchParams.get("reset");
    if (resetParam && resetParam !== lastResetParam) {
      setLastResetParam(resetParam);
      performReset(false);
    }
  }, [searchParams, lastResetParam, performReset]);

  // Handle spread parameter from homepage
  useEffect(() => {
    const spreadParam = searchParams.get("spread");
    if (spreadParam) {
      const spread = COMPREHENSIVE_SPREADS.find((s) => s.id === spreadParam);
      if (spread) {
        setSelectedSpread(spread);
      }
    }
  }, [searchParams]);

  // Load cards on mount (using shared data loader)
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

  // AI streaming state
  const [aiReading, setAiReading] = useState<AIReadingResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPartial, setIsPartial] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup EventSource
  const cleanupEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // Start streaming AI analysis
  const performStreamingAnalysis = useCallback(async () => {
    if (eventSourceRef.current) return; // Already in progress

    setAiLoading(true);
    setAiError(null);
    setAiReading(null);
    setStreamedContent("");
    setIsStreaming(true);
    setIsPartial(false);

    try {
      const aiRequest = {
        question: question.trim() || "What guidance do these cards have for me?",
        cards: drawnCards.map((card) => ({
          id: card.id,
          name: getCardById(allCards, card.id)?.name || "Unknown",
          position: card.position,
        })),
        spreadId: selectedSpread.id,
      };

      console.log("[Client] Starting streaming request...");

      // Use POST with fetch to get streaming response
      const response = await fetch("/api/readings/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiRequest),
      });

      if (!response.ok) {
        let errorMessage = "Failed to start reading";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Check if we got a JSON error response (fallback) or stream
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        // Fallback response (error or timeout)
        const data = await response.json();
        if (data.error) {
          setAiError(data.error);
          setAiReading(data.reading ? { reading: data.reading } : null);
          setIsPartial(data.partial || false);
        } else {
          setAiReading({ reading: data.reading });
        }
        setAiLoading(false);
        setIsStreaming(false);
        return;
      }

      // Handle streaming response with timeout
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";
      let lastUpdate = Date.now();
      const stallTimeout = 30000; // 30s without data = stall

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log("[Stream] Reader done");
            break;
          }

          // Check for stall
          if (Date.now() - lastUpdate > stallTimeout) {
            console.warn("[Stream] Stalled - no data for 30s");
            throw new Error("Stream stalled");
          }

          // Append to buffer and process line by line
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          let hasNewContent = false;
          for (const line of lines) {
            const content = parseSSEChunk(line + '\n');
            if (content) {
              accumulated += content;
              hasNewContent = true;
            }
          }
          
          // Update UI with accumulated content
          if (hasNewContent) {
            lastUpdate = Date.now();
            setStreamedContent(accumulated);
          }
        }

        // Process any remaining buffer
        if (buffer) {
          const content = parseSSEChunk(buffer);
          if (content) {
            accumulated += content;
          }
        }

        // Stream complete
        console.log("[Stream] Complete, total length:", accumulated.length);
        setAiReading({ reading: accumulated });
        setIsPartial(false);
      } catch (streamError) {
        console.error("[Stream] Reading error:", streamError);
        // If we have partial content, show it with retry option
        if (accumulated && accumulated.length > 50) {
          console.log("[Stream] Showing partial content");
          setAiReading({ reading: accumulated });
          setIsPartial(true);
        } else {
          throw streamError;
        }
      } finally {
        reader.releaseLock();
        setAiLoading(false);
        setIsStreaming(false);
      }

    } catch (error) {
      console.error("[Client] Streaming error:", error);
      
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        if (error.message === "Failed to fetch") {
          errorMessage = "Network error - check your connection and try again";
        } else if (error.message.includes("abort")) {
          errorMessage = "Request timed out - the spirits are taking longer than expected";
        } else {
          errorMessage = error.message;
        }
      }
      
      setAiError(errorMessage);
      setAiLoading(false);
      setIsStreaming(false);
      setIsPartial(true);
    }
  }, [question, drawnCards, allCards, selectedSpread.id]);

  // Auto-start AI analysis when entering results step
  useEffect(() => {
    if (
      step === "results" &&
      drawnCards.length > 0 &&
      !aiAnalysisStartedRef.current
    ) {
      aiAnalysisStartedRef.current = true;
      if (USE_STREAMING) {
        performStreamingAnalysis();
      }
    } else if (step !== "results") {
      aiAnalysisStartedRef.current = false;
    }
  }, [step, drawnCards, performStreamingAnalysis]);

  const parsePhysicalCards = useCallback(
    (allCards: CardType[]): { cards: ReadingCard[]; errors: string[]; warnings: string[] } => {
      const input = physicalCards.trim();
      if (!input) return { cards: [], errors: [], warnings: [] };

      const cardInputs = input
        .split(/[,;\s\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      
      const readingCards: ReadingCard[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];
      const seenCardIds = new Set<number>();
      const unmatchedInputs: string[] = [];

      cardInputs.forEach((cardInput, i) => {
        let card: CardType | undefined;

        // Try to match by card number first
        const cardNum = parseInt(cardInput, 10);
        if (!isNaN(cardNum)) {
          if (cardNum < 1 || cardNum > 36) {
            errors.push(`"${cardInput}" is not a valid card number (must be 1-36)`);
            return;
          }
          card = allCards.find((c) => c.id === cardNum);
        }

        // If not found by number, try by name (exact match) or keywords
        if (!card) {
          card = allCards.find(
            (c) =>
              c.name.toLowerCase() === cardInput.toLowerCase() ||
              c.keywords.some(
                (k) => k.toLowerCase() === cardInput.toLowerCase(),
              ),
          );
        }

        if (card) {
          // Check for duplicates
          if (seenCardIds.has(card.id)) {
            warnings.push(`"${cardInput}" is a duplicate of ${card.name} (already entered)`);
            return;
          }
          seenCardIds.add(card.id);
          
          readingCards.push({
            id: card.id,
            position: i,
          });
        } else {
          unmatchedInputs.push(cardInput);
        }
      });

      // Report unmatched inputs as warnings
      if (unmatchedInputs.length > 0) {
        warnings.push(`Unrecognized: ${unmatchedInputs.join(", ")}`);
      }

      return { cards: readingCards, errors, warnings };
    },
    [physicalCards],
  );

  // Handle transition completion
  const handleTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    setSourceRects(new Map());
    setTargetRects(new Map());
    deckCardRefs.current.clear();
    readingCardRefs.current.clear();
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
  }, []);

  // Start FLIP animation from deck to reading
  const startCardTransition = useCallback((cards: CardType[]) => {
    // Store the drawn cards for transition
    setDrawnCardTypes(cards);
    
    // Measure deck positions FIRST (before changing step)
    const deckPositions = measureDeckPositions();
    if (deckPositions.size === 0) {
      // Fallback: just transition without animation
      const readingCards = cards.map((card, index) => ({
        id: card.id,
        position: index,
      }));
      setDrawnCards(readingCards);
      setStep("results");
      return;
    }
    
    setSourceRects(deckPositions);
    
    // Convert to ReadingCards
    const readingCards = cards.map((card, index) => ({
      id: card.id,
      position: index,
    }));
    setDrawnCards(readingCards);
    
    // Show results step (ReadingViewer will mount)
    setStep("results");
    
    // Wait for ReadingViewer to render, then measure targets and animate
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const readingPositions = measureReadingPositions();
        if (readingPositions.size > 0) {
          setTargetRects(readingPositions);
          setIsTransitioning(true);
        } else {
          // No targets found, just complete without animation
          handleTransitionComplete();
        }
      });
    });
  }, [measureDeckPositions, measureReadingPositions, handleTransitionComplete]);

  const handleDraw = useCallback(
    async (cards: ReadingCard[] | CardType[]) => {
      setIsSubmitting(true);
      try {
        let readingCards: ReadingCard[] = [];
        let cardTypes: CardType[] = [];

        // Check if we received ReadingCard[] (from physical path) or CardType[] (from Deck component)
        if (Array.isArray(cards) && cards.length > 0) {
          if ("position" in cards[0]) {
            // It's ReadingCard[] (physical path) - immediate transition
            readingCards = cards as ReadingCard[];
            // Get full card types
            cardTypes = readingCards.map(rc => getCardById(allCards, rc.id)).filter(Boolean) as CardType[];
            setDrawnCardTypes(cardTypes);
            setDrawnCards(readingCards);
            setStep("results");
          } else {
            // It's CardType[] (virtual deck path) - FLIP animation
            cardTypes = cards as CardType[];
            readingCards = cardTypes.map((card, index) => ({
              id: card.id,
              position: index,
            }));
            startCardTransition(cardTypes);
          }
        } else {
          setDrawnCards(readingCards);
          setStep("results");
        }

        if (readingCards.length === 0 && cardTypes.length === 0) {
          setError(
            `No cards found. Please enter ${selectedSpread.cards} valid card numbers (1-36) or names.`,
          );
          return;
        }
      } catch (error) {
        if (mountedRef.current) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : "An error occurred while processing your cards";
          setError(
            `Unable to process cards: ${errorMsg}. Try refreshing the page.`,
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedSpread.cards, allCards, startCardTransition],
  );
  // Parse physical cards when input changes
  useEffect(() => {
    if (path === "physical" && physicalCards) {
      const { cards, errors, warnings } = parsePhysicalCards(allCards);
      setParsedCards(cards);
      setPhysicalCardsWarnings(warnings);
      // Show first error if any
      if (errors.length > 0) {
        setPhysicalCardsError(errors[0]);
      } else {
        setPhysicalCardsError(null);
      }
    } else {
      setPhysicalCardsWarnings([]);
      setPhysicalCardsError(null);
    }
  }, [physicalCards, path, allCards, parsePhysicalCards]);

  // Handle key down for physical cards input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDraw(parsedCards);
      }
    };

    if (path === "physical") {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [path, parsedCards, handleDraw]);

  // Clear AI error when loading starts
  useEffect(() => {
    if (aiLoading) {
      setAiError(null);
    }
  }, [aiLoading]);

  const getButtonLabel = useCallback(() => {
    if (step === "setup") {
      return "✨ Start Reading";
    }
    if (step === "drawing") {
      return path === "physical" ? "✨ Read Physical Cards" : "🎴 Draw Cards";
    }
    return "Continue";
  }, [step, path]);

  const resetReading = useCallback(
    (options = { closeConfirmDialog: false }) => {
      performReset(true);

      if (options.closeConfirmDialog) {
        setShowStartOverConfirm(false);
      }
    },
    [performReset],
  );

  const confirmStartOver = useCallback(() => {
    resetReading({ closeConfirmDialog: true });
  }, [resetReading]);

  const retryAIAnalysis = useCallback(() => {
    if (drawnCards.length > 0) {
      aiAnalysisStartedRef.current = false;
      setStreamedContent("");
      setIsPartial(false);
      performStreamingAnalysis();
    }
  }, [drawnCards, performStreamingAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupEventSource();
    };
  }, [cleanupEventSource]);

  return (
    <TooltipProvider>
      <div className="bg-ambience min-h-screen text-foreground">
        <div className="container relative z-10 mx-auto max-w-4xl px-4 py-8">
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
              <div
                className={`flex items-center ${step === "setup" ? "text-primary" : "text-muted-foreground"}`}
                aria-label="Step 1: Setup"
                aria-current={step === "setup" ? "step" : undefined}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${step === "setup" ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "border-muted-foreground bg-muted text-muted-foreground dark:border-muted-foreground/50 dark:bg-muted/50"}`}
                  aria-hidden="true"
                >
                  1
                </div>
                <span className="ml-3 text-sm font-medium">Setup</span>
              </div>
              <div
                className={`h-0.5 w-12 rounded-full ${step === "drawing" || step === "results" ? "bg-primary" : "bg-muted"}`}
                aria-hidden="true"
              ></div>
              <div
                className={`flex items-center ${step === "drawing" ? "text-primary" : "text-muted-foreground"}`}
                aria-label={`Step 2: ${path === "physical" ? "Enter" : "Draw"}`}
                aria-current={step === "drawing" ? "step" : undefined}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${step === "drawing" ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "border-muted-foreground bg-muted text-muted-foreground dark:border-muted-foreground/50 dark:bg-muted/50"}`}
                  aria-hidden="true"
                >
                  2
                </div>
                <span className="ml-3 text-sm font-medium">
                  {path === "physical" ? "Enter" : "Draw"}
                </span>
              </div>
              <div
                className={`h-0.5 w-12 rounded-full ${step === "results" ? "bg-primary" : "bg-muted"}`}
                aria-hidden="true"
              ></div>
              <div
                className={`flex items-center ${step === "results" ? "text-primary" : "text-muted-foreground"}`}
                aria-label="Step 3: Reading & AI Insights"
                aria-current={step === "results" ? "step" : undefined}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${step === "results" ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "border-muted-foreground bg-muted text-muted-foreground dark:border-muted-foreground/50 dark:bg-muted/50"}`}
                  aria-hidden="true"
                >
                  3
                </div>
                <span className="ml-3 text-sm font-medium">
                  Reading & AI Insights
                </span>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="border-destructive/30 bg-destructive/8 mb-6">
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
                  className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 h-auto p-1"
                >
                  ✕
                </Button>
              </div>
            </Alert>
          )}

          {step === "setup" && (
            <div className="step-enter">
            <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-lg backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-card-foreground">
                  <Eye className="h-5 w-5" />
                  Your Sacred Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Input */}
                <div className="space-y-3">
                  <Textarea
                    id="question"
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value);
                      setQuestionCharCount(e.target.value.length);
                    }}
                    placeholder="What guidance do the cards have for me today?"
                    className="min-h-[100px] resize-none rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                    maxLength={500}
                    aria-describedby="question-help question-count"
                    required
                  />
                  <div
                    id="question-count"
                    className="text-right text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {questionCharCount}/500 characters
                  </div>
                </div>

                {/* Spread Selection - Always Visible */}
                <div className="space-y-2 rounded-lg border border-border bg-card/50 p-4">
                  <Label
                    htmlFor="manual-spread"
                    className="font-medium text-foreground"
                  >
                    Choose Your Spread:
                  </Label>
                  <Select
                    value={selectedSpread.id}
                    onValueChange={(value) => {
                      const spread = COMPREHENSIVE_SPREADS.find(
                        (s) => s.id === value,
                      );
                      if (spread) setSelectedSpread(spread);
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-lg border-border bg-background text-card-foreground focus:border-primary">
                      <SelectValue>{selectedSpread.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-border bg-popover text-popover-foreground max-h-[400px] overflow-y-auto">
                      {/* Authentic Spreads Header */}
                      <div className="px-2 py-1.5 text-xs font-bold text-primary sticky top-0 bg-popover">
                        ✨ AUTHENTIC SPREADS
                      </div>
                      {AUTHENTIC_SPREADS.map((spread) => (
                        <SelectItem
                          key={spread.id}
                          value={spread.id}
                          className="py-3 text-card-foreground hover:bg-accent focus:bg-accent"
                        >
                          <div className="flex flex-col">
                            <span>{spread.label}</span>
                            <span className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground">{spread.cards} cards • {spread.description}</span>
                          </div>
                        </SelectItem>
                      ))}

                      {/* Divider */}
                      <div className="my-2 border-t border-border sticky top-0 bg-popover" />

                      {/* Modern Spreads Header */}
                      <div className="px-2 py-1.5 text-xs font-bold text-primary sticky top-0 bg-popover">
                        🔮 MODERN SPREADS
                      </div>
                      {MODERN_SPREADS.map((spread) => (
                        <SelectItem
                          key={spread.id}
                          value={spread.id}
                          className="py-3 text-sm text-card-foreground hover:bg-accent focus:bg-accent"
                        >
                          <div className="flex flex-col">
                            <span>{spread.label}</span>
                            <span className="line-clamp-2 max-w-[280px] text-xs text-muted-foreground">{spread.cards} cards • {spread.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hero Path Selection */}
                {!path ? (
                  <div className="space-y-6">
                    <div className="space-y-4 text-center">
                      <Label className="mb-4 block text-lg font-medium text-foreground">
                        Choose your reading path
                      </Label>
                      <div className="btn-group-hero">
                        <Button
                          id="btn-draw-cards"
                          onClick={() => {
                            setPath("virtual");
                            setStep("drawing");
                          }}
                          className="btn-group-hero-item"
                          size="lg"
                          variant="default"
                        >
                          ✨ Draw cards for me
                        </Button>
                        <Button
                          id="btn-have-cards"
                          onClick={() => {
                            setPath("physical");
                            setStep("drawing");
                          }}
                          className="btn-group-hero-item"
                          size="lg"
                          variant="default"
                        >
                          🎴 I already have cards
                        </Button>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center justify-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary/60"></span>
                          Cards are shuffled in your browser—no account needed.
                        </p>
                        <p className="flex items-center justify-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-muted-foreground/60"></span>
                          Your cards stay on your table; we only interpret them.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
          )}

          {step === "drawing" && (
            <div className="step-enter">
              <Card className="relative overflow-hidden rounded-2xl border-border bg-card shadow-lg backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50"></div>
                <CardContent className="relative z-10 space-y-8 p-8">
                  <div className="text-center">
                    <h2 className="relative mb-4 text-3xl font-semibold text-foreground">
                      {path === "virtual"
                        ? "Draw Your Cards"
                        : "Enter Your Cards"}
                      <div className="absolute -bottom-2 left-1/2 h-0.5 w-24 -translate-x-1/2 transform rounded-full bg-gradient-to-r from-primary to-primary/60"></div>
                    </h2>
                    <p className="text-lg italic text-muted-foreground">
                      {path === "virtual"
                        ? `Drawing ${selectedSpread.cards} cards from the sacred deck`
                        : `Enter ${selectedSpread.cards} cards from your physical deck`}
                    </p>
                  </div>

                  {/* Virtual Draw */}
                  {path === "virtual" &&
                    (loadingCards ? (
                      <div className="flex justify-center p-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <Deck
                        cards={allCards}
                        drawCount={selectedSpread.cards}
                        onDraw={handleDraw}
                        isProcessing={step !== "drawing"}
                        setCardRef={setDeckCardRef}
                        hideDrawnCards={isTransitioning}
                      />
                    ))}

                  {/* Physical Cards Input */}
                  {path === "physical" && selectedSpread && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="physical-cards"
                            className="font-medium text-foreground"
                          >
                            Enter Your Cards:
                          </Label>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                parsedCards.length === selectedSpread.cards
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {parsedCards.length} / {selectedSpread.cards}{" "}
                              cards
                            </span>
                            {parsedCards.length === selectedSpread.cards && (
                              <span
                                className="h-2 w-2 rounded-full bg-green-500"
                                aria-hidden="true"
                              ></span>
                            )}
                          </div>
                        </div>
                        <Textarea
                          id="physical-cards"
                          value={physicalCards}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const cardInputs = newValue
                              .split(/[,;\s\n]+/)
                              .map((s) => s.trim())
                              .filter((s) => s.length > 0);
                            if (cardInputs.length > selectedSpread.cards) {
                              const truncatedInputs = cardInputs.slice(
                                0,
                                selectedSpread.cards,
                              );
                              const truncatedValue = truncatedInputs.join(", ");
                              setPhysicalCards(truncatedValue);
                              if (
                                typeof window !== "undefined" &&
                                window.alert
                              ) {
                                window.alert(
                                  "Card input truncated to maximum allowed characters",
                                );
                              }
                            } else {
                              setPhysicalCards(newValue);
                            }
                          }}
                          placeholder={`Enter ${selectedSpread.cards} card numbers (1-36) or names\n\nExamples: 1 5 12 • Rider, Clover, Ship • Birds, 20, 36`}
                          className={`min-h-[120px] resize-none rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 ${
                            physicalCardsError
                              ? "border-destructive focus:border-destructive"
                              : ""
                          }`}
                          rows={4}
                          aria-describedby="physical-cards-help physical-cards-count physical-cards-error"
                          aria-invalid={!!physicalCardsError}
                        />

                        {/* Live Card Chips */}
                        {parsedCards.length > 0 && (
                          <div
                            className="flex flex-wrap gap-2"
                            aria-live="polite"
                            aria-label="Recognized cards"
                          >
                            {parsedCards.map((card, index) => {
                              const fullCard = getCardById(allCards, card.id);
                              return (
                                <div
                                  key={`${card.id}-${index}`}
                                  className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-sm font-medium text-primary"
                                >
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-xs font-bold">
                                    {card.id}
                                  </span>
                                  {fullCard?.name || "Unknown"}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Error, Warnings, and Help Text */}
                        <div className="space-y-1">
                          {physicalCardsError && (
                            <p
                              id="physical-cards-error"
                              className="text-destructive text-xs"
                              role="alert"
                            >
                              {physicalCardsError}
                            </p>
                          )}
                          {physicalCardsWarnings.length > 0 && (
                            <div className="space-y-0.5">
                              {physicalCardsWarnings.map((warning, i) => (
                                <p
                                  key={i}
                                  className="text-amber-600 dark:text-amber-400 text-xs"
                                  role="alert"
                                >
                                  ⚠️ {warning}
                                </p>
                              ))}
                            </div>
                          )}
                          <p
                            id="physical-cards-help"
                            className="text-xs text-muted-foreground"
                          >
                            💡 Use numbers (1-36) or names. Try
                            &quot;rider&quot;, &quot;clover&quot;,
                            &quot;ship&quot;. Typo-tolerant!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Submit Button for Physical Cards */}
                  {path === "physical" && selectedSpread && (
                    <Button
                      onClick={() => handleDraw(parsedCards)}
                      disabled={parsedCards.length !== selectedSpread.cards || isSubmitting}
                      loading={isSubmitting}
                      loadingText="Starting..."
                      className="w-full"
                      size="lg"
                      variant="default"
                    >
                      ✨ Start Reading
                    </Button>
                  )}

                  <div className="text-center"></div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* FLIP Animation Layer - seamless card transition */}
          {isTransitioning && (
            <CardTransition
              cards={drawnCardTypes}
              sourceRects={sourceRects}
              targetRects={targetRects}
              onComplete={handleTransitionComplete}
              duration={600}
            />
          )}

          {/* Results Step - All spreads show here */}
          {step === "results" && drawnCards.length > 0 && (
            <div className="step-enter space-y-6">
              {/* Show the drawn cards */}
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
                  setCardRef={setReadingCardRef}
                  hideCardsDuringTransition={isTransitioning}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Loading cards...
                </div>
              )}

              {/* Card meanings now accessed via hover on spread cards - removed redundant section */}

              {/* AI Analysis Section - Shows inline with cards */}
              <div className="mt-6">
                <AIReadingDisplay
                  aiReading={aiReading}
                  isLoading={aiLoading}
                  error={aiError}
                  onRetry={retryAIAnalysis}
                  spreadId={selectedSpread.id}
                  cards={drawnCards.map((card) => ({
                    id: card.id,
                    name: getCardById(allCards, card.id)?.name || "Unknown",
                    position: card.position,
                  }))}
                  allCards={allCards}
                  question={question}
                  isStreaming={false}
                  streamedContent={aiReading?.reading || ""}
                />
              </div>

              {/* Start New Reading Button */}
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

          {/* Start Over Confirmation Dialog */}
          <Dialog
            open={showStartOverConfirm}
            onOpenChange={setShowStartOverConfirm}
          >
            <DialogContent className="border-border bg-card">
              <DialogHeader>
                <DialogTitle className="text-card-foreground">
                  Start Over?
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  This will reset your current reading and all progress. This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowStartOverConfirm(false)}
                  className="border-border text-card-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button onClick={confirmStartOver} variant="destructive">
                  Start Over
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
