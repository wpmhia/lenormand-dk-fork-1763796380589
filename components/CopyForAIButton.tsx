"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, AlertCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { copyTextToClipboard } from "@/lib/clipboard";
import { ActionInfoTooltip } from "@/components/ActionInfoTooltip";
import { buildCopyForAIText } from "@/lib/copy-for-ai";
import type { ReadingCard } from "@/lib/types";
import type { SignificatorPreference } from "@/lib/significator";
import type { SpreadId } from "@/lib/spread-definitions";

interface CopyForAIButtonProps {
  spreadId: SpreadId;
  question: string;
  drawn: ReadingCard[];
  significatorPreference?: SignificatorPreference;
}

const FEEDBACK_MS = 2500;

const COPY_FOR_AI_INFO =
  "Copy your complete reading, including your question, cards and spread details, to use with ChatGPT, Claude or any other AI assistant.";

/**
 * Secondary action: copies a self-contained reading prompt to the clipboard, for use in any
 * external assistant. It calls no API and does not touch the DeepSeek pipeline. Only the spread
 * and the card count are tracked, never the question or the cards.
 */
export function CopyForAIButton({
  spreadId,
  question,
  drawn,
  significatorPreference = "both",
}: CopyForAIButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleCopy = async () => {
    trackEvent("reading_copy_for_ai", { spreadId, cardCount: drawn.length });
    const text = buildCopyForAIText(spreadId, question, drawn, significatorPreference);
    const ok = await copyTextToClipboard(text);
    setStatus(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  };

  const label = status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy for AI";
  const Icon = status === "copied" ? Check : status === "failed" ? AlertCircle : Copy;

  return (
    <>
      <div className="flex w-full items-center gap-1 sm:w-auto">
        <Button
          variant="outline"
          onClick={handleCopy}
          className="h-12 w-full gap-2 sm:w-auto"
          aria-live="polite"
          aria-label={status === "failed" ? "Copy failed. Select the text manually from the reading." : label}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </Button>
        <ActionInfoTooltip action="Copy for AI" text={COPY_FOR_AI_INFO} />
      </div>
      {status === "failed" && (
        <p className="w-full text-center text-xs text-muted-foreground sm:order-last sm:basis-full" role="status">
          Your browser blocked clipboard access. Copy the reading manually from the page.
        </p>
      )}
    </>
  );
}
