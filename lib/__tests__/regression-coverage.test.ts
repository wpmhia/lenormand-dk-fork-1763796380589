import { describe, it, expect } from "vitest";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt } from "@/lib/prompt-builder";
import { SimpleAnswerSchema } from "@/lib/simple-answer";
import { renderSimpleAnswer } from "@/lib/simple-answer";
import { findInventedCards } from "@/lib/invented-cards";
import { findUnresolvedCardLabels } from "@/lib/invented-cards";

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, index) => {
    const card = deck[(index + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords };
  });
}

describe("regression: every spread size keeps a canonical input", () => {
  it("preserves drawn card order and naming for line spreads", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", draw(5, 7), cardsMap);
    expect(ctx.layout.type).toBe("linear-sentence");
    for (let index = 0; index < 5; index++) {
      expect(ctx.cards[index].id).toBe(((7 + index) % deck.length) + 1);
      expect(ctx.cards[index].name).toBe(deck[(7 + index) % deck.length].name);
    }
  });

  it("emits a 3x3 Petit Tableau with row 1 left-to-right, then top-to-bottom", () => {
    const ctx = buildReadingContext("comprehensive", "Full month?", draw(9, 2), cardsMap);
    expect(ctx.layout.type).toBe("petit-tableau");
    expect(ctx.cards).toHaveLength(9);
    // The centre is the fifth card (index 4), position 5 of the 9-card layout.
    expect((ctx.layout as { center: { index: number } }).center.index).toBe(4);
  });

  it("emits a 4x9 Grand Tableau with 36 houses in canonical order", () => {
    const ctx = buildReadingContext("grand-tableau", "Full picture?", draw(36, 13), cardsMap);
    expect(ctx.layout.type).toBe("grand-tableau");
    expect(ctx.cards).toHaveLength(36);
    if (ctx.layout.type !== "grand-tableau") throw new Error("layout mismatch");
    expect(ctx.layout.houses).toHaveLength(36);
    expect(ctx.layout.houses.map((house) => house.houseName)).toEqual(deck.map((card) => card.name));
  });
});

describe("regression: house occupancy matches the drawn card at that position", () => {
  it("puts the Rider card in the Rider house when drawn at position 1", () => {
    const ids = Array.from({ length: 36 }, (_, index) => index + 1);
    const ctx = buildReadingContext("grand-tableau", "Q?", draw(36), cardsMap);
    if (ctx.layout.type !== "grand-tableau") throw new Error("layout mismatch");
    // The house name follows the canonical deck order; the first position's occupant is the
    // first drawn card.
    expect(ctx.layout.houses[0].houseName).toBe(deck[0].name);
    expect(ctx.layout.houses[0].occupyingCard.name).toBe(deck[0].name);
    void ids;
  });
});

describe("regression: explicit person binding is preserved through the prompt", () => {
  it("shows the explicit-significator binding only when that card was drawn", () => {
    const manInDeck = deck.findIndex((card) => card.id === 28);
    const withMan = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Q?", draw(3, manInDeck), cardsMap, "man"),
    );
    expect(withMan).toContain("- Person binding Man: bound by explicit-significator");

    const withoutDrawnMan = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Q?", draw(3, 0), cardsMap, "man"),
    );
    expect(withoutDrawnMan).not.toContain("Person binding");
  });
});

describe("regression: validator still rejects fabricated cards and unknown names", () => {
  it("flags an undrawn card in patterns", () => {
    const ctx = buildReadingContext("sentence-3", "Will this progress?", draw(3, 0), cardsMap);
    const answer = SimpleAnswerSchema.parse({
      answer: "Yes.",
      reading: "Movement ahead.",
      patterns: [{ cards: ["Rider", "Scythe"], meaning: "Should drop" }],
      timing: null,
    });
    const matches = findInventedCards(answer, ctx.cards.map((card) => card.id)).filter((match) => match.field === "pattern");
    expect(matches.some((match) => match.name === "Scythe")).toBe(true);
  });

  it("flags an unknown canonical card name", () => {
    const answer = SimpleAnswerSchema.parse({
      answer: "Yes.",
      reading: "Reads.",
      patterns: [{ cards: ["Rider", "ImaginaryCard"], meaning: "x" }],
      timing: null,
    });
    expect(findUnresolvedCardLabels(answer)).toEqual([{ patternIndex: 0, label: "ImaginaryCard" }]);
  });

  it("treats ordinary prose as not a card reference", () => {
    const ctx = buildReadingContext("sentence-3", "Will this progress?", draw(3, 0), cardsMap);
    const answer = SimpleAnswerSchema.parse({
      answer: "Likely.",
      reading: "A man and a woman should discuss the key issue.",
      patterns: [],
      timing: null,
    });
    const proseMatches = findInventedCards(answer, ctx.cards.map((card) => card.id)).filter((match) => match.field !== "pattern");
    expect(proseMatches).toEqual([]);
  });
});

describe("regression: rendered output keeps the four-field contract", () => {
  it("renders every successful response into the documented shape", () => {
    const answer = SimpleAnswerSchema.parse({
      answer: "A short answer.",
      reading: "A short reading.",
      patterns: [{ cards: ["Rider", "Clover"], meaning: "A short interpretation." }],
      timing: null,
    });
    const rendered = renderSimpleAnswer(answer);
    expect(rendered).toContain("## Answer");
    expect(rendered).toContain("## Reading");
    expect(rendered).toContain("## Patterns");
    expect(rendered).not.toContain("## Prediction");
    expect(rendered).not.toContain("## Houses and mirrors");
  });

  it("omits Patterns and Timing sections when no patterns or timing are provided", () => {
    const answer = SimpleAnswerSchema.parse({
      answer: "Yes.",
      reading: "Yes.",
    });
    const rendered = renderSimpleAnswer(answer);
    expect(rendered).toContain("## Answer");
    expect(rendered).toContain("## Reading");
    expect(rendered).not.toContain("## Patterns");
    expect(rendered).not.toContain("## Timing");
  });
});