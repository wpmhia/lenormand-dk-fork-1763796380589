import { describe, expect, it } from "vitest";
import { buildLenormandContext, type RawDrawnCard } from "@/lib/lenormand-context";
import { buildCopyForAIText, copyInstructions } from "@/lib/copy-for-ai";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { gridRelations } from "@/lib/grid-relations";

/** The copied instructions equal the API instructions except for the one work-order sentence. */
function expectCopyInstructionsMatch(copy: string, apiInstructions: string) {
  const copied = copyInstructions(apiInstructions);
  expect(copy).toContain(copied);
  const apiLines = apiInstructions.split("\n");
  const copyLines = copied.split("\n");
  expect(copyLines.filter((l, i) => l !== apiLines[i])).toHaveLength(1);
}

const id = (name: string) => CARD_CATALOG.find((c) => c.name === name)!.id;

/**
 * A 36-card Grand Tableau layout that places the named cards on the 4x9 grid so the required
 * relations hold: Woman at position 23 (row 3, column 5), Dog directly above it, Clouds directly
 * below it, Ring diagonally below-left, and Ring directly below Ship (Ship at position 22).
 * Every other position is filled with a distinct catalogue card, so the layout is valid.
 */
function layout(): RawDrawnCard[] {
  const placed: Record<number, number> = {
    23: id("Woman"),
    14: id("Dog"),
    32: id("Clouds"),
    31: id("Ring"),
    22: id("Ship"),
  };
  const used = new Set(Object.values(placed));
  const fillers = CARD_CATALOG.map((c) => c.id).filter((cid) => !used.has(cid));
  let next = 0;
  const cards: RawDrawnCard[] = [];
  for (let position = 1; position <= 36; position++) {
    const cardId = placed[position] ?? fillers[next++];
    cards.push({ id: cardId, position: position - 1 });
  }
  return cards;
}

const cards = layout();
const relations = gridRelations(cards.map((c) => CARD_CATALOG.find((k) => k.id === c.id)!.name), 4, 9);
const cell = (position: number) => relations[position - 1];

describe("shared geometry: Grand Tableau regression layout", () => {
  it("places Woman at position 23, row 3, column 5", () => {
    expect(cards[22].id).toBe(id("Woman"));
    expect(cell(23).row).toBe(3);
    expect(cell(23).column).toBe(5);
  });

  it("has Dog directly above Woman", () => {
    expect(cell(23).neighbours.above?.name).toBe("Dog");
  });

  it("has Clouds directly below Woman", () => {
    expect(cell(23).neighbours.below?.name).toBe("Clouds");
  });

  it("has Ring diagonally below-left of Woman", () => {
    expect(cell(23).neighbours.lowerLeft?.name).toBe("Ring");
  });

  it("has Ring directly below Ship", () => {
    const ship = cell(22);
    expect(ship.neighbours.below?.name).toBe("Ring");
    expect(ship.neighbours.below?.position).toBe(31);
  });

  it("gives Woman no left neighbour beyond the grid's real cell", () => {
    expect(cell(23).neighbours.left?.position).toBe(22);
  });
});

describe("shared geometry: both paths receive the same geometry", () => {
  const ctx = buildLenormandContext("grand-tableau", "Will my project advance?", cards);
  const copy = buildCopyForAIText("grand-tableau", "Will my project advance?", cards);

  it("the DeepSeek facts carry the Woman relations explicitly", () => {
    expect(ctx.facts).toContain("Woman (position 23, row 3, column 5)");
    expect(ctx.facts).toMatch(/Woman \(position 23, row 3, column 5\) — .*above: Dog/);
    expect(ctx.facts).toMatch(/Woman \(position 23, row 3, column 5\) — .*below: Clouds/);
    expect(ctx.facts).toMatch(/Woman \(position 23, row 3, column 5\) — .*lowerLeft: Ring/);
  });

  it("Copy for AI carries exactly the same facts text as DeepSeek", () => {
    expect(copy).toContain(ctx.facts);
  });

  it("Copy for AI carries exactly the same instructions as DeepSeek", () => {
    expectCopyInstructionsMatch(copy, ctx.instructions);
  });

  it("the copied text is self-contained: it explains itself without the app", () => {
    expect(copy.startsWith("LENORMAND INTELLIGENCE\n")).toBe(true);
    expect(copy).toContain("The text below is a complete Lenormand reading context in three sections");
    expect(copy).toContain("## Instructions");
    expect(copy).toContain("## Reading facts");
  });

  it("the copied text asserts no facing direction for any card", () => {
    // The instruction forbids inferring facing; the test checks no card is described as facing another.
    expect(copy).not.toMatch(/\b(faces|facing|looks at|looking at|turned towards)\s+(Woman|Dog|Clouds|Ring|Ship|[A-Z][a-z]+)\b/);
    expect(copy).toContain("Do not infer facing direction unless it is supplied.");
  });
});
