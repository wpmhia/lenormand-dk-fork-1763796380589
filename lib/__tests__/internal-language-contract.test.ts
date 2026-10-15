import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
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
    expect(prompt).toMatch(/canonical English card names in "cards"/);
  });

  it("keeps the language rule in the system prompt only, not repeated in the user prompt", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "How could this situation change?", draw(3, 0), cardsMap),
    );
    expect(prompt).toContain("User question:");
    expect(prompt).not.toMatch(/Write all user-facing prose in English/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Respond naturally in the language of the user/);
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
