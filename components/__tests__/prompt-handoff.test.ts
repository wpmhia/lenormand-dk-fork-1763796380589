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
    for (const card of drawn(n)) {
      expect(text).toContain(CARD_CATALOG.find((c) => c.id === card.id)!.name);
    }
  });

  it("a failed clipboard keeps the user on the page and shows the full prompt to copy", () => {
    expect(picker).toContain('id="manual-prompt"');
    expect(picker).toContain("readOnly");
  });
});
