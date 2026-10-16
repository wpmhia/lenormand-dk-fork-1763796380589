import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/**
 * ReadingContext carries only what the reading needs: the question, the cards in draw order,
 * and the significator preference. These tests guard that input, and that no removed
 * interpretation field can quietly reappear in the context.
 */

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, coreMeaning: card.meaning.general };
  });
}

describe("reading-context: input invariants", () => {
  it("preserves the exact draw order it was given", () => {
    const cards = draw(5, 11);
    const ctx = buildReadingContext("sentence-5", "Will I move?", cards, cardsMap);
    expect(ctx.cards.map((card) => card.id)).toEqual(cards.map((card) => card.id));
  });

  it("keeps the exact question it was given", () => {
    const ctx = buildReadingContext("sentence-3", "How might my relationship develop?", draw(3), cardsMap);
    expect(ctx.question).toBe("How might my relationship develop?");
  });

  it("defaults the significator preference to both without creating person bindings", () => {
    const ctx = buildReadingContext("sentence-3", "Will my husband and I stay together?", draw(3), cardsMap);
    expect(ctx.significatorPreference).toBe("both");
    expect(ctx).not.toHaveProperty("personBindings");
  });

  it("preserves an explicit preference as focus metadata only", () => {
    const ctx = buildReadingContext("grand-tableau", "Q?", draw(36, 7), cardsMap, "man");
    expect(ctx.significatorPreference).toBe("man");
  });

  it("carries none of the retired interpretation fields", () => {
    const ctx = buildReadingContext("grand-tableau", "Will I move to a new city?", draw(36), cardsMap) as unknown as Record<string, unknown>;
    for (const removed of [
      "layout",
      "situationContext",
      "questionDomain",
      "questionFrame",
      "semanticQuestion",
      "questionSubjects",
      "timingEvidence",
      "topicFocus",
      "adjacentPairs",
    ]) {
      expect(ctx[removed], `${removed} must not reappear`).toBeUndefined();
    }
  });
});
