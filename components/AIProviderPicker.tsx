"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, AlertCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { copyTextToClipboard } from "@/lib/clipboard";

/**
 * The providers offered as one-action buttons. The URL is the provider's plain start page: the
 * prompt is never put in the URL, so the user pastes it in themselves. Only these three are
 * listed; any other assistant is reached through the generic "Copy Prompt for Any AI" button.
 */
export const AI_PROVIDERS = [
  { id: "chatgpt", name: "ChatGPT", href: "https://chatgpt.com/" },
  { id: "claude", name: "Claude", href: "https://claude.ai/new" },
  { id: "gemini", name: "Gemini", href: "https://gemini.google.com/app" },
] as const;

export type AIProviderId = (typeof AI_PROVIDERS)[number]["id"];

const FEEDBACK_MS = 2500;

interface AIProviderPickerProps {
  /** Builds the one shared prompt. Every provider receives exactly this text. */
  getPromptText: () => string;
  /** Spread id only, passed to analytics. Never the question or the cards. */
  spreadId: string;
  /** Opens the provider. Injected so tests can verify it without leaving the page. */
  openProvider?: (href: string) => void;
}

type Status = "idle" | "copied" | "failed";

/**
 * Copies the shared prompt, confirms the copy, and only then opens the chosen provider in a new
 * tab. If the clipboard is blocked, the user stays on the page and sees a manual-copy message; no
 * tab is opened in that case.
 */
export function AIProviderPicker({ getPromptText, spreadId, openProvider }: AIProviderPickerProps) {
  const [status, setStatus] = useState<Status>("idle");
  // The provider links stay available after a successful copy until the user copies again.
  const [linksReady, setLinksReady] = useState(false);
  const [activeId, setActiveId] = useState<AIProviderId | "any" | null>(null);
  const [manualPrompt, setManualPrompt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const finish = (ok: boolean) => {
    setStatus(ok ? "copied" : "failed");
    setLinksReady(ok);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
  };

  const copyPrompt = async (): Promise<boolean> => {
    const text = getPromptText();
    const ok = await copyTextToClipboard(text);
    setManualPrompt(ok ? null : text);
    // Count a copy only when it succeeded, so ai_prompt_copy matches real handoffs.
    if (ok) trackEvent("ai_prompt_copy", { spreadId, source: activeId ?? "any" });
    else trackEvent("ai_prompt_copy_failed", { spreadId, source: activeId ?? "any" });
    return ok;
  };

  // Open the tab synchronously inside the click, so the browser treats it as a user action and does
  // not block it (Safari and iOS drop the activation after an await). Copying runs after the tab is
  // opened; the status line reports the result, so a failed copy is shown on the page.
  const handleProvider = (provider: (typeof AI_PROVIDERS)[number]) => {
    setActiveId(provider.id);
    trackEvent("ai_provider_open", { provider: provider.id, spreadId });
    if (openProvider) {
      openProvider(provider.href);
    } else {
      window.open(provider.href, "_blank", "noopener,noreferrer");
    }
    void copyPrompt().then((ok) => finish(ok));
  };

  const handleAny = async () => {
    setActiveId("any");
    const ok = await copyPrompt();
    finish(ok);
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Button
        onClick={handleAny}
        className="h-12 w-full gap-2 sm:w-auto sm:min-w-[260px]"
        aria-live="polite"
        aria-label={status === "failed" ? "Copy failed. Select the text manually from the reading." : undefined}
      >
        {status === "copied" ? <Check className="h-4 w-4" aria-hidden="true" /> : status === "failed" ? <AlertCircle className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        {status === "copied" ? "Prompt copied" : status === "failed" ? "Copy failed" : "Copy for AI"}
      </Button>

      {linksReady ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">Open your AI to begin:</p>
      ) : (
        <p className="text-xs text-muted-foreground">ChatGPT · Claude · Gemini · Any AI</p>
      )}

      <nav aria-label="Open an AI assistant" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
        {AI_PROVIDERS.map((provider, i) => (
          <span key={provider.id} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden="true" className="text-muted-foreground/60">·</span>}
            {linksReady ? (
              <a
                href={provider.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("ai_provider_open", { provider: provider.id, spreadId })}
                className="text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                {provider.name}
              </a>
            ) : (
              <span className="text-muted-foreground">{provider.name}</span>
            )}
          </span>
        ))}
      </nav>

      {status === "failed" && (
        <p className="w-full text-center text-xs text-muted-foreground" role="status">
          Your browser blocked clipboard access, so the prompt was not copied. The AI has opened; copy the prompt below and paste it there.
        </p>
      )}

      {manualPrompt !== null && (
        <div className="w-full space-y-2">
          <label htmlFor="manual-prompt" className="block text-xs font-medium text-foreground">
            Your complete prompt
          </label>
          <textarea
            id="manual-prompt"
            readOnly
            value={manualPrompt}
            onFocus={(e) => e.currentTarget.select()}
            rows={8}
            className="w-full rounded-lg border border-border bg-card p-3 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
