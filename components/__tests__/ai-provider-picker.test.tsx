import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";

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

describe("AI provider picker: behaviour", () => {
  it("offers exactly ChatGPT, Claude and Gemini as plain https start pages that carry no reading content", () => {
    expect(AI_PROVIDERS.map((p) => p.name)).toEqual(["ChatGPT", "Claude", "Gemini"]);
    for (const p of AI_PROVIDERS) {
      expect(p.href).toMatch(/^https:\/\//);
      expect(p.href).not.toMatch(/[?&](q|query|prompt|text|utm_)/);
    }
  });

  it("renders the copy action and the provider names, without the prompt text in the markup", () => {
    const html = renderToStaticMarkup(
      React.createElement(AIProviderPicker, { getPromptText: () => "P", spreadId: "sentence-3" }),
    );
    for (const p of AI_PROVIDERS) expect(html).toContain(p.name);
    expect(html).toContain("Copy for AI");

    const withPrivate = renderToStaticMarkup(
      React.createElement(AIProviderPicker, { getPromptText: () => "Private question about my health", spreadId: "sentence-3" }),
    );
    expect(withPrivate).not.toContain("Private question about my health");
  });

  it("opens the provider tab before copying (the user gesture is not lost) and reports the result on the page", () => {
    const source = readFileSync(resolve(__dirname, "../AIProviderPicker.tsx"), "utf8");
    const handler = source.slice(source.indexOf("const handleProvider"), source.indexOf("const handleAny"));
    expect(handler.indexOf("window.open")).toBeLessThan(handler.indexOf("copyPrompt()"));
    expect(handler).not.toMatch(/await /);
    expect(source).toContain('window.open(provider.href, "_blank", "noopener,noreferrer")');
    expect(source).toContain("setManualPrompt(ok ? null : text)");
  });

  it("tracks provider opens and copies with spread and provider ids only, never question or card content", () => {
    const source = readFileSync(resolve(__dirname, "../AIProviderPicker.tsx"), "utf8");
    const calls = source.match(/trackEvent\([^;]*\);/g) ?? [];
    expect(calls.join("\n")).toMatch(/ai_provider_open|ai_prompt_copy/);
    for (const call of calls) expect(call).not.toMatch(/question|drawn|cards|reading/i);
  });
});
