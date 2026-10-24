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
    expect(html).toContain("Consulting the cards");
  });

  it("shows the question during streaming before any text arrives", () => {
    const html = render({ isStreaming: true, aiReading: null });
    expect(html).toContain(QUESTION);
    expect(html).toContain("Consulting the cards");
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
