import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

globalThis.React = React;

vi.mock("next/link", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("@/lib/analytics", () => ({ trackEvent: () => {} }));
vi.mock("@/lib/reading-parser", () => ({ ReadingMarkdown: ({ children }: { children: string }) => children }));

import { AIReadingDisplay } from "@/components/AIReadingDisplay";

const QUESTION = "Will my project advance this year?";

function render(props: Partial<Parameters<typeof AIReadingDisplay>[0]>) {
  return renderToStaticMarkup(
    React.createElement(TooltipProvider, null, React.createElement(AIReadingDisplay, {
      aiReading: null,
      isLoading: false,
      isStreaming: false,
      error: null,
      onRetry: () => {},
      question: QUESTION,
      ...props,
    } as Parameters<typeof AIReadingDisplay>[0])),
  );
}

describe("AIReadingDisplay: the original question stays visible in every state", () => {
  it("shows the question while loading", () => {
    const html = render({ isLoading: true });
    expect(html).toContain(QUESTION);
    expect(html).toContain("Interpreting your cards");
  });

  it("shows the question with a generation error and keeps the retry button", () => {
    const html = render({ error: "boom" });
    expect(html).toContain(QUESTION);
    expect(html).toContain("We couldn&#x27;t generate this interpretation");
    expect(html).toContain("Try Again");
  });

  it("shows the question with an empty response and keeps the retry button", () => {
    const html = render({ aiReading: { reading: "" } });
    expect(html).toContain(QUESTION);
    expect(html).toContain("Retry Reading");
  });

  it("shows the question above a completed reading", () => {
    const html = render({ aiReading: { reading: "## Answer\nYes." } });
    expect(html.indexOf(QUESTION)).toBeGreaterThan(-1);
    expect(html.indexOf(QUESTION)).toBeLessThan(html.indexOf("Yes."));
  });

  it("renders no question block when the question is empty", () => {
    const html = render({ isLoading: true, question: "   " });
    expect(html).not.toContain("border-border/60 bg-muted/30");
  });
});

const classicAnalysis = {
  spreadId: "sentence-3" as const,
  question: QUESTION,
  summary: "3 cards in the order drawn. Each card's traditional meaning and the spread's geometry are listed below.",
  cards: [
    { position: 1, name: "Rider", keywords: [], meaning: "News and messages." },
    { position: 2, name: "Snake", keywords: [], meaning: "Complication." },
    { position: 3, name: "Sun", keywords: [], meaning: "Success." },
  ],
  geometry: ["Line of 3 cards, read left to right in the order drawn."],
  combinations: [],
  unknownCombinations: [],
  note: "This classic analysis lists each card's traditional meaning, its position and the spread's geometry. It does not interpret card combinations and does not predict events.",
};

function renderWithClassic(props: Partial<Parameters<typeof AIReadingDisplay>[0]>) {
  return render({ classicAnalysis, onStartAI: () => {}, ...props } as never);
}

describe("AIReadingDisplay: classic analysis and the AI action", () => {
  it("before AI is requested shows the classic analysis with the AI action, and no combination claims", () => {
    const html = renderWithClassic({ aiRequested: false, aiReading: null, isLoading: false, error: null });
    expect(html).toContain("Get AI Interpretation");
    expect(html).toContain("Rider");
    expect(html.toLowerCase()).toContain("does not interpret card combinations");
    expect(html.toLowerCase()).not.toMatch(/combination(s)? (suggests|means|reveals|indicates)/);
  });

  it("after AI is requested and answered, both the classic analysis and the AI text are shown", () => {
    const html = renderWithClassic({ aiRequested: true, aiReading: { reading: "## Answer\nYes." }, isLoading: false });
    expect(html).toContain("Rider");
    expect(html).toContain("Yes.");
    expect(html.indexOf("Rider")).toBeLessThan(html.indexOf("Yes."));
  });

  it("keeps the copy panel available during and after the AI states", () => {
    expect(renderWithClassic({ aiRequested: true, aiReading: null, isLoading: true })).toContain("Copy for AI");
    expect(renderWithClassic({ aiRequested: true, aiReading: { reading: "## Answer\nYes." }, isLoading: false })).toContain("Copy for AI");
  });

  it("puts the AI action before the collapsed traditional meanings and shows no technical curated message", () => {
    const html = renderWithClassic({ aiRequested: false });
    const action = html.indexOf("Get AI Interpretation");
    const disclosure = html.indexOf("Full traditional card meanings");
    expect(action).toBeGreaterThan(-1);
    expect(action).toBeLessThan(disclosure);
    expect(html).not.toContain("No curated combination");
  });
});
