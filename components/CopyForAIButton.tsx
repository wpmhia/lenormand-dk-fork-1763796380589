"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, AlertCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { copyTextToClipboard } from "@/lib/clipboard";
import { buildCopyForAIText } from "@/lib/copy-for-ai";
import type { Card, ReadingCard } from "@/lib/types";
import type { SpreadId } from "@/lib/spread-definitions";

interface CopyForAIButtonProps {
  spreadId: SpreadId;
  question: string;
  drawn: ReadingCard[];
  allCards: Card[];
}

const FEEDBACK_MS = 2500;

/**
 * Secondary action: copies a self-contained reading prompt to the clipboard, for use in any
 * external assistant. It calls no API and does not touch the DeepSeek pipeline. Only the spread
 * and the card count are tracked, never the question or the cards.
 */
export function CopyForAIButton({ spreadId, question, drawn, allCards }: CopyForAIButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleCopy = async () => {
    trackEvent("reading_copy_for_ai", { spreadId, cardCount: drawn.length });
    const text = buildCopyForAIText(spreadId, question, drawn, allCards);
    const ok = await copyTextToClipboard(text);
    setStatus(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  };

  const label = status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy for AI";
  const Icon = status === "copied" ? Check : status === "failed" ? AlertCircle : Copy;

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        onClick={handleCopy}
        className="w-full gap-2 sm:w-auto"
        aria-live="polite"
        aria-label={status === "failed" ? "Copy failed. Select the text manually from the reading." : label}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
      {status === "failed" && (
        <p className="text-xs text-muted-foreground" role="status">
          Your browser blocked clipboard access. Copy the reading manually from the page.
        </p>
      )}
    </div>
  );
}
