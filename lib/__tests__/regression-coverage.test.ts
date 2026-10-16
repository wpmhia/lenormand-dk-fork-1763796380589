import { describe, it, expect } from "vitest";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSpreadFacts } from "@/lib/prompt-builder";
import { SimpleAnswerSchema, renderSimpleAnswer } from "@/lib/simple-answer";
import { getGrandTableauAdjacentCards } from "@/lib/data";

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => {
    const card = deck[(index + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, coreMeaning: card.meaning.general };
  });
}

describe("regression: drawn card order and grid positions per spread", () => {
  it("lists line spreads in the drawn order", () => {
    const cards = draw(5, 7);
    const facts = buildSpreadFacts(buildReadingContext("sentence-5", "Will I move?", cards, cardsMap));
    cards.forEach((card, index) => expect(facts).toContain(`${index + 1}. ${card.name}`));
  });

  it("places the fifth card at the centre of the 3x3 Petit Tableau", () => {
    const cards = draw(9, 2);
    const facts = buildSpreadFacts(buildReadingContext("comprehensive", "Full month?", cards, cardsMap));
    expect(facts).toContain(`Row 2: ${cards[3].name} | ${cards[4].name} | ${cards[5].name}`);
  });

  it("lists 36 houses in canonical order on the 4x9 Grand Tableau", () => {
    const cards = draw(36, 13);
    const facts = buildSpreadFacts(buildReadingContext("grand-tableau", "Full picture?", cards, cardsMap));
    const houses = facts
      .split("\n")
      .map((line) => line.match(/ — (.+) house$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => match[1]);
    expect(houses).toEqual(deck.map((card) => card.name));
  });
});

describe("regression: Grand Tableau neighbours use bounded eight-cell geometry", () => {
  const ids = [
    28, 7, 14, 17, 1, 20, 13, 15, 18,
    33, 26, 25, 30, 21, 35, 19, 11, 29,
    3, 31, 12, 27, 8, 24, 16, 34, 2,
    23, 10, 4, 36, 9, 32, 6, 22, 5,
  ];
  const cards = ids.map((id, position) => ({ id, position }));

  it("includes orthogonal and diagonal neighbours at the top-left boundary", () => {
    expect(getGrandTableauAdjacentCards(cards, 0).map((card) => card.id)).toEqual([7, 33, 26]);
  });

  it("includes all five neighbours at the right edge without row wrapping", () => {
    const neighbours = getGrandTableauAdjacentCards(cards, 17).map((card) => card.id);
    expect(neighbours).toEqual([15, 18, 11, 34, 2]);
    expect(neighbours).not.toContain(19);
    expect(neighbours).not.toContain(3);
  });

  it("rejects invalid coordinates", () => {
    expect(getGrandTableauAdjacentCards(cards, -1)).toEqual([]);
    expect(getGrandTableauAdjacentCards(cards, 36)).toEqual([]);
    expect(getGrandTableauAdjacentCards(cards, 1.5)).toEqual([]);
  });
});

describe("regression: rendered output keeps the answer and reading sections", () => {
  it("renders the answer and reading as the Markdown sections saved readings use", () => {
    const answer = SimpleAnswerSchema.parse({ answer: "A short answer.", reading: "A short reading." });
    expect(renderSimpleAnswer(answer)).toBe("## Answer\nA short answer.\n\n## Reading\nA short reading.");
  });
});
