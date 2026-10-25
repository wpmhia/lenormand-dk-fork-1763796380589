import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

globalThis.React = React;

const copyTextToClipboard = vi.fn();
const trackEvent = vi.fn();
vi.mock("@/lib/clipboard", () => ({ copyTextToClipboard: (t: string) => copyTextToClipboard(t) }));
vi.mock("@/lib/analytics", () => ({ trackEvent: (n: string, d?: unknown) => trackEvent(n, d) }));

import { AIProviderPicker, AI_PROVIDERS } from "@/components/AIProviderPicker";

beforeEach(() => {
  copyTextToClipboard.mockReset();
  trackEvent.mockReset();
});

describe("AI provider picker: the official set and the start pages", () => {
  it("offers exactly ChatGPT, Claude and Gemini", () => {
    expect(AI_PROVIDERS.map((p) => p.name)).toEqual(["ChatGPT", "Claude", "Gemini"]);
  });

  it("each provider is a plain https start page with no prompt or question in the URL", () => {
    for (const p of AI_PROVIDERS) {
      expect(p.href).toMatch(/^https:\/\//);
      expect(p.href).not.toMatch(/[?&](q|query|prompt|text|utm_)/);
    }
  });

  it("renders the three provider buttons and the universal copy action", () => {
    const html = renderToStaticMarkup(
      React.createElement(AIProviderPicker, { getPromptText: () => "P", spreadId: "sentence-3" }),
    );
    for (const p of AI_PROVIDERS) expect(html).toContain(`aria-label="Copy the prompt and open ${p.name}"`);
    expect(html).toContain("Copy Prompt for Any AI");
  });

  it("tracks no question text and no card content in its markup", () => {
    const html = renderToStaticMarkup(
      React.createElement(AIProviderPicker, { getPromptText: () => "Private question about my health", spreadId: "sentence-3" }),
    );
    expect(html).not.toContain("Private question about my health");
  });
});

describe("AI provider picker: the tab opens inside the click, copying follows", () => {
  const source = readFileSync(resolve(__dirname, "../AIProviderPicker.tsx"), "utf8");

  it("opens the tab before the clipboard await, so the user gesture is not lost to a popup blocker", () => {
    const handler = source.slice(source.indexOf("const handleProvider"), source.indexOf("const handleAny"));
    expect(handler.indexOf("window.open")).toBeLessThan(handler.indexOf("copyPrompt()"));
    expect(handler).not.toMatch(/await /);
  });

  it("reports the copy result on the page, and a failed copy leaves the user on the page", () => {
    const handler = source.slice(source.indexOf("const handleProvider"), source.indexOf("const handleAny"));
    expect(handler).toContain("copyPrompt().then((ok) => finish(ok))");
    expect(source).toContain("setManualPrompt(ok ? null : text)");
  });

  it("opens the provider in a new tab with noopener and noreferrer", () => {
    expect(source).toContain('window.open(provider.href, "_blank", "noopener,noreferrer")');
  });

  it("the copy helper is the same for every provider and the universal action", () => {
    const copies = source.match(/copyPrompt\(\)/g) ?? [];
    expect(copies.length).toBe(2);
    expect(source).toMatch(/const copyPrompt = async[\s\S]*?copyTextToClipboard\(text\)/);
    expect(source).toMatch(/const text = getPromptText\(\)/);
  });

  it("tracks the provider open and the copy with spread and provider only", () => {
    expect(source).toMatch(/trackEvent\("ai_provider_open", \{ provider: provider\.id, spreadId \}\)/);
    expect(source).toMatch(/trackEvent\("ai_prompt_copy", \{ spreadId, source: activeId \?\? "any" \}\)/);
    const calls = source.match(/trackEvent\([^;]*\);/g) ?? [];
    for (const call of calls) expect(call).not.toMatch(/question|drawn|cards|reading/i);
  });

  it("never claims that no AI was opened when the copy fails; the tab is opened first", () => {
    expect(source).not.toContain("so no AI was opened");
    expect(source).toContain("The AI has opened; copy the prompt below");
  });
});
