import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt } from "@/lib/prompt-builder";
import { CARD_TIMING_KNOWLEDGE, TIMING_CARDS, getCardTimingKnowledge, getTimingCard, isTimingCardId } from "@/lib/timing";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/**
 * Timing is a knowledge source, not a server-side prediction engine.
 *
 * The server used to compute timing evidence, exclude time windows, and compare a
 * question's timeframe against drawn cards. All of that is gone: the model reads the
 * question's timeframe and the drawn timing cards itself. What remains to test is the
 * reference table the educational UI reads, and the invariant that no per-card timing
 * metadata leaks into the prompt.
 */

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function contextFor(ids: number[]) {
  const cards = ids.map((id, index) => {
    const card = deck.find((entry) => entry.id === id)!;
    return { id: card.id, name: card.name, keywords: card.keywords, position: index };
  });
  return buildReadingContext("sentence-5", "Will I hear back soon?", cards, cardsMap);
}

describe("timing: the card reference table", () => {
  it("exposes the traditional timing cards", () => {
    expect(getTimingCard(12)?.range).toBe("days");
    expect(getTimingCard(17)?.range).toBe("weeks");
    expect(getTimingCard(32)?.range).toBe("months");
    expect(getTimingCard(5)?.range).toBe("long-term");
    expect(isTimingCardId(12)).toBe(true);
    expect(isTimingCardId(1)).toBe(false);
  });

  it("keeps every timing card name canonical", () => {
    for (const timingCard of Object.values(TIMING_CARDS)) {
      expect(CARD_CATALOG.find((card) => card.id === timingCard.id)?.name).toBe(timingCard.name);
    }
  });

  it("keeps every knowledge entry name canonical", () => {
    for (const [id, knowledge] of Object.entries(CARD_TIMING_KNOWLEDGE)) {
      expect(CARD_CATALOG.find((card) => card.id === Number(id))?.name).toBe(knowledge.cardName);
      expect(getCardTimingKnowledge(Number(id))).toBe(knowledge);
    }
  });
});

describe("timing: no server-side timing model in the prompt", () => {
  it("never embeds per-card timing ranges", () => {
    const prompt = buildSimpleReadingPrompt(contextFor([1, 2, 3, 12, 27]));
    expect(prompt).not.toContain("Near future (1-3 weeks)");
    expect(prompt).not.toContain("Within 1-3 weeks");
    expect(prompt).not.toContain("Within days or very soon.");
    expect(prompt).not.toMatch(/;\s*timing:/i);
    expect(prompt).not.toContain("No timing evidence detected");
    expect(prompt).not.toContain("Timing evidence");
  });

  it("leaves timing to the model as a nullable field", () => {
    const prompt = buildSimpleReadingPrompt(contextFor([32, 27, 26]));
    expect(prompt).toMatch(/"timing": string \| null/);
    expect(prompt).toMatch(/Leave timing null when the spread does not ground it/);
  });
});