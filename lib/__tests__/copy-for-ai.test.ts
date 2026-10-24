import { describe, expect, it } from "vitest";
import { buildCopyForAIText } from "@/lib/copy-for-ai";
import { buildLenormandContext } from "@/lib/lenormand-context";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { getDefinition } from "@/lib/spread-definitions";
import type { RawDrawnCard } from "@/lib/lenormand-context";

const drawn = (n: number, offset = 0): RawDrawnCard[] =>
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

describe("Copy for AI: complete, self-contained, from the shared context", () => {
  it.each(LAYOUTS)("%s: contains the question unchanged and the spread label", (spreadId, count) => {
    const text = buildCopyForAIText(spreadId, "Will my project advance?", drawn(count));
    expect(text).toContain("Will my project advance?");
    expect(text).toContain(`Spread: ${getDefinition(spreadId)!.label}`.split(" ")[0]);
  });

  it.each(LAYOUTS)("%s: lists every card in drawn order with its core meaning", (spreadId, count) => {
    const cards = drawn(count, 7);
    const text = buildCopyForAIText(spreadId, "Q", cards);
    // Each card's core meaning appears once, and the cards appear in drawn order in the facts.
    for (const card of cards) expect(text).toContain(`${nameOf(card.id)}: ${meaningOf(card.id)}`);
    // The drawn order is read from the first section of the facts: the cards listed in order.
    const facts = buildLenormandContext(spreadId, "Q", cards).facts;
    const orderLines = facts
      .split("\n")
      .filter((line) => /^(\d+\. |Row \d: )/.test(line));
    const flattened = orderLines.flatMap((line) =>
      line
        .replace(/^\d+\. /, "")
        .replace(/^Row \d: /, "")
        .split(" | ")
        .map((entry) => entry.replace(/ \[card \d+\].*$/, "").trim()),
    );
    const expected = cards.map((card) => nameOf(card.id));
    expect(flattened.slice(0, expected.length)).toEqual(expected);
  });

  it.each(LAYOUTS)("%s: is the same facts and instructions as the DeepSeek context", (spreadId, count) => {
    const cards = drawn(count, 2);
    const text = buildCopyForAIText(spreadId, "Q", cards);
    const shared = buildLenormandContext(spreadId, "Q", cards);
    expect(text).toContain(shared.instructions);
    expect(text).toContain(shared.facts);
  });

  it("opens with a self-contained explanation that needs no access to the app", () => {
    const text = buildCopyForAIText("sentence-3", "Q", drawn(3));
    expect(text.startsWith("The text below is a complete Lenormand reading context in three sections")).toBe(true);
    expect(text).toContain("## Instructions");
    expect(text).toContain("## Reading facts");
  });

  it("keeps the question exactly as typed, including punctuation and accents", () => {
    const question = "Zal mijn project lukken? Hoe “zit” het—écht?";
    expect(buildCopyForAIText("sentence-3", question, drawn(3))).toContain(question);
  });

  it("invents no combination meaning and no outcome of its own", () => {
    const text = buildCopyForAIText("sentence-5", "Q", drawn(5));
    expect(text).not.toMatch(/combination(s)? (means|suggests|reveals|shows)/i);
    expect(text).toContain("Weigh the strongest supporting and contradicting combinations");
  });

  it("contains the balanced-weighing instruction from the shared context", () => {
    expect(buildCopyForAIText("sentence-3", "Q", drawn(3))).toContain(
      "Weigh the strongest supporting and contradicting combinations",
    );
  });
});

describe("Copy for AI: Grand Tableau geometry and houses", () => {
  it("lists every house: position N shows the card with deck number N", () => {
    const cards = drawn(36);
    const text = buildCopyForAIText("grand-tableau", "Q", cards);
    for (let n = 1; n <= 36; n++) {
      const house = CARD_CATALOG.find((c) => c.id === n)!.name;
      expect(text).toContain(`${n}: ${nameOf(cards[n - 1].id)} — ${house} house`);
    }
  });

  it("names the Woman and Man significators at their drawn positions", () => {
    const cards: RawDrawnCard[] = Array.from({ length: 36 }, (_, i) => ({ id: i + 1, position: i }));
    const text = buildCopyForAIText("grand-tableau", "Q", cards);
    expect(text).toContain("Woman (significator) is at position 29, row 4, column 2;");
    expect(text).toContain("Man (significator) is at position 28, row 4, column 1;");
  });

  it("has four rows of nine with no wrap between rows", () => {
    const cards = drawn(36);
    const text = buildCopyForAIText("grand-tableau", "Q", cards);
    const row1 = text.split("\n").find((line) => line.startsWith("Row 1: "))!;
    expect(row1.split(" | ")).toHaveLength(9);
    const row2 = text.split("\n").find((line) => line.startsWith("Row 2: "))!;
    expect(row2.startsWith(`Row 2: ${nameOf(cards[9].id)} | `)).toBe(true);
  });
});
