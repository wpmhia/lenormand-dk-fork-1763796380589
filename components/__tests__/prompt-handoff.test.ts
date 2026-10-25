import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCopyForAIText } from "@/lib/copy-for-ai";
import { CARD_CATALOG } from "@/lib/card-catalog";

const picker = readFileSync(resolve(__dirname, "../AIProviderPicker.tsx"), "utf8");
const drawn = (n: number) => CARD_CATALOG.slice(0, n).map((c, i) => ({ id: c.id, position: i }));
const QUESTION = "Will this situation move forward in the coming weeks?";

describe("handoff: the full prompt is copied, never truncated, never put in a URL", () => {
  it.each([
    ["short 3-card", "sentence-3", 3],
    ["medium 9-card", "comprehensive", 9],
    ["long 36-card", "grand-tableau", 36],
  ] as const)("%s prompt keeps the question and every card, with no truncation marker", (_label, spread, n) => {
    const text = buildCopyForAIText(spread, QUESTION, drawn(n));
    expect(text).toContain(QUESTION);
    expect(text).not.toMatch(/\.\.\.|…|\[truncated\]|\[cut\]/i);
    expect(text.endsWith("\n") || text.length > 0).toBe(true);
    for (const card of drawn(n)) {
      expect(text).toContain(CARD_CATALOG.find((c) => c.id === card.id)!.name);
    }
  });

  it("the 36-card prompt is well above a URL-safe size, so it must travel by clipboard, not a link", () => {
    const text = buildCopyForAIText("grand-tableau", QUESTION, drawn(36));
    expect(encodeURIComponent(text).length).toBeGreaterThan(14000);
  });

  it("the picker never builds a query-string or prefilled URL with the prompt", () => {
    expect(picker).not.toMatch(/\?q=|encodeURIComponent|URLSearchParams|searchParams/);
    expect(picker).not.toMatch(/href:\s*`[^`]*\$\{/);
  });

  it("the provider links are the plain start pages, with no reading content", () => {
    expect(picker).toContain('href: "https://chatgpt.com/"');
    expect(picker).toContain('href: "https://claude.ai/new"');
    expect(picker).toContain('href: "https://gemini.google.com/app"');
  });

  it("a failed clipboard keeps the user on the page and shows the full prompt to copy", () => {
    expect(picker).toContain('id="manual-prompt"');
    expect(picker).toContain("setManualPrompt(ok ? null : text)");
    expect(picker).toContain("readOnly");
  });

  it("the status message names the provider and tells the user to paste", () => {
    expect(picker).toContain("to begin.");
    expect(picker).toContain("Prompt copied. Paste it into");
  });
});
