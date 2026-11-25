import { describe, it, expect } from "vitest";
import { gridRelations, describeRelations } from "@/lib/grid-relations";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt } from "@/lib/prompt-builder";
import { getGrandTableauAdjacentCards } from "@/lib/data";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/** Correct spread geometry: coordinates, neighbours, houses and grid boundaries. */

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, coreMeaning: card.meaning.general };
  });
}

function drawIds(ids: number[]) {
  return ids.map((id) => {
    const card = cardsMap.get(id)!;
    return { id, name: card.name, keywords: card.keywords, coreMeaning: card.meaning.general };
  });
}

const ids36 = Array.from({ length: 36 }, (_, i) => i + 1);

describe("grid relations: directions come from coordinates", () => {
  const rel = gridRelations(ids36.map((id) => `C${id}`), 4, 9);
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
    expect(cell(3).neighbours.below?.position).toBe(12);
    const below = cell(12);
    expect(below.row - cell(3).row).toBe(1);
    expect(below.column).toBe(cell(3).column);
  });
});

describe("grid relations: the model-facing text is literal", () => {
  it("describes each card with one literal line of its direct neighbours", () => {
    const lines = describeRelations(gridRelations(ids36.map((id) => `C${id}`), 4, 9), (p) => `C${p}`);
    expect(lines).toHaveLength(36);
    expect(lines[22]).toContain("C23 (position 23, row 3, column 5) — left: C22; right: C24");
  });

  it("uses a single literal word per direction, never a facing claim", () => {
    const lines = describeRelations(gridRelations(ids36.map((id) => `C${id}`), 4, 9), (p) => `C${p}`);
    for (const line of lines) {
      expect(line).not.toMatch(/facing|opposite|towards|beside|near/i);
    }
  });
});

describe("Grand Tableau prompt geometry: 4x9 rows and houses", () => {
  const prompt = buildSimpleReadingPrompt(
    buildReadingContext("grand-tableau", "Full picture?", draw(36, 13), cardsMap),
  );

  it("prints four rows of nine cards", () => {
    const rows = prompt.split("\n").filter((line) => /^Row \d+: /.test(line));
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.split(": ")[1].split(" | ")).toHaveLength(9);
    }
  });

  it("lists all 36 houses: position N carries the card with deck number N, marked not spatial", () => {
    const houseLines = prompt.split("\n").filter((line) => /^\d+: .+ — .+ house$/.test(line));
    expect(houseLines).toHaveLength(36);
    expect(prompt).toContain("House facts (not spatial)");
    houseLines.forEach((line, index) => {
      const [, position, house] = line.match(/^(\d+): .+ — (.+) house$/)!;
      expect(Number(position)).toBe(index + 1);
      expect(house).toBe(deck[index].name);
    });
  });

  it("keeps a card in its drawn cell regardless of the house it occupies", () => {
    const cards = drawIds([22, 16, 2, 29, 15, 4, 23, 27, 9, 24, 19, 10, 7, 32, 33, 6, 3, 1, 13, 8, 21, 34, 20, 30, 5, 36, 25, 31, 11, 26, 35, 14, 12, 18, 17, 28]);
    const shuffled = buildSimpleReadingPrompt(buildReadingContext("grand-tableau", "Outlook?", cards, cardsMap, "both"));
    expect(shuffled).toContain("28: Sun — Man house");
  });

  it("reports the significator positions from the drawn order", () => {
    const womanAt = draw(36, 13).findIndex((card) => card.id === 29) + 1;
    expect(prompt).toContain(`Woman (significator) is at position ${womanAt}, row`);
  });
});

describe("Petit Tableau prompt geometry: 3x3 grid", () => {
  it("prints three rows of three and places the centre at row 2, column 2", () => {
    const cards = draw(9, 5);
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("comprehensive", "What will the month bring?", cards, cardsMap),
    );
    const rows = prompt.split("\n").filter((line) => /^Row \d+: /.test(line));
    expect(rows).toHaveLength(3);
    expect(prompt).toContain(`Row 2: ${cards[3].name} | ${cards[4].name} | ${cards[5].name}`);
  });
});

describe("Linear spreads: drawn order", () => {
  it.each([
    ["single-card", 1],
    ["sentence-3", 3],
    ["sentence-5", 5],
  ] as const)("%s keeps the drawn card order", (spreadId, count) => {
    const cards = draw(count, 0);
    const prompt = buildSimpleReadingPrompt(buildReadingContext(spreadId, "Will I move?", cards, cardsMap));
    cards.forEach((card, index) => {
      expect(prompt).toContain(`${index + 1}. ${card.name}`);
    });
  });
});

describe("Grand Tableau adjacency data: bounded eight-cell geometry", () => {
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
