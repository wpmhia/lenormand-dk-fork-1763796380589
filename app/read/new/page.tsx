"use client";

import { useState, useEffect, useCallback, useRef, Suspense, useMemo, lazy } from "react";
import { flushSync } from "react-dom";
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
import { Eye, AlertTriangle } from "lucide-react";
import { getCardById, getCards } from "@/lib/data";
import {
  AUTHENTIC_SPREADS,
  MODERN_SPREADS,
  COMPREHENSIVE_SPREADS,
} from "@/lib/spreads";
import { AIReadingResponse } from "@/lib/ai-config";

const Deck = lazy(() => import("@/components/Deck").then(m => ({ default: m.Deck })));
const ReadingViewer = lazy(() => import("@/components/ReadingViewer").then(m => ({ default: m.ReadingViewer })));
const AIReadingDisplay = lazy(() => import("@/components/AIReadingDisplay").then(m => ({ default: m.AIReadingDisplay })));

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
  const [parsedCards, setParsedCards] = useState<ReadingCard[]>([]);
  const [drawnCards, setDrawnCards] = useState<ReadingCard[]>([]);
  const [error, setError] = useState("");
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);
  const [questionCharCount, setQuestionCharCount] = useState(0);
  const [lastResetParam, setLastResetParam] = useState<string | null>(null);
  const canProceed = true;

  const mountedRef = useRef(true);
  const aiAnalysisStartedRef = useRef(false);

  const performReset = useCallback(
    (keepUrlParams = false) => {
      setStep("setup");
      setDrawnCards([]);
      setQuestion("");
      setSelectedSpread(AUTHENTIC_SPREADS[1]);
      setError("");
      setAiReading(null);
      setAiLoading(false);
      setAiError(null);
      setIsStreaming(false);
      setStreamedContent("");
      setPhysicalCards("");
      setPhysicalCardsError(null);
      setParsedCards([]);
      setPath(null);
      aiAnalysisStartedRef.current = false;

       if (abortControllerRef.current) {
         abortControllerRef.current.abort();
         abortControllerRef.current = null;
       }
       requestInProgressRef.current = false; // Reset deduplication flag

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestInProgressRef = useRef(false);

  function parseSSEChunk(data: string): string | null {
    if (data === "[DONE]") return null;
    if (!data || data.trim() === "") return null;
    
    try {
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') return null;
      
      // OpenAI format: choices[0].delta.content
      const content = parsed.choices?.[0]?.delta?.content;
      if (typeof content === 'string') return content;
      
      return null;
    } catch {
      return null;
    }
  }

  // Streaming function
  const performStreamingAnalysis = useCallback(async () => {
    // Deduplication: prevent duplicate in-flight requests
    if (requestInProgressRef.current) {
      console.warn('AI request already in progress, skipping duplicate request');
      return;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    requestInProgressRef.current = true;

    const timeoutId = setTimeout(() => {
      controller.abort();
      setAiError("Request timed out");
      setAiLoading(false);
      setIsStreaming(false);
    }, 90000);

    setAiLoading(true);
    setAiError(null);
    setIsStreaming(true);
    setStreamedContent("");
    setAiReading({ reading: "" });

    try {
      const aiRequest = {
        question:
          question.trim() || "What guidance do these cards have for me?",
        cards: drawnCards.map((card) => ({
          id: card.id,
          name: getCardById(allCards, card.id)?.name || "Unknown",
          position: card.position,
        })),
        spreadId: selectedSpread.id,
      };

      const response = await fetch("/api/readings/interpret", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify(aiRequest),
        signal: controller.signal,
        // Add connection timeout and retry logic
        keepalive: true,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stream failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200),
          url: response.url
        });
        throw new Error(`Stream failed: ${response.status} - ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No stream body");
      }

    const reader = response.body.getReader();
         const decoder = new TextDecoder();
         let content = "";
         let buffer = "";
         let lastUpdateTime = Date.now();
         const UPDATE_INTERVAL = 16; // ~60fps for smooth streaming
         const MAX_BUFFER_SIZE = 50000;
         const MAX_CONTENT_LENGTH = 100000;

        try {
          while (true) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              
              // Prevent buffer from growing too large
              if (buffer.length > MAX_BUFFER_SIZE) {
                console.warn('SSE buffer exceeding maximum size, truncating');
                buffer = buffer.slice(-MAX_BUFFER_SIZE / 2); // Keep last half
              }
              
              buffer += chunk;
              
              // Prevent content from growing too large
              if (content.length > MAX_CONTENT_LENGTH) {
                console.warn('Content exceeding maximum length, stopping stream');
                setAiError('Reading too long, stopped processing');
                break;
              }

              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") {
                    break;
                  }
                  const text = parseSSEChunk(data);
                  if (text) {
                    content += text;
                    
                    // Update UI every 16ms (~60fps) for smooth streaming
                    const now = Date.now();
                    if (now - lastUpdateTime > UPDATE_INTERVAL) {
                      flushSync(() => {
                        setStreamedContent(content);
                        setAiReading({ reading: content });
                      });
                      lastUpdateTime = now;
                    }
                  }
                }
              }
            } catch (streamError) {
              if (
                streamError instanceof Error &&
                streamError.name === "AbortError"
              ) {
                break;
              }
              setAiError("Connection interrupted");
              break;
            }
          }
        } finally {
          // SECURITY FIX: Always cleanup reader to prevent memory leaks
          try {
            await reader.cancel();
          } catch (cancelError) {
            console.error('Error canceling reader:', cancelError);
          }
        }
        
         // Final update to ensure all content is displayed
         flushSync(() => {
           if (content.length > 0 && content.length <= MAX_CONTENT_LENGTH) {
             setStreamedContent(content);
             setAiReading({ reading: content });
           } else if (content.length > MAX_CONTENT_LENGTH) {
             setStreamedContent(content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Reading truncated due to length]');
             setAiReading({ reading: content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Reading truncated due to length]' });
           }
         });

      if (content.length > 0) {
        flushSync(() => {
          setAiReading({ reading: content });
          setStreamedContent(content);
        });
      } else {
        setIsStreaming(false);
        setAiLoading(true);
        try {
          const fullResponse = await fetch("/api/readings/interpret", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...aiRequest, _fallback: true }),
          });

          if (fullResponse.ok) {
            const data = await fullResponse.json();
            if (data.reading) {
              setAiReading({ reading: data.reading });
              setStreamedContent(data.reading);
            } else {
              setAiError("No reading received from API");
            }
          } else {
            setAiError(`API error: ${fullResponse.status}`);
          }
        } catch {
          setAiError("Failed to get reading");
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setAiError(error.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setAiLoading(false);
      setIsStreaming(false);
      requestInProgressRef.current = false; // Mark request as complete
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
      performStreamingAnalysis();
    } else if (step !== "results") {
      aiAnalysisStartedRef.current = false;
    }
  }, [step, drawnCards, performStreamingAnalysis]);

  const parsePhysicalCards = useCallback(
    (allCards: CardType[]): ReadingCard[] => {
      const input = physicalCards.trim();
      if (!input) return [];

      const cardInputs = input
        .split(/[,;\s\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const readingCards: ReadingCard[] = [];

      cardInputs.forEach((cardInput, i) => {
        let card: CardType | undefined;

        // Try to match by card number first
        const cardNum = parseInt(cardInput, 10);
        if (!isNaN(cardNum)) {
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
          readingCards.push({
            id: card.id,
            position: i,
          });
        }
      });

      return readingCards;
    },
    [physicalCards],
  );

  const handleDraw = useCallback(
    async (cards: ReadingCard[] | CardType[]) => {
      try {
        let readingCards: ReadingCard[];

        // Check if we received ReadingCard[] (from physical path) or CardType[] (from Deck component)
        if (Array.isArray(cards) && cards.length > 0) {
          if ("position" in cards[0]) {
            // It's ReadingCard[]
            readingCards = cards as ReadingCard[];
          } else {
            // It's CardType[], convert to ReadingCard[]
            readingCards = (cards as CardType[]).map((card, index) => ({
              id: card.id,
              position: index,
            }));
          }
        } else {
          readingCards = [];
        }

        if (readingCards.length === 0) {
          setError(
            `No cards found. Please enter ${selectedSpread.cards} valid card numbers (1-36) or names.`,
          );
          return;
        }

        setDrawnCards(readingCards);
        setStep("results");
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
      }
    },
    [selectedSpread.cards],
  );
  // Parse physical cards when input changes
  useEffect(() => {
    if (path === "physical" && physicalCards) {
      const parsed = parsePhysicalCards(allCards);
      setParsedCards(parsed);
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
      performStreamingAnalysis();
    }
  }, [drawnCards, performStreamingAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      // Cleanup any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      requestInProgressRef.current = false;
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
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
                    <SelectContent className="border-border bg-popover text-popover-foreground">
                      {/* Authentic Spreads Header */}
                      <div className="px-2 py-1.5 text-xs font-bold text-primary">
                        ✨ AUTHENTIC SPREADS
                      </div>
                      {AUTHENTIC_SPREADS.map((spread) => (
                        <SelectItem
                          key={spread.id}
                          value={spread.id}
                          className="py-3 text-card-foreground hover:bg-accent focus:bg-accent"
                        >
                          {spread.label}
                        </SelectItem>
                      ))}

                      {/* Divider */}
                      <div className="my-2 border-t border-border" />

                      {/* Modern Spreads Header */}
                      <div className="px-2 py-1.5 text-xs font-bold text-primary">
                        🔮 MODERN SPREADS
                      </div>
                      {MODERN_SPREADS.map((spread) => (
                        <SelectItem
                          key={spread.id}
                          value={spread.id}
                          className="py-3 text-sm text-card-foreground hover:bg-accent focus:bg-accent"
                        >
                          {spread.label}
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
          )}

          {step === "drawing" && (
            <div
              key="drawing"
              className="animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
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
                  {path === "virtual" && (
                    loadingCards ? (
                      <div className="flex justify-center p-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      </div>
                    ) : (
                    <Deck
                      cards={allCards}
                      drawCount={selectedSpread.cards}
                      onDraw={handleDraw}
                      isProcessing={step !== "drawing"}
                    />
                    )
                  )}

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

                          {/* Error and Help Text */}
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
                      disabled={parsedCards.length !== selectedSpread.cards}
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

          {step === "results" && drawnCards.length > 0 && (
            <div
              key="results"
              className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-300"
            >
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
                  isStreaming={isStreaming}
                  streamedContent={streamedContent}
                />
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
