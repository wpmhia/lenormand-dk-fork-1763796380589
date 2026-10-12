import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt } from "@/lib/prompt-builder";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

const cardsMap = getCardCatalogMap();

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => {
    const card = CARD_CATALOG[(index + offset) % CARD_CATALOG.length];
    return {
      id: card.id,
      name: card.name,
      keywords: card.keywords,
      coreMeaning: card.meaning.general,
      secondaryMeanings: card.meaning.secondaryMeanings,
      meaningReviewStatus: card.meaning.reviewStatus,
    };
  });
}

describe("prompt-builder: internal references keep one stable card vocabulary", () => {
  it("explicitly tells the model to use canonical English names inside patterns[].cards", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will I move?", draw(3, 0), cardsMap),
    );
    expect(prompt).toMatch(/canonical English card names/);
    expect(prompt).toMatch(/never translate these names into the user's language inside "cards"/);
  });

  it("keeps all free text English while card labels stay canonical English", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "How could this situation change?", draw(3, 0), cardsMap),
    );
    expect(prompt).toMatch(/every name inside "patterns\[\]\.cards" is the canonical English card name/);
    expect(prompt).toContain("User question (the app responds in English)");
    expect(prompt).toMatch(/Write all user-facing prose in English/);
    expect(prompt).toMatch(/"answer", "reading", and "patterns\[\]\.meaning", is written in English/);
  });

  it("does not include or imply multilingual card aliases", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will I move?", draw(3, 0), cardsMap),
    );
    expect(prompt).not.toContain("Berg");
    expect(prompt).not.toContain("Berger");
    expect(prompt).not.toContain("Matrimonio");
    expect(prompt).not.toMatch(/alias/i);
  });
});
