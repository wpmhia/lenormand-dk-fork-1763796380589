import { describe, expect, it } from "vitest";
import { buildLenormandContext, type RawDrawnCard } from "@/lib/lenormand-context";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT, getTokenBudget } from "@/lib/prompt-builder";
import { buildCopyForAIText, copyInstructions } from "@/lib/copy-for-ai";
import { gridRelations, SPREAD_GEOMETRY } from "@/lib/grid-relations";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/**
 * One canonical prompt context: card data, geometry, question and instructions reach both the
 * API path and Copy for AI identically. These tests check what is transferred, not the wording
 * of the interpretation instructions.
 */

type SpreadId = "single-card" | "sentence-3" | "sentence-5" | "comprehensive" | "grand-tableau";

const SPREADS: { id: SpreadId; count: number; key: keyof typeof SPREAD_GEOMETRY }[] = [
  { id: "single-card", count: 1, key: 1 },
  { id: "sentence-3", count: 3, key: 3 },
  { id: "sentence-5", count: 5, key: 5 },
  { id: "comprehensive", count: 9, key: 9 },
  { id: "grand-tableau", count: 36, key: 36 },
];

const idOf = (name: string) => CARD_CATALOG.find((c) => c.name === name)!.id;
const nameOf = (id: number) => CARD_CATALOG.find((c) => c.id === id)!.name;

/** A valid legging of `count` distinct cards in a fixed catalogue order, offset to vary the cards. */
function legging(count: number, offset = 0): RawDrawnCard[] {
  return Array.from({ length: count }, (_, i) => ({ id: CARD_CATALOG[(i + offset) % 36].id, position: i }));
}

/** The copied instructions equal the API instructions except for the one work-order sentence. */
function expectCopyInstructionsMatch(copy: string, apiInstructions: string) {
  const copied = copyInstructions(apiInstructions);
  expect(copy).toContain(copied);
  const apiLines = apiInstructions.split("\n");
  const copyLines = copied.split("\n");
  expect(copyLines.filter((l, i) => l !== apiLines[i])).toHaveLength(1);
}

describe("canonical context: both paths receive the same self-contained prompt", () => {
  it.each(SPREADS)("$id exposes instructions and facts as a non-empty canonical pair", ({ id, count }) => {
    const ctx = buildLenormandContext(id, "Will it rain?", legging(count));
    expect(typeof ctx.instructions).toBe("string");
    expect(typeof ctx.facts).toBe("string");
    expect(ctx.instructions.length).toBeGreaterThan(200);
    expect(ctx.facts.length).toBeGreaterThan(50);
  });

  it.each(SPREADS)("$id: DeepSeek and Copy for AI receive identical facts and instructions", ({ id, count }) => {
    const cards = legging(count, 4);
    const ctx = buildLenormandContext(id, "Will it rain?", cards);
    const copy = buildCopyForAIText(id, "Will it rain?", cards);
    expectCopyInstructionsMatch(copy, ctx.instructions);
    expect(copy).toContain(ctx.facts);
  });

  it.each(SPREADS)("$id: the copied text is self-contained and keeps the exact question", ({ id, count }) => {
    const question = "Zal mijn project lukken? Hoe “zit” het—écht?";
    const copy = buildCopyForAIText(id, question, legging(count));
    expect(copy.startsWith("LENORMAND INTELLIGENCE\n")).toBe(true);
    expect(copy).toContain("The text below is a complete Lenormand reading context in three sections");
    expect(copy).toContain("## Instructions");
    expect(copy).toContain("## Reading facts");
    expect(copy).toContain("## Output format");
    expect(copy).toContain(question);
    expect(copy).not.toMatch(/\bAPI\b|\bendpoint\b|\broute\b|\bcookie\b|localStorage/);
  });

  it("the copied work order is plain prose: copyInstructions changes exactly one line and fails loudly when it is missing", () => {
    const changed = copyInstructions(SIMPLE_LENORMAND_SYSTEM_PROMPT);
    expect(changed.split("\n")).toHaveLength(SIMPLE_LENORMAND_SYSTEM_PROMPT.split("\n").length);
    expect(() => copyInstructions("no work order here")).toThrow(/work-order/);
  });
});

describe("canonical context: spread geometry per legging", () => {
  it("1 card: no card relationships; 3 and 5 cards: exact left-to-right neighbour lines", () => {
    expect(SPREAD_GEOMETRY[1]).toEqual({ kind: "single" });
    expect(buildLenormandContext("single-card", "Q", legging(1)).facts).toContain(
      "There are no card relationships in this spread.",
    );
    const three = legging(3).map((c) => nameOf(c.id));
    const facts3 = buildLenormandContext("sentence-3", "Q", legging(3)).facts;
    expect(facts3).toContain(`${three[1]} (position 2, row 1, column 2) — left: ${three[0]}; right: ${three[2]}`);
    expect(facts3).toContain("The central card is position 2.");
  });

  it("5 cards: the central card is position 3 and no vertical relations exist", () => {
    const names = legging(5).map((c) => nameOf(c.id));
    const facts = buildLenormandContext("sentence-5", "Q", legging(5)).facts;
    expect(facts).toContain(`${names[2]} (position 3, row 1, column 3) — left: ${names[1]}; right: ${names[3]}`);
    expect(facts).not.toMatch(/(upperLeft|lowerRight|above|below):/);
    expect(facts).toContain("The central card is position 3.");
  });

  it("9 cards: complete 3x3 geometry with the centre at row 2, column 2", () => {
    const cards = legging(9);
    const names = cards.map((c) => nameOf(c.id));
    const cells = gridRelations(names, 3, 3);
    const centre = cells[4];
    expect(centre.row).toBe(2);
    expect(centre.column).toBe(2);
    expect(Object.keys(centre.neighbours).sort()).toEqual(
      ["above", "below", "left", "lowerLeft", "lowerRight", "right", "upperLeft", "upperRight"],
    );
    expect(Object.keys(cells[0].neighbours).sort()).toEqual(["below", "lowerRight", "right"]);
    expect(buildLenormandContext("comprehensive", "Q", cards).facts).toContain(
      "The centre card (position 5, row 2, column 2) is the focal point.",
    );
  });

  it("36 cards: complete 4x9 geometry with rows, columns and no wrap across rows", () => {
    const cards = legging(36);
    const names = cards.map((c) => nameOf(c.id));
    const cells = gridRelations(names, 4, 9);
    expect(cells[8].neighbours.right).toBeUndefined();
    expect(cells[9].neighbours.left).toBeUndefined();
    expect(Object.keys(cells[35].neighbours).sort()).toEqual(["above", "left", "upperLeft"]);
    const facts = buildLenormandContext("grand-tableau", "Q", cards).facts;
    expect(facts).toContain(`Row 1: ${names.slice(0, 9).join(" | ")}`);
    expect(facts).toContain(`Row 4: ${names.slice(27, 36).join(" | ")}`);
  });
});

describe("canonical context: Grand Tableau regression fixture", () => {
  const placed: Record<number, number> = {
    23: idOf("Woman"),
    14: idOf("Dog"),
    32: idOf("Clouds"),
    31: idOf("Ring"),
    22: idOf("Ship"),
    24: idOf("Key"),
  };
  const used = new Set(Object.values(placed));
  const fillers = CARD_CATALOG.map((c) => c.id).filter((id) => !used.has(id));
  let next = 0;
  const cards: RawDrawnCard[] = Array.from({ length: 36 }, (_, i) => ({
    id: placed[i + 1] ?? fillers[next++],
    position: i,
  }));
  const cells = gridRelations(cards.map((c) => nameOf(c.id)), 4, 9);
  const woman = cells[22];

  it("places Woman at position 23 (row 3, column 5) with its real neighbours, and the facts state them", () => {
    expect(woman.position).toBe(23);
    expect(woman.row).toBe(3);
    expect(woman.column).toBe(5);
    expect(woman.neighbours.above?.name).toBe("Dog");
    expect(woman.neighbours.below?.name).toBe("Clouds");
    expect(woman.neighbours.left?.name).toBe("Ship");
    expect(woman.neighbours.right?.name).toBe("Key");
    expect(woman.neighbours.lowerLeft?.name).toBe("Ring");
    const facts = buildLenormandContext("grand-tableau", "Q", cards).facts;
    expect(facts).toContain(`${nameOf(cards[22].id)} (position 23, row 3, column 5)`);
    expect(facts).toMatch(/Woman \(position 23, row 3, column 5\) — .*above: Dog/);
  });

  it("assigns houses by deck number, not by drawn position, and never calls a house a neighbour", () => {
    const cards = legging(36, 9);
    const facts = buildLenormandContext("grand-tableau", "Q", cards).facts;
    for (let n = 1; n <= 36; n++) {
      expect(facts).toContain(`${n}: ${nameOf(cards[n - 1].id)} — ${nameOf(n)} house`);
    }
    expect(facts).toContain("House facts (not spatial)");
  });
});

describe("canonical context: significators and output contracts", () => {
  it("applies a significator preference as an explicit reading focus and copies it", () => {
    const withWoman: RawDrawnCard[] = [
      { id: idOf("Woman"), position: 0 },
      { id: idOf("Rider"), position: 1 },
      { id: idOf("Clover"), position: 2 },
    ];
    const withMan: RawDrawnCard[] = [
      { id: idOf("Man"), position: 0 },
      { id: idOf("Rider"), position: 1 },
      { id: idOf("Clover"), position: 2 },
    ];
    expect(buildLenormandContext("sentence-3", "Q", withWoman, "woman").facts).toContain("Reading focus: Woman.");
    expect(buildLenormandContext("sentence-3", "Q", withWoman, "both").facts).not.toContain("Reading focus");
    expect(buildCopyForAIText("sentence-3", "Q", withMan, "man")).toContain("Reading focus: Man.");
  });

  it("never states a facing direction and instructs the model not to infer one", () => {
    const text = buildLenormandContext("grand-tableau", "Q", legging(36)).facts
      + buildCopyForAIText("grand-tableau", "Q", legging(36));
    expect(text).not.toMatch(/\b(faces|facing|looks at|looking at|turned towards)\s+[A-Z][a-z]+/);
    expect(text).toContain("Do not infer facing direction unless it is supplied");
  });

  it("keeps the JSON contract outside the shared facts, with reading before answer, and readable prose for assistants", () => {
    const ctx = buildLenormandContext("sentence-3", "Q", legging(3));
    expect(ctx.jsonOutput).toContain('{"reading": string, "answer": string}');
    expect(ctx.jsonOutput.indexOf('"reading"')).toBeLessThan(ctx.jsonOutput.indexOf('"answer"'));
    expect(ctx.facts).not.toContain("Return only one JSON object");
    expect(ctx.readableOutput).toContain('"Reading"');
    expect(ctx.readableOutput).toContain('"Answer"');
    expect(ctx.readableOutput).toMatch(/Do not return JSON/);
  });

  it("supplies favourable, unfavourable and mixed symbol sets in drawn order and adds no conclusion of its own", () => {
    const sets = [
      ["Sun", "Heart", "Ring", "Anchor", "Clover"],
      ["Coffin", "Mice", "Cross", "Scythe", "Clouds"],
      ["Sun", "Clouds", "Ring", "Scythe", "Anchor"],
    ];
    for (const names of sets) {
      const cards = names.map((name, i) => ({ id: idOf(name), position: i }));
      const facts = buildLenormandContext("sentence-5", "Will it work out?", cards).facts;
      names.forEach((name, i) => expect(facts).toContain(`${i + 1}. ${name}`));
    }
    expect(buildLenormandContext("sentence-5", "Will it work out?", legging(5)).facts).not.toMatch(
      /\b(will succeed|will fail|is favourable|is unfavourable|the outcome is)\b/i,
    );
  });

  it("uses the same 36-card map for both paths", () => {
    expect(getCardCatalogMap().size).toBe(36);
  });
});

describe("prompt handoff: every drawn card reaches the model in draw order", () => {
  const cardsMap = getCardCatalogMap();
  const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);
  const COUNT: Record<SpreadId, number> = {
    "single-card": 1,
    "sentence-3": 3,
    "sentence-5": 5,
    comprehensive: 9,
    "grand-tableau": 36,
  };

  function draw(count: number, offset = 0) {
    return Array.from({ length: count }, (_, i) => {
      const card = deck[(i + offset) % deck.length];
      return { id: card.id, name: card.name, keywords: card.keywords, coreMeaning: card.meaning.general };
    });
  }

  it.each(Object.entries(COUNT) as [SpreadId, number][])("%s supplies every card in order", (id, count) => {
    const cards = draw(count, 13);
    const text = buildSimpleReadingPrompt(buildReadingContext(id, "Q?", cards, cardsMap));
    if (count === 9 || count === 36) {
      const size = count === 9 ? 3 : 9;
      const rows = count === 9 ? 3 : 4;
      for (let row = 0; row < rows; row++) {
        const names = cards.slice(row * size, row * size + size).map((card) => card.name);
        expect(text, `${id} row ${row + 1}`).toContain(`Row ${row + 1}: ${names.join(" | ")}`);
      }
      return;
    }
    let cursor = -1;
    for (const [index, card] of cards.entries()) {
      const at = text.indexOf(`${index + 1}. ${card.name}`, cursor + 1);
      expect(at, `${id}: card ${index + 1} must follow card ${index}`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("supplies the classical core meaning and secondary meanings of each drawn card", () => {
    const cards = draw(3, 0).map((card, index) =>
      index === 0 ? { ...card, secondaryMeanings: ["Context-specific secondary sense."] } : card,
    );
    const text = buildSimpleReadingPrompt(buildReadingContext("sentence-3", "Q?", cards, cardsMap));
    for (const card of cards) expect(text).toContain(`${card.name}: ${card.coreMeaning}`);
    expect(text).toContain("Secondary (context-dependent): Context-specific secondary sense.");
  });

  it("does not leak internal classification metadata into any prompt", () => {
    for (const [id, count] of Object.entries(COUNT) as [SpreadId, number][]) {
      const text = buildSimpleReadingPrompt(buildReadingContext(id, "Will the situation resolve?", draw(count, 13), cardsMap));
      expect(text, id).not.toMatch(/;\s*(STRONG|NEUTRAL|WEAK)\b/);
      expect(text, id).not.toMatch(/timing:/i);
    }
  });

  it("gives the largest spread the largest output budget and builds deterministically", () => {
    expect(getTokenBudget(36)).toBeGreaterThan(getTokenBudget(3));
    expect(getTokenBudget(1)).toBeLessThan(getTokenBudget(36));
    const cards = draw(36, 13);
    expect(
      buildSimpleReadingPrompt(buildReadingContext("grand-tableau", "Geometry?", cards, cardsMap)),
    ).toBe(buildSimpleReadingPrompt(buildReadingContext("grand-tableau", "Geometry?", cards, cardsMap)));
  });
});

describe("built prompt: interpretation-input guards", () => {
  const cardsMap = getCardCatalogMap();
  const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);
  const draw = (count: number) =>
    Array.from({ length: count }, (_, i) => {
      const card = deck[i];
      return { id: card.id, name: card.name, keywords: card.keywords, coreMeaning: card.meaning.general, position: i };
    });

  it("does not add a named person role to the user prompt when no significator is chosen", () => {
    const prompt = buildSimpleReadingPrompt(buildReadingContext("sentence-3", "Will Mahican and Willem reconcile?", draw(3), cardsMap));
    expect(prompt).not.toMatch(/Reading focus: (Man|Woman)/);
  });

  it("never emits a fixed period such as '6 to 9 months' in the built prompt", () => {
    const prompt = buildSimpleReadingPrompt(buildReadingContext("sentence-5", "When will it happen?", draw(5), cardsMap));
    expect(prompt).not.toMatch(/\b\d+\s*(?:-|–|to)\s*\d+\s*(?:months?|weeks?)\b/i);
  });
});
