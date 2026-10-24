import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

globalThis.React = React;

vi.mock("next/link", () => ({ default: ({ children }: { children: unknown }) => children }));
vi.mock("@/lib/analytics", () => ({ trackEvent: () => {} }));
vi.mock("@/lib/reading-parser", () => ({ ReadingMarkdown: ({ children }: { children: string }) => children }));

import { AIReadingDisplay } from "@/components/AIReadingDisplay";

const QUESTION = "Will my project advance this year?";

function render(props: Partial<Parameters<typeof AIReadingDisplay>[0]>) {
  return renderToStaticMarkup(
    React.createElement(AIReadingDisplay, {
      aiReading: null,
      isLoading: false,
      isStreaming: false,
      error: null,
      onRetry: () => {},
      question: QUESTION,
      ...props,
    } as Parameters<typeof AIReadingDisplay>[0]),
  );
}

describe("AIReadingDisplay: the original question stays visible in every state", () => {
  it("shows the question during loading", () => {
    const html = render({ isLoading: true });
    expect(html).toContain(QUESTION);
    expect(html).toContain("Interpreting your cards");
  });

  it("shows the question during streaming before any text arrives", () => {
    const html = render({ isStreaming: true, aiReading: null });
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
    expect(html).toContain("AI Reading Failed");
    expect(html).toContain("Retry Reading");
  });

  it("shows the question above a completed reading", () => {
    const html = render({ aiReading: { reading: "## Answer\nYes." } });
    expect(html.indexOf(QUESTION)).toBeGreaterThan(-1);
    expect(html.indexOf(QUESTION)).toBeLessThan(html.indexOf("Yes."));
  });

  it("uses the same question styling in every state", () => {
    const loading = render({ isLoading: true });
    const failed = render({ error: "boom" });
    const marker = "rounded-lg border border-border/60 bg-muted/30 px-4 py-3";
    expect(loading).toContain(marker);
    expect(failed).toContain(marker);
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
  it("before AI is requested shows the classic analysis and the English 'Interpret My Cards' button", () => {
    const html = renderWithClassic({ aiRequested: false, aiReading: null, isLoading: false, error: null });
    expect(html).toContain("Interpret My Cards");
    expect(html).toContain("Rider");
    expect(html).toContain("Line of 3 cards");
    expect(html).not.toContain("Interpreteer");
  });

  it("after AI is requested the classic analysis stays visible above the AI state", () => {
    const html = renderWithClassic({ aiRequested: true, aiReading: null, isLoading: true });
    expect(html).toContain("Rider");
    expect(html).toContain("Interpreting your cards");
    expect(html.indexOf("Rider")).toBeLessThan(html.indexOf("Interpreting your cards"));
  });

  it("after AI has produced a reading, both the classic analysis and the AI text are shown", () => {
    const html = renderWithClassic({ aiRequested: true, aiReading: { reading: "## Answer\nYes." }, isLoading: false });
    expect(html).toContain("Rider");
    expect(html).toContain("Yes.");
  });

  it("the classic analysis never claims combination interpretations", () => {
    const html = renderWithClassic({ aiRequested: false });
    expect(html.toLowerCase()).toContain("does not interpret card combinations");
    expect(html.toLowerCase()).not.toMatch(/combination(s)? (suggests|means|reveals|indicates)/);
  });

  it("all new interface text is English", () => {
    const html = renderWithClassic({ aiRequested: false });
    expect(html).not.toMatch(/Interpreteer|Optioneel|Klassieke|Geen|kaart/);
  });
});
