import { describe, expect, it } from "vitest";
import { buildCopyForAIText } from "@/lib/copy-for-ai";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { getDefinition } from "@/lib/spread-definitions";
import type { ReadingCard } from "@/lib/types";

const drawn = (n: number, offset = 0): ReadingCard[] =>
  Array.from({ length: n }, (_, i) => ({ id: CARD_CATALOG[(i + offset) % 36].id, position: i }));
const nameOf = (id: number) => CARD_CATALOG.find((c) => c.id === id)!.name;
const meaningOf = (id: number) => CARD_CATALOG.find((c) => c.id === id)!.meaning.general;

const LAYOUTS = [
  ["single-card", 1],
  ["sentence-3", 3],
  ["sentence-5", 5],
  ["comprehensive", 9],
  ["grand-tableau", 36],
] as const;

describe("Copy for AI: self-contained text for every layout", () => {
  it.each(LAYOUTS)("%s: includes the question unchanged, spread label and every card in order", (spreadId, count) => {
    const cards = drawn(count, 3);
    const text = buildCopyForAIText(spreadId, "Will my project advance?", cards);
    expect(text).toContain("Question: Will my project advance?");
    expect(text).toContain(`Spread: ${getDefinition(spreadId)!.label} (${count} cards)`);
    cards.forEach((card, index) => {
      expect(text).toContain(`${index + 1}. ${nameOf(card.id)}`);
    });
  });

  it.each(LAYOUTS)("%s: lists cards in exact drawn order", (spreadId, count) => {
    const cards = drawn(count, 7);
    const text = buildCopyForAIText(spreadId, "Q", cards);
    const positions = cards.map((card, index) => text.indexOf(`${index + 1}. ${nameOf(card.id)}`));
    positions.forEach((at) => expect(at).toBeGreaterThan(-1));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it.each(LAYOUTS)("%s: uses the canonical core meaning from the catalogue, verbatim", (spreadId, count) => {
    const cards = drawn(count);
    const text = buildCopyForAIText(spreadId, "Q", cards);
    for (const card of cards) {
      expect(text).toContain(`${nameOf(card.id)} — ${meaningOf(card.id)}`);
    }
  });
});

describe("Copy for AI: geometry per layout", () => {
  it("1 card: a single-card line and no grid", () => {
    const text = buildCopyForAIText("single-card", "Q", drawn(1));
    expect(text).toContain("Single card, read directly in relation to the question.");
    expect(text).not.toContain("Row 1:");
  });

  it("3 and 5 cards: a line read in drawn order", () => {
    expect(buildCopyForAIText("sentence-3", "Q", drawn(3))).toContain("Line of 3 cards");
    expect(buildCopyForAIText("sentence-5", "Q", drawn(5))).toContain("Line of 5 cards");
  });

  it("9 cards: centre at row 2, column 2, plus rows, columns and diagonals", () => {
    const cards = drawn(9);
    const text = buildCopyForAIText("comprehensive", "Q", cards);
    expect(text).toContain(`Centre (row 2, column 2): ${nameOf(cards[4].id)}.`);
    expect(text).toContain(`Row 1: ${nameOf(cards[0].id)} | ${nameOf(cards[1].id)} | ${nameOf(cards[2].id)}`);
    expect(text).toMatch(/Diagonal \(top-left to bottom-right\)/);
  });

  it("36 cards: four rows of nine, with no wrap between rows", () => {
    const cards = drawn(36);
    const text = buildCopyForAIText("grand-tableau", "Q", cards);
    const row1 = `Row 1: ${cards.slice(0, 9).map((c) => nameOf(c.id)).join(" | ")}`;
    expect(text).toContain(row1);
    const row1Line = text.split("\n").find((line) => line.startsWith("Row 1: "))!;
    expect(row1Line.split(" | ")).toHaveLength(9);
    const row2Line = text.split("\n").find((line) => line.startsWith("Row 2: "))!;
    expect(row2Line.startsWith(`Row 2: ${nameOf(cards[9].id)} | `)).toBe(true);
  });
});

describe("Copy for AI: Grand Tableau houses and significators", () => {
  it("lists every house: position N shows the card with deck number N", () => {
    const cards = drawn(36);
    const text = buildCopyForAIText("grand-tableau", "Q", cards);
    expect(text).toContain("Grand Tableau houses");
    for (let n = 1; n <= 36; n++) {
      const house = CARD_CATALOG.find((c) => c.id === n)!.name;
      expect(text).toContain(`${n}: ${nameOf(cards[n - 1].id)} — ${house} house`);
    }
  });

  it("names the Woman and Man significators at their drawn positions", () => {
    const cards: ReadingCard[] = Array.from({ length: 36 }, (_, i) => ({ id: i + 1, position: i }));
    const text = buildCopyForAIText("grand-tableau", "Q", cards);
    expect(text).toContain("Woman (significator) is at position 29.");
    expect(text).toContain("Man (significator) is at position 28.");
  });

  it("omits the house list for non-Grand-Tableau layouts", () => {
    for (const [spreadId, count] of LAYOUTS.slice(0, 4)) {
      expect(buildCopyForAIText(spreadId, "Q", drawn(count))).not.toContain("Grand Tableau houses");
    }
  });
});

describe("Copy for AI: content rules", () => {
  it("keeps the question exactly as typed, including punctuation and accents", () => {
    const question = "Zal mijn project lukken? Hoe “zit” het—écht?";
    expect(buildCopyForAIText("sentence-3", question, drawn(3))).toContain(`Question: ${question}`);
  });

  it("invents no combination meaning: the text only quotes the catalogue", () => {
    const text = buildCopyForAIText("sentence-5", "Q", drawn(5));
    expect(text).not.toMatch(/combination(s)? (means|suggests|reveals|shows)/i);
  });

  it("contains the English instruction for a traditional reading", () => {
    const text = buildCopyForAIText("sentence-3", "Q", drawn(3));
    expect(text.startsWith("Please give a traditional Lenormand interpretation")).toBe(true);
  });
});
