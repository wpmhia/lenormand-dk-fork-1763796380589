import { describe, expect, it } from "vitest";
import { gridRelations, describeRelations } from "@/lib/grid-relations";
import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

const ids36 = Array.from({ length: 36 }, (_, i) => i + 1);
const named = (ids: number[]) => ids.map((id) => `C${id}`);

describe("grid relations: directions come from coordinates", () => {
  const rel = gridRelations(named(ids36), 4, 9);
  const cell = (position: number) => rel[position - 1];

  it("gives position 23 its row, column and all eight directions", () => {
    expect(cell(23).row).toBe(3);
    expect(cell(23).column).toBe(5);
    expect(cell(23).neighbours.left?.position).toBe(22);
    expect(cell(23).neighbours.right?.position).toBe(24);
    expect(cell(23).neighbours.above?.position).toBe(14);
    expect(cell(23).neighbours.below?.position).toBe(32);
    expect(cell(23).neighbours.upperLeft?.position).toBe(13);
    expect(cell(23).neighbours.upperRight?.position).toBe(15);
    expect(cell(23).neighbours.lowerLeft?.position).toBe(31);
    expect(cell(23).neighbours.lowerRight?.position).toBe(33);
  });

  it("never wraps from the end of one row to the start of the next", () => {
    expect(cell(9).neighbours.right).toBeUndefined();
    expect(cell(10).neighbours.left).toBeUndefined();
    expect(cell(9).neighbours.lowerRight).toBeUndefined();
    expect(cell(10).neighbours.upperLeft).toBeUndefined();
  });

  it("gives a corner card only its real neighbours", () => {
    expect(Object.keys(cell(1).neighbours).sort()).toEqual(["below", "lowerRight", "right"]);
    expect(Object.keys(cell(36).neighbours).sort()).toEqual(["above", "left", "upperLeft"]);
  });

  it("is symmetric: if A has B to its right, B has A to its left", () => {
    for (const a of rel) {
      const right = a.neighbours.right;
      if (right) expect(rel[right.position - 1].neighbours.left?.position).toBe(a.position);
      const below = a.neighbours.below;
      if (below) expect(rel[below.position - 1].neighbours.above?.position).toBe(a.position);
    }
  });

  it("places the card directly below another exactly one row down in the same column", () => {
    // The check is on coordinates only. Card names in the proposal's example depend on the drawn
    // order, so the relation is verified by position, never by name.
    const ship = cell(3);
    expect(ship.neighbours.below?.position).toBe(12);
    const belowShip = cell(12);
    expect(belowShip.row - ship.row).toBe(1);
    expect(belowShip.column).toBe(ship.column);
  });
});

describe("grid relations: text for the model", () => {
  it("describes each card with a literal line of its direct neighbours", () => {
    const lines = describeRelations(gridRelations(named(ids36), 4, 9), (p) => `C${p}`);
    expect(lines).toHaveLength(36);
    expect(lines[22]).toContain("C23 (position 23, row 3, column 5) — left: C22; right: C24");
  });

  it("uses a single literal word per direction", () => {
    const lines = describeRelations(gridRelations(named(ids36), 4, 9), (p) => `C${p}`);
    for (const line of lines) {
      expect(line).not.toMatch(/facing|opposite|towards|beside|near/i);
    }
  });
});

describe("prompt: literal geometry rule is in the user prompt, not the system prompt", () => {
  const cards = CARD_CATALOG.slice(0, 36).map((c, i) => ({ id: c.id, name: c.name, keywords: c.keywords, coreMeaning: c.meaning.general, position: i }));
  const prompt = buildSimpleReadingPrompt(buildReadingContext("grand-tableau", "Q", cards, getCardCatalogMap(), "both"));

  it("carries the instruction to interpret geometry literally", () => {
    expect(prompt).toContain("Interpret the supplied card geometry literally");
    expect(prompt).toContain("Never recalculate or invent positions, neighbours, directions or card relationships");
  });

  it("separates house facts from spatial relations", () => {
    expect(prompt).toContain("House facts (not spatial)");
    expect(prompt).toContain("a house is not a neighbour");
  });

  it("keeps the system prompt unchanged by this edit", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).not.toContain("Interpret the supplied card geometry literally");
  });

  it("keeps the JSON output contract at the end of the user prompt", () => {
    expect(prompt.trimEnd().endsWith('"answer" is the direct answer to the question in one or two sentences, drawn from that reading. Do not use Markdown fences.')).toBe(true);
  });
});
