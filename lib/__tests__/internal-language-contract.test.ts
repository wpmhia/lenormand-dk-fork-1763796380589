import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt } from "@/lib/prompt-builder";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

const cardsMap = getCardCatalogMap();

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => {
    const card = CARD_CATALOG[(index + offset) % CARD_CATALOG.length];
    return { id: card.id, name: card.name, keywords: card.keywords };
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

  it("explicitly separates the free-text language from the internal card vocabulary", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will I move?", draw(3, 0), cardsMap),
    );
    expect(prompt).toMatch(/every name inside "patterns\[\]\.cards" is the canonical English card name/);
    expect(prompt).toMatch(/"answer" and "reading" are written in the language of the user's question/);
    expect(prompt).toMatch(/never contain English card names where the user's language has its own word/);
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