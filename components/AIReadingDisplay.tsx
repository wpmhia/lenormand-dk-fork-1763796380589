"use client";

import { useState, useRef, memo } from "react";
import { AIReadingResponse } from "@/lib/prompt-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import {
  Loader2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  MessageCircle,
  Share2,
} from "lucide-react";
import { ReadingMarkdown } from "@/lib/reading-parser";
import { trackEvent } from "@/lib/analytics";
import { copyTextToClipboard } from "@/lib/clipboard";
import type { Card as CardType } from "@/lib/types";
import { buildCardPreview, type ClassicAnalysis } from "@/lib/classic-analysis";
import { CopyForAIButton } from "@/components/CopyForAIButton";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { ReadingCard } from "@/lib/types";

/** The original question, shown above every state so the user keeps their context. */
function QuestionBlock({ question }: { question?: string }) {
  if (!question?.trim()) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Question
      </p>
      <p className="text-sm text-foreground">{question.trim()}</p>
    </div>
  );
}

/**
 * Plain loading state for the AI interpretation: a spinner and one line of text. It uses the
 * site's standard text and border styling, with no glow, pulse or ping effects.
 */
function InterpretingState() {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-8 text-center"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">Interpreting your cards…</p>
    </div>
  );
}

/**
 * The deterministic classic analysis, shown before any AI. It is read-only and needs no network
 * call. Each line names a card with its traditional meaning, then the geometry.
 */
export function ClassicAnalysisView({ analysis }: { analysis: ClassicAnalysis }) {
  return (
    <div className="space-y-4" data-testid="classic-analysis">
      <p className="text-sm text-muted-foreground">{analysis.summary}</p>
      <ul className="space-y-2">
        {analysis.cards.map((card) => (
          <li key={card.position} className="text-sm text-foreground">
            <span className="font-semibold">{card.position}. {card.name}</span>
            {card.meaning ? <span className="text-muted-foreground"> — {card.meaning}</span> : null}
          </li>
        ))}
      </ul>
      {(analysis.combinations?.length ?? 0) > 0 && (
        <div className="space-y-2" data-testid="classic-combinations">
          <p className="text-sm font-semibold text-foreground">Combinations</p>
          <ul className="space-y-2">
            {analysis.combinations.map((combo) => (
              <li key={`${combo.fromPosition}-${combo.toPosition}`} className="text-sm text-foreground">
                <span className="font-semibold">
                  {combo.fromPosition}. {combo.fromName} + {combo.toPosition}. {combo.toName}
                </span>
                <span className="text-muted-foreground"> ({combo.tone}, {combo.relation}) — {combo.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.geometry.length > 0 && (
        <details className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">Spread geometry</summary>
          <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
            {analysis.geometry.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-xs text-muted-foreground/80">{analysis.note}</p>
    </div>
  );
}

/**
 * The results hierarchy: a short, factual preview of the drawn cards and their traditional phrases,
 * then the single AI action that connects the cards to the question, then the full traditional
 * meanings in a collapsed disclosure. The preview is read from the catalogue; it makes no request.
 */
export function ClassicAnalysisWithAI({
  analysis,
  onStartAI,
  allCards = CARD_CATALOG,
}: {
  analysis: ClassicAnalysis;
  onStartAI: () => void;
  allCards?: CardType[];
}) {
  const preview = buildCardPreview(analysis, allCards);
  const drawn: ReadingCard[] = analysis.cards.map((line, index) => ({ id: line.cardId, position: index }));
  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your reading</p>
          <h3 className="text-lg font-semibold text-foreground">What your cards reveal</h3>
          <p className="text-sm text-muted-foreground">
            A first look at the traditional meanings behind your spread.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5" data-testid="card-preview">
            {preview.cards.map((card) => (
              <li
                key={card.position}
                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-3"
              >
                <span className="text-sm font-semibold text-foreground">{card.name}</span>
                <span className="text-xs text-muted-foreground">{card.phrase}</span>
              </li>
            ))}
          </ul>
          {preview.themes && (
            <p className="text-sm text-foreground" data-testid="card-themes">{preview.themes}</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 border-t border-border/60 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Explore how the cards connect to your question.
          </p>
          <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
            <Button
              onClick={() => {
                trackEvent("ai_interpretation_requested", { spreadId: analysis.spreadId });
                onStartAI();
              }}
              className="h-12 w-full sm:w-auto"
            >
              Get AI Interpretation
            </Button>
            <CopyForAIButton
              spreadId={analysis.spreadId}
              question={analysis.question}
              drawn={drawn}
              allCards={allCards}
            />
          </div>
        </div>
      </div>
      <ClassicAnalysisDisclosure analysis={analysis} />
    </>
  );
}

/** The traditional meanings and geometry, collapsed by default and fully available when opened. */
export function ClassicAnalysisDisclosure({ analysis }: { analysis: ClassicAnalysis }) {
  return (
    <details className="group rounded-lg border border-border/60 bg-muted/30 px-4 py-3" data-testid="classic-analysis-disclosure">
      <summary className="focus-visible:ring-ring cursor-pointer select-none rounded text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2">
        Full traditional card meanings
      </summary>
      <div className="mt-4">
        <ClassicAnalysisView analysis={analysis} />
      </div>
    </details>
  );
}

interface AIReadingDisplayProps {
  aiReading: AIReadingResponse | null;
  isLoading: boolean;
  isStreaming?: boolean;
  error: string | null;
  onRetry: () => void;
  onFollowUp?: (question: string) => void;
  followUpLoading?: boolean;
  followUpStreaming?: boolean;
  followUpResponse?: string | null;
  followUpHistory?: { role: "user" | "assistant"; content: string }[];
  spreadId?: string;
  cardCount?: number;
  question?: string;
  drawnCards?: { id: number; name: string }[];
  allCards?: CardType[];
  /** Classic analysis shown before any AI. When absent, the component behaves as before. */
  classicAnalysis?: ClassicAnalysis | null;
  /** Starts the AI interpretation. Only called from the explicit button. */
  onStartAI?: () => void;
  /** Whether the AI interpretation has been requested by the user (shows the AI state). */
  aiRequested?: boolean;
}

/**
 * The classic analysis and the AI states together. Before AI is requested, the classic analysis
 * and the single AI action are shown. After it is requested, the classic analysis stays visible
 * above the AI state, so both can be read without another model call.
 */
export const AIReadingDisplay = memo(function AIReadingDisplay(props: AIReadingDisplayProps) {
  const { classicAnalysis = null, onStartAI, aiRequested = true, question } = props;

  if (classicAnalysis && !aiRequested && onStartAI) {
    return (
      <Card>
        <CardContent className="space-y-6 p-6">
          <QuestionBlock question={question} />
          <ClassicAnalysisWithAI analysis={classicAnalysis} onStartAI={onStartAI} />
        </CardContent>
      </Card>
    );
  }

  if (classicAnalysis && aiRequested) {
    return (
      <Card>
        <CardContent className="space-y-6 p-6">
          <QuestionBlock question={question} />
          <ClassicAnalysisDisclosure analysis={classicAnalysis} />
          <div className="border-t border-border/60 pt-6">
            <AIStateView {...props} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return <AIStateView {...props} />;
});

/** The AI states only (loading, error, empty, reading), without the classic analysis. */
const AIStateView = memo(function AIStateView({
  aiReading,
  isLoading,
  isStreaming = false,
  error,
  onRetry,
  onFollowUp,
  followUpLoading = false,
  followUpStreaming = false,
  followUpResponse = null,
  followUpHistory = [],
  spreadId,
  cardCount,
  question,
  drawnCards,
  allCards,
  classicAnalysis = null,
  onStartAI,
  aiRequested = true,
}: AIReadingDisplayProps) {
  const [copyClicked, setCopyClicked] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [shareClicked, setShareClicked] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shareTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function getPlainReadingText(reading: string): string {
    return reading
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/^\s*[-*]\s+/gm, "  • ")
      .trim();
  }

  function buildSharePayload() {
    const cards = (drawnCards ?? []).map((c, idx) => {
      const full = allCards?.find((a) => a.id === c.id);
      return {
        i: c.id,
        p: idx,
        n: c.name,
        cn: full?.name || c.name,
      };
    });
    return {
      t: "Lenormand Reading",
      q: question || "",
      l: cardCount ?? cards.length,
      c: cards,
      a: aiReading?.reading || "",
      s: spreadId || "",
    };
  }

  async function handleShare(): Promise<boolean> {
    if (shareError) setShareError(false);
    try {
      const res = await fetch("/api/readings/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSharePayload()),
      });
      if (!res.ok) throw new Error("Share failed");
      const data = await res.json();
      if (!data.encoded) throw new Error("Share failed");
      const url = `${window.location.origin}/read/shared/${encodeURIComponent(data.encoded)}`;
      const copied = await copyTextToClipboard(url);
      if (!copied) throw new Error("Clipboard failed");
      setShareClicked(true);
      trackEvent("reading_share", { spreadId: spreadId || "unknown" });
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
      shareTimeoutRef.current = setTimeout(() => setShareClicked(false), 2000);
      return true;
    } catch {
      setShareError(true);
      if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
      shareTimeoutRef.current = setTimeout(() => setShareError(false), 2000);
      return false;
    }
  }

  const handleCopy = async () => {
    if (!aiReading?.reading) return;
    const plainText = getPlainReadingText(aiReading.reading);
    const copyContent = question?.trim()
      ? `Question: ${question.trim()}\n\n${plainText}`
      : plainText;
    const ok = await copyTextToClipboard(copyContent);

    setCopyClicked(ok);
    setCopyError(!ok);

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopyClicked(false);
      setCopyError(false);
    }, 2000);
  };

  const handleFollowUpSubmit = () => {
    if (!followUpQuestion.trim() || !onFollowUp) return;
    onFollowUp(followUpQuestion.trim());
    setFollowUpQuestion("");
  };

  const handleFollowUpKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleFollowUpSubmit();
    }
  };

  const hasUncommittedFollowUpResponse = Boolean(
    followUpResponse && followUpHistory.at(-1)?.content !== followUpResponse,
  );

  if (isLoading) {
    return (
      <>
        <QuestionBlock question={question} />
        <InterpretingState />
      </>
    );
  }

  if (error && !isStreaming) {
    return (
      <>
        <QuestionBlock question={question} />
        <div className="state-card border-destructive/40 bg-destructive/5">
          <div className="state-icon">
            <AlertCircle className="h-10 w-10" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            We couldn&apos;t generate this interpretation
          </h3>
          <p className="text-sm text-muted-foreground">
            Please try again. Your card spread is still available.
          </p>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Button onClick={onRetry} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!aiReading?.reading && !isStreaming) {
    return (
      <>
        <QuestionBlock question={question} />
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="text-destructive mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              AI Reading Failed
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              The AI interpretation could not be generated. Please try again.
            </p>
            <Button onClick={onRetry} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Reading
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  if (isStreaming && !aiReading?.reading) {
    return (
      <>
        <QuestionBlock question={question} />
        <InterpretingState />
      </>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Lenormand Interpretation
            </span>
            <Link
              href="/how-readings-work"
              className="text-xs text-muted-foreground/60 transition-colors hover:text-primary"
            >
              How this reading was made
            </Link>
            {isStreaming && (
              <span className="text-xs text-primary">Reading...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-1.5"
              aria-label={shareError ? "Sharing failed" : shareClicked ? "Share link copied to clipboard" : "Share reading"}
            >
              {shareError ? (
                <AlertCircle className="text-destructive h-3.5 w-3.5" />
              ) : shareClicked ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {shareError ? "Share failed" : shareClicked ? "Link copied" : "Share"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
              aria-label={copyError ? "Copy failed" : copyClicked ? "Interpretation copied to clipboard" : "Copy interpretation"}
            >
              {copyError ? (
                <AlertCircle className="text-destructive h-3.5 w-3.5" />
              ) : copyClicked ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {copyError ? "Copy failed" : copyClicked ? "Copied" : "Copy"}
              </span>
            </Button>
          </div>
        </div>

        <div className="reading-content space-y-4 text-foreground">
          <QuestionBlock question={question} />
          {aiReading?.reading && (
            <div className="leading-relaxed">
              <ReadingMarkdown>{aiReading.reading}</ReadingMarkdown>
            </div>
          )}
        </div>

        {!isStreaming && aiReading?.reading && (
          <FeedbackButtons
            reading={aiReading.reading}
            spreadId={spreadId}
            cardCount={cardCount}
          />
        )}

        {!isStreaming && aiReading?.reading && (
          <div className="mt-8 border-t border-border/50 pt-6">
            {followUpHistory.length > 0 && (
              <div className="mb-6 space-y-4">
                {followUpHistory.map((turn, index) => (
                  <div key={`${turn.role}-${index}`} className={turn.role === "user" ? "rounded-lg bg-muted/40 px-4 py-3" : "px-1"}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {turn.role === "user" ? "You asked" : "Follow-up"}
                    </p>
                    <div className="text-sm leading-relaxed text-foreground/90">
                      {turn.role === "assistant" ? <ReadingMarkdown>{turn.content}</ReadingMarkdown> : turn.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!showFollowUpInput ? (
              <button
                onClick={() => setShowFollowUpInput(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageCircle className="h-4 w-4" />
                Ask a follow-up
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  onKeyDown={handleFollowUpKeyDown}
                  placeholder="What else should I know?"
                  className="border-input focus:ring-ring w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1"
                  rows={2}
                  disabled={followUpLoading || followUpStreaming}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFollowUpInput(false);
                      setFollowUpQuestion("");
                    }}
                    disabled={followUpLoading || followUpStreaming}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleFollowUpSubmit}
                    disabled={
                      !followUpQuestion.trim() ||
                      followUpLoading ||
                      followUpStreaming
                    }
                  >
                    {followUpLoading ? "..." : "Ask"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

         {(followUpStreaming || hasUncommittedFollowUpResponse) && (
          <div className="mt-8 border-t border-border/50 pt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageCircle className="h-4 w-4 text-primary" />
              Follow-up
            </div>
            <div className="text-sm text-foreground/90">
              {followUpStreaming && !followUpResponse ? (
                <div className="flex items-center gap-2 text-muted-foreground" role="status" aria-live="polite">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>Interpreting your cards…</span>
                </div>
              ) : (
                <div className="leading-relaxed">
                  <ReadingMarkdown>{followUpResponse || ""}</ReadingMarkdown>
                </div>
              )}
            </div>
             {followUpStreaming && followUpResponse && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Writing…</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

const FEEDBACK_KEY = "lenormand-reading-feedback";
const FEEDBACK_OPTIONS = [
  { value: "useful", label: "Useful" },
  { value: "felt_accurate", label: "Felt accurate" },
  { value: "too_vague", label: "Too vague" },
  { value: "did_not_fit", label: "Did not fit" },
] as const;

function getStoredFeedbackIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    if (!raw) return new Set();
    const items = JSON.parse(raw);
    return new Set(items.map((i: { id: string }) => i.id));
  } catch {
    return new Set();
  }
}

function storeFeedback(id: string, rating: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    const items = raw ? JSON.parse(raw) : [];
    items.push({ id, rating, createdAt: new Date().toISOString() });
    if (items.length > 100) items.splice(0, items.length - 100);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable
  }
}

function FeedbackButtons({
  reading,
  spreadId,
  cardCount,
}: {
  reading: string;
  spreadId?: string;
  cardCount?: number;
}) {
  const [submitted, setSubmitted] = useState(false);
  const readingId = useRef(Math.random().toString(36).slice(2, 10));

  const alreadySubmitted = getStoredFeedbackIds().has(readingId.current);
  if (alreadySubmitted || submitted) {
    return (
      <div className="mt-6 border-t border-border/50 pt-4">
        <p className="text-center text-xs text-muted-foreground">
          Thanks for your feedback
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-border/50 pt-4">
      <p className="mb-3 text-center text-xs text-muted-foreground">
        Was this reading helpful?
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {FEEDBACK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              storeFeedback(readingId.current, opt.value);
              trackEvent("reading_feedback", {
                rating: opt.value,
                spreadId: spreadId || "unknown",
                cardCount: cardCount || 0,
                readingLength: reading.length,
              });
              setSubmitted(true);
            }}
            className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
