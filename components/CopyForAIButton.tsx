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

/**
 * Plain start pages of the assistants. No question, cards or prompt is put in the URL: the user
 * pastes the copied prompt into the chat themselves.
 */
const AI_LINKS = [
  { name: "ChatGPT", href: "https://chatgpt.com/" },
  { name: "Claude", href: "https://claude.ai/new" },
  { name: "Gemini", href: "https://gemini.google.com/app" },
] as const;

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

  const label = status === "copied" ? "Prompt Copied" : status === "failed" ? "Copy failed" : "Copy AI Prompt";
  const Icon = status === "copied" ? Check : status === "failed" ? AlertCircle : Copy;

  return (
    <>
      <div className="flex w-full items-center justify-center gap-1 sm:w-auto">
        <Button
          onClick={handleCopy}
          className="h-12 w-full gap-2 sm:w-auto"
          aria-live="polite"
          aria-label={status === "failed" ? "Copy failed. Select the text manually from the reading." : label}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </Button>
        <ActionInfoTooltip action="Copy AI Prompt" text={COPY_FOR_AI_INFO} />
      </div>
      {status === "copied" && (
        <div className="w-full space-y-2 text-center" role="status">
          <p className="text-sm font-medium text-foreground">Open your preferred AI and paste the prompt to get your interpretation.</p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Open an AI assistant">
            {AI_LINKS.map((ai) => (
              <li key={ai.name}>
                <a
                  href={ai.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-visible:ring-ring inline-flex h-9 items-center rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2"
                >
                  {ai.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <details className="w-full rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-left">
        <summary className="focus-visible:ring-ring cursor-pointer select-none rounded text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2">
          What&apos;s Included in Your Prompt
        </summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Your exact question and the drawn cards, in order.</li>
          <li>Each card&apos;s traditional meaning, read with its position.</li>
          <li>Card positions, neighbours and the spread geometry.</li>
          <li>Instructions to weigh the card combinations and answer the question directly.</li>
          <li>A clear response format for the interpretation.</li>
        </ul>
      </details>
      {status === "failed" && (
        <p className="w-full text-center text-xs text-muted-foreground sm:order-last sm:basis-full" role="status">
          Your browser blocked clipboard access. Copy the reading manually from the page.
        </p>
      )}
    </>
  );
}
