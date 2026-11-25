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

const source = readFileSync(resolve(__dirname, "../CopyForAIButton.tsx"), "utf8");

describe("Copy for AI button: privacy and independence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("never renders the question text", () => {
    expect(rendered()).not.toContain("Private question about my health");
  });

  it("tracks only the spread id and card count, and calls no API or model", () => {
    const tracked = source.match(/trackEvent\([^;]*\);/g) ?? [];
    expect(tracked).toEqual(['trackEvent("reading_copy_for_ai", { spreadId, cardCount: drawn.length });']);
    expect(source).not.toMatch(/fetch\(|generateText|reading-service|ai-model|\/api\//);
  });

  it("shows success, failure and the clipboard-blocked manual-copy fallback", () => {
    expect(source).toContain('"Prompt Copied"');
    expect(source).toContain('"Copy failed"');
    expect(source).toContain("Your browser blocked clipboard access");
    expect(source).toContain("Copy the reading manually");
  });
});
