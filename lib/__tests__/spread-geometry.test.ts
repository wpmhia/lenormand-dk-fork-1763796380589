import { describe, it, expect } from "vitest";
import {
  adjacentPairs,
  diagonalLines,
  gridRelation,
  knightPairs,
} from "@/lib/spread-geometry";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSpreadFacts } from "@/lib/prompt-builder";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/**
 * The structural layer is only worth anything if it is both complete and pure: complete,
 * so the model sees every relation a reader can check; pure, so no relation arrives with
 * a meaning attached. These tests prove both properties mathematically, because a wrong
 * "fact" is worse than a missing one — the model is told to trust this data.
 */

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, position: i };
  });
}

function deltas(a: number, b: number, columns: number) {
  return {
    row: Math.abs(Math.floor(b / columns) - Math.floor(a / columns)),
    column: Math.abs((b % columns) - (a % columns)),
  };
}

describe("spread-geometry: orthogonal adjacency", () => {
  it("emits exactly every horizontal and vertical neighbour once for a 4x9 grid", () => {
    const pairs = adjacentPairs(4, 9);
    // 4 rows * 8 horizontal + 3 row-gaps * 9 vertical = 32 + 27
    expect(pairs).toHaveLength(59);
    expect(new Set(pairs.map((p) => `${p.a}-${p.b}`)).size).toBe(59);
    for (const { a, b } of pairs) {
      expect(a).toBeLessThan(b);
      const { row, column } = deltas(a, b, 9);
      expect(row + column).toBe(1);
    }
  });

  it("emits exactly every neighbour of a 3x3 grid", () => {
    expect(adjacentPairs(3, 3)).toHaveLength(12);
  });
});

describe("spread-geometry: diagonal lines are complete and contiguous", () => {
  const diagonals = diagonalLines(4, 9);

  it("finds every diagonal of two or more cells in a 4x9 grid", () => {
    expect(diagonals).toHaveLength(20);
    expect(new Set(diagonals.map((line) => line.cells.slice().sort((a, b) => a - b).join(","))).size).toBe(20);
  });

  it("orders each line left to right", () => {
    for (const line of diagonals) {
      const columns = line.cells.map((cell) => cell % 9);
      const sorted = columns.slice().sort((a, b) => a - b);
      expect(columns).toEqual(sorted);
    }
  });

  it("never emits a line with a gap in it", () => {
    for (const line of diagonals) {
      expect(line.cells.length).toBeGreaterThanOrEqual(2);
      // Every line is stored left to right, so each step advances exactly one row and
      // one column regardless of which way the walk ran.
      for (let i = 1; i < line.cells.length; i++) {
        const { row, column } = deltas(line.cells[i - 1], line.cells[i], 9);
        expect(row, "diagonal step must move exactly one row").toBe(1);
        expect(column, "diagonal step must move exactly one column").toBe(1);
      }
    }
  });

  it("finds the six diagonals of a 3x3 grid", () => {
    const petit = diagonalLines(3, 3);
    expect(petit).toHaveLength(6);
    expect(petit.filter((line) => line.cells.length === 3)).toHaveLength(2);
  });
});

describe("spread-geometry: knight's moves are complete", () => {
  const knights = knightPairs(4, 9);

  it("finds every knight's move in a 4x9 grid without duplicates", () => {
    expect(knights).toHaveLength(74);
    expect(new Set(knights.map((p) => `${p.a}-${p.b}`)).size).toBe(74);
  });

  it("emits only genuine knight's moves", () => {
    for (const { a, b } of knights) {
      expect(a).toBeLessThan(b);
      const { row, column } = deltas(a, b, 9);
      const isKnight = (row === 1 && column === 2) || (row === 2 && column === 1);
      expect(isKnight, `${a + 1} and ${b + 1} are not a knight's move apart`).toBe(true);
    }
  });

  it("finds the eight knight's moves of a 3x3 grid", () => {
    expect(knightPairs(3, 3)).toHaveLength(8);
  });

  it("cannot emit a pair a 4-row grid does not have room for", () => {
    for (const { a, b } of knights) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(36);
      expect(Math.floor(a / 9)).not.toBe(Math.floor(b / 9));
    }
  });
});

describe("spread-geometry: relations are described, never interpreted", () => {
  it("labels a knight's move", () => {
    expect(gridRelation(6, 14, 9).label).toBe("knight's move apart");
    expect(gridRelation(14, 6, 9).label).toBe("knight's move apart");
  });

  it("labels orthogonal and diagonal neighbours", () => {
    expect(gridRelation(0, 1, 9).label).toBe("immediately to the side");
    expect(gridRelation(0, 9, 9).label).toBe("immediately above or below");
    expect(gridRelation(0, 10, 9).label).toBe("diagonal neighbour");
  });

  it("reports exact deltas and distance", () => {
    expect(gridRelation(0, 10, 9)).toMatchObject({ rowDelta: 1, columnDelta: 1, distance: 1 });
    expect(gridRelation(0, 20, 9)).toMatchObject({ rowDelta: 2, columnDelta: 2, distance: 2 });
    expect(gridRelation(3, 4, 9).distance).toBe(1);
  });

  it("assigns no meaning to any relation", () => {
    const labels = [0, 1, 5, 9, 14, 18, 27, 35].flatMap((a) =>
      [0, 1, 5, 9, 14, 18, 27, 35].map((b) => gridRelation(a, b, 9).label),
    );
    for (const label of labels) {
      expect(label).not.toMatch(/means|indicates|suggests|good|bad|positive|negative|luck/i);
    }
  });
});

describe("buildSpreadFacts: the Grand Tableau supplies complete geometry", () => {
  const facts = buildSpreadFacts(
    buildReadingContext("grand-tableau", "Full picture?", draw(36, 13), cardsMap),
  );

  it("supplies every column of the 4x9 grid", () => {
    expect(facts).toContain("Columns (top to bottom), 9 in total:");
    expect(facts.split("\n").filter((line) => /^- column \d+: /.test(line))).toHaveLength(9);
  });

  it("supplies all 59 orthogonal pairs", () => {
    expect(facts).toContain("Adjacent pairs, 59 in total");
    expect(facts.split("\n").filter((line) => /^- \d+\+\d+: /.test(line))).toHaveLength(59);
  });

  it("supplies every diagonal line", () => {
    expect(facts).toContain("Diagonal lines, 20 in total");
    expect(facts.split("\n").filter((line) => line.startsWith("- diagonal "))).toHaveLength(20);
  });

  it("supplies every knight's move", () => {
    expect(facts).toContain("Knight's moves, 74 in total:");
    expect(facts.split("\n").filter((line) => line.startsWith("- knight: "))).toHaveLength(74);
  });

  it("still supplies all 36 houses", () => {
    expect(facts.split("\n").filter((line) => /^- position \d+: .+ house, occupied by /.test(line))).toHaveLength(36);
  });

  it("no longer claims its relations are complete without being complete", () => {
    // The old header said "Verified spatial relations (complete)" while listing only
    // orthogonal pairs and significator mirrors, which was simply untrue.
    expect(facts).toContain("Verified spatial relations (complete for this 4x9 grid):");
    expect(facts).not.toContain("Verified spatial relations (complete)");
  });

  it("attaches no meaning to any relation it reports", () => {
    for (const line of facts.split("\n")) {
      if (!/^(- \d+\+\d+: |- diagonal |- knight: |- column |-\d+<->\d+: )/.test(line)) continue;
      expect(line, `relation line carries interpretation: ${line}`).not.toMatch(
        /means|indicates|suggests|stands for|represents|is (?:good|bad)|positive|negative/i,
      );
    }
  });
});

describe("buildSpreadFacts: the Petit Tableau supplies complete geometry", () => {
  const facts = buildSpreadFacts(
    buildReadingContext("comprehensive", "What will the month bring?", draw(9, 5), cardsMap),
  );

  it("supplies every column", () => {
    expect(facts.split("\n").filter((line) => /^- column \d+: /.test(line))).toHaveLength(3);
  });

  it("supplies all 12 orthogonal pairs, all 6 diagonals and all 8 knight's moves", () => {
    expect(facts.split("\n").filter((line) => /^- \d+\+\d+: /.test(line))).toHaveLength(12);
    expect(facts.split("\n").filter((line) => line.startsWith("- diagonal "))).toHaveLength(6);
    expect(facts.split("\n").filter((line) => line.startsWith("- knight: "))).toHaveLength(8);
  });

  it("still names the geometric centre", () => {
    expect(facts).toContain("Geometric centre: position 5 (Row 2, Column 2)");
  });
});