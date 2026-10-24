import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

globalThis.React = React;

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { CopyForAIButton } from "@/components/CopyForAIButton";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { trackEvent } from "@/lib/analytics";

const drawn = [1, 2, 3].map((id, i) => ({ id, position: i }));
const rendered = () =>
  renderToStaticMarkup(
    React.createElement(TooltipProvider, null, React.createElement(CopyForAIButton, {
      spreadId: "sentence-3",
      question: "Private question about my health",
      drawn,
      allCards: CARD_CATALOG,
    })),
  );

describe("Copy for AI button: presentation", () => {
  it("renders a secondary outline button labelled 'Copy for AI'", () => {
    const html = rendered();
    expect(html).toContain("Copy for AI");
    expect(html).toMatch(/border/);
  });

  it("uses no sparkle emoji and no decorative sparkle", () => {
    const html = rendered();
    expect(html).not.toContain("✨");
    expect(html.toLowerCase()).not.toMatch(/sparkle/);
  });

  it("never renders the question text", () => {
    expect(rendered()).not.toContain("Private question about my health");
  });
});

describe("Copy for AI button: tracking privacy", () => {
  const source = readFileSync(resolve(__dirname, "../CopyForAIButton.tsx"), "utf8");

  it("tracks reading_copy_for_ai with spreadId and cardCount only", () => {
    expect(source).toMatch(/trackEvent\("reading_copy_for_ai", \{ spreadId, cardCount: drawn\.length \}\)/);
  });

  it("never sends the question or card contents to analytics", () => {
    const tracked = source.match(/trackEvent\([^;]*\);/g) ?? [];
    expect(tracked.length).toBe(1);
    // The only payload is the spread id and the number of cards; no question, no card names or meanings.
    expect(tracked[0]).toBe('trackEvent("reading_copy_for_ai", { spreadId, cardCount: drawn.length });');
  });
});

describe("Copy for AI button: independence from the AI pipeline", () => {
  const source = readFileSync(resolve(__dirname, "../CopyForAIButton.tsx"), "utf8");

  it("calls no API and no model", () => {
    expect(source).not.toMatch(/fetch\(|generateText|reading-service|ai-model|\/api\//);
  });

  it("uses the shared clipboard utility and the shared Button", () => {
    expect(source).toContain('from "@/lib/clipboard"');
    expect(source).toContain('from "@/components/ui/button"');
  });
});

describe("Copy for AI button: feedback and fallback", () => {
  const source = readFileSync(resolve(__dirname, "../CopyForAIButton.tsx"), "utf8");

  it("shows success and failure states", () => {
    expect(source).toContain('"Copied"');
    expect(source).toContain('"Copy failed"');
  });

  it("explains the clipboard-blocked fallback and points to manual copying", () => {
    expect(source).toContain("Your browser blocked clipboard access");
    expect(source).toContain("Copy the reading manually");
  });
});

beforeEach(() => {
  vi.mocked(trackEvent).mockClear();
});
