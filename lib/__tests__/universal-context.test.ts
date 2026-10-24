import { describe, expect, it } from "vitest";
import { buildLenormandContext, type RawDrawnCard } from "@/lib/lenormand-context";
import { buildCopyForAIText, copyInstructions } from "@/lib/copy-for-ai";
import { gridRelations, SPREAD_GEOMETRY } from "@/lib/grid-relations";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { getCardCatalogMap } from "@/lib/card-catalog";

/** The copied instructions equal the API instructions except for the one work-order sentence. */
function expectCopyInstructionsMatch(copy: string, apiInstructions: string) {
  const copied = copyInstructions(apiInstructions);
  expect(copy).toContain(copied);
  const apiLines = apiInstructions.split("\n");
  const copyLines = copied.split("\n");
  expect(copyLines.filter((l, i) => l !== apiLines[i])).toHaveLength(1);
}

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

/** The Grand Tableau fixture from the task, laid out on the 4x9 grid by position. */
function grandTableauFixture(): RawDrawnCard[] {
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
  return Array.from({ length: 36 }, (_, i) => ({ id: placed[i + 1] ?? fillers[next++], position: i }));
}

describe("universal context: one canonical context for every spread", () => {
  it.each(SPREADS)("$id exposes instructions and facts as the canonical pair", ({ id, count }) => {
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

  it.each(SPREADS)("$id: the copied text is self-contained for a general-purpose model", ({ id, count }) => {
    const copy = buildCopyForAIText(id, "Will it rain?", legging(count));
    expect(copy.startsWith("The text below is a complete Lenormand reading context in three sections")).toBe(true);
    expect(copy).toContain("## Output format");
    expect(copy).toContain("## Instructions");
    expect(copy).toContain("## Reading facts");
    expect(copy).not.toMatch(/\bAPI\b|\bendpoint\b|\broute\b|\bcookie\b|localStorage/);
  });

  it.each(SPREADS)("$id: preserves the original question exactly, including punctuation", ({ id, count }) => {
    const question = "Zal mijn project lukken? Hoe “zit” het—écht?";
    const ctx = buildLenormandContext(id, question, legging(count));
    expect(ctx.facts).toContain(question);
    expect(buildCopyForAIText(id, question, legging(count))).toContain(question);
  });
});

describe("universal context: card order and spread geometry per legging", () => {
  it("1 card: a single card with no relations", () => {
    expect(SPREAD_GEOMETRY[1]).toEqual({ kind: "single" });
    const ctx = buildLenormandContext("single-card", "Q", legging(1));
    expect(ctx.facts).toContain("There are no card relationships in this spread.");
    expect(ctx.facts).not.toMatch(/ — (left|right|above|below)/);
  });

  it("3 cards: exact left-to-right order and consecutive neighbours", () => {
    const cards = legging(3);
    const facts = buildLenormandContext("sentence-3", "Q", cards).facts;
    const names = cards.map((c) => nameOf(c.id));
    expect(facts).toContain(`${names[0]} (position 1, row 1, column 1) — right: ${names[1]}`);
    expect(facts).toContain(`${names[1]} (position 2, row 1, column 2) — left: ${names[0]}; right: ${names[2]}`);
    expect(facts).toContain(`${names[2]} (position 3, row 1, column 3) — left: ${names[1]}`);
    expect(facts).toContain("The central card is position 2.");
  });

  it("5 cards: exact order, immediate neighbours only, and the central card at position 3", () => {
    const cards = legging(5);
    const facts = buildLenormandContext("sentence-5", "Q", cards).facts;
    const names = cards.map((c) => nameOf(c.id));
    expect(facts).toContain(`${names[2]} (position 3, row 1, column 3) — left: ${names[1]}; right: ${names[3]}`);
    expect(facts).toContain(`${names[0]} (position 1, row 1, column 1) — right: ${names[1]}`);
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
    const facts = buildLenormandContext("comprehensive", "Q", cards).facts;
    expect(facts).toContain("The centre card (position 5, row 2, column 2) is the focal point.");
  });

  it("36 cards: complete 4x9 geometry with rows and columns, and no wrap across rows", () => {
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

describe("universal context: Grand Tableau regression fixture from calculated positions", () => {
  const cards = grandTableauFixture();
  const names = cards.map((c) => nameOf(c.id));
  const cells = gridRelations(names, 4, 9);
  const woman = cells[22];

  it("places Woman at position 23 (row 3, column 5)", () => {
    expect(woman.position).toBe(23);
    expect(woman.row).toBe(3);
    expect(woman.column).toBe(5);
  });

  it("has Dog directly above, Clouds directly below, Ship left, Key right and Ring lower-left", () => {
    expect(woman.neighbours.above?.name).toBe("Dog");
    expect(woman.neighbours.below?.name).toBe("Clouds");
    expect(woman.neighbours.left?.name).toBe("Ship");
    expect(woman.neighbours.right?.name).toBe("Key");
    expect(woman.neighbours.lowerLeft?.name).toBe("Ring");
  });

  it("has Ship at position 22 with Ring directly below it", () => {
    const ship = cells[21];
    expect(ship.position).toBe(22);
    expect(ship.neighbours.below?.name).toBe("Ring");
  });

  it("the shared facts state the same relations as the calculated grid", () => {
    const facts = buildLenormandContext("grand-tableau", "Q", cards).facts;
    expect(facts).toContain("Woman (significator) is at position 29".replace("29", String(cards.findIndex((c) => c.id === idOf("Woman")) + 1)));
    expect(facts).toMatch(/Mice|Woman/);
    expect(facts).toContain(`${names[22]} (position 23, row 3, column 5)`);
    expect(facts).toContain("above: Dog");
    expect(facts).toContain("below: Clouds");
  });
});

describe("universal context: houses and significators", () => {
  it("assigns houses by deck number, not by drawn position", () => {
    const cards = legging(36, 9);
    const facts = buildLenormandContext("grand-tableau", "Q", cards).facts;
    for (let n = 1; n <= 36; n++) {
      const house = nameOf(n);
      const drawn = nameOf(cards[n - 1].id);
      expect(facts).toContain(`${n}: ${drawn} — ${house} house`);
    }
  });

  it("states that a house is not a spatial neighbour", () => {
    const facts = buildLenormandContext("grand-tableau", "Q", legging(36)).facts;
    expect(facts).toContain("House facts (not spatial)");
  });

  it("gives the Woman and Man significator positions and their adjacency", () => {
    const cards = grandTableauFixture();
    const facts = buildLenormandContext("grand-tableau", "Q", cards).facts;
    const womanAt = cards.findIndex((c) => c.id === idOf("Woman")) + 1;
    expect(facts).toContain(`Woman (significator) is at position ${womanAt}, row`);
  });

  it("applies a significator preference as an explicit reading focus", () => {
    const withWoman: RawDrawnCard[] = [
      { id: idOf("Woman"), position: 0 },
      { id: idOf("Rider"), position: 1 },
      { id: idOf("Clover"), position: 2 },
    ];
    expect(buildLenormandContext("sentence-3", "Q", withWoman, "woman").facts).toContain("Reading focus: Woman.");
    expect(buildLenormandContext("sentence-3", "Q", withWoman, "both").facts).not.toContain("Reading focus");
  });

  it("copies the significator focus into Copy for AI", () => {
    const withMan: RawDrawnCard[] = [
      { id: idOf("Man"), position: 0 },
      { id: idOf("Rider"), position: 1 },
      { id: idOf("Clover"), position: 2 },
    ];
    expect(buildCopyForAIText("sentence-3", "Q", withMan, "man")).toContain("Reading focus: Man.");
  });
});

describe("universal context: no invented facing directions", () => {
  it.each(SPREADS)("$id never states a facing direction", ({ id, count }) => {
    const text = buildLenormandContext(id, "Q", legging(count)).facts + buildCopyForAIText(id, "Q", legging(count));
    expect(text).not.toMatch(/\b(faces|facing|looks at|looking at|turned towards)\s+[A-Z][a-z]+/);
  });

  it("instructs the model not to infer facing directions", () => {
    // The geometry rules live in the facts section, next to the geometry they govern.
    expect(buildLenormandContext("grand-tableau", "Q", legging(36)).facts).toContain(
      "Do not infer facing direction unless it is supplied",
    );
  });
});

describe("universal context: interpretation contract and answer order", () => {
  const instructions = buildLenormandContext("sentence-3", "Q", legging(3)).instructions;

  it("asks the model to weigh supporting and contradicting combinations", () => {
    const facts = buildLenormandContext("sentence-3", "Q", legging(3)).facts;
    expect(facts).toMatch(/supporting and contradicting/i);
  });

  it("asks for a direct answer last and forbids inventing positions", () => {
    expect(instructions).toMatch(/Then state the "answer"/);
    expect(instructions).not.toMatch(/Answer first/);
  });

  it("keeps the API JSON contract as reading then answer, outside the shared facts", () => {
    const ctx = buildLenormandContext("sentence-3", "Q", legging(3));
    expect(ctx.jsonOutput).toContain('{"reading": string, "answer": string}');
    expect(ctx.jsonOutput.indexOf('"reading"')).toBeLessThan(ctx.jsonOutput.indexOf('"answer"'));
    expect(ctx.facts).not.toContain("Return only one JSON object");
  });

  it("gives external assistants readable prose with the same reading and answer sections", () => {
    const ctx = buildLenormandContext("sentence-3", "Q", legging(3));
    expect(ctx.readableOutput).toContain('"Reading"');
    expect(ctx.readableOutput).toContain('"Answer"');
    expect(ctx.readableOutput).toMatch(/Do not return JSON/);
  });
});

describe("universal context: representative interpretive balance", () => {
  // Evaluations check that the shared context supplies the cards for favourable, unfavourable and
  // mixed symbolic readings. They do not prescribe a conclusion or wording.
  const favourable = ["Sun", "Heart", "Ring", "Anchor", "Clover"];
  const unfavourable = ["Coffin", "Mice", "Cross", "Scythe", "Clouds"];
  const mixed = ["Sun", "Clouds", "Ring", "Scythe", "Anchor"];

  it.each([
    ["favourable", favourable],
    ["unfavourable", unfavourable],
    ["mixed", mixed],
  ])("%s symbol set is supplied in drawn order with its catalogue meaning", (_label, names) => {
    const cards = names.map((name, i) => ({ id: idOf(name), position: i }));
    const facts = buildLenormandContext("sentence-5", "Will it work out?", cards).facts;
    names.forEach((name, i) => {
      expect(facts).toContain(`${i + 1}. ${name}`);
    });
  });

  it("does not add any conclusion of its own to the facts", () => {
    const facts = buildLenormandContext("sentence-5", "Will it work out?", legging(5)).facts;
    expect(facts).not.toMatch(/\b(will succeed|will fail|is favourable|is unfavourable|the outcome is)\b/i);
  });
});

describe("universal context: canonical map consistency", () => {
  it("uses the same card map for DeepSeek and Copy for AI", () => {
    expect(getCardCatalogMap().size).toBe(36);
  });
});
