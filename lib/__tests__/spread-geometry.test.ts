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
    // 6 is row 1 col 7; 17 is row 2 col 9 -> one row and two columns apart.
    expect(gridRelation(6, 17, 9).label).toBe("knight's move apart");
    expect(gridRelation(17, 6, 9).label).toBe("knight's move apart");
    expect(gridRelation(0, 19, 9).label).toBe("knight's move apart");
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

  /**
   * The module may compute relations but never rank or interpret them. If any of this
   * vocabulary appears in the exported labels, an expert engine has crept back in.
   */
  it("exposes only coordinate and relation vocabulary, never judgement", () => {
    const indices = [0, 1, 5, 9, 10, 14, 18, 27, 35];
    const labels = indices.flatMap((a) => indices.map((b) => gridRelation(a, b, 9).label));
    for (const label of labels) {
      expect(label).not.toMatch(
        /means|indicates|suggests|good|bad|positive|negative|luck|important|primary|focus|stronger|outcome|weight|should|must|tradition/i,
      );
    }
  });
});

describe("buildSpreadFacts: the Grand Tableau supplies coordinates, not relation lists", () => {
  const facts = buildSpreadFacts(
    buildReadingContext("grand-tableau", "Full picture?", draw(36, 13), cardsMap),
  );

  it("states the grid shape and how positions are numbered", () => {
    expect(facts).toContain("Grand Tableau, a 4x9 grid of 36 cards.");
    expect(facts).toContain("Position 1 is row 1 column 1");
    expect(facts).toContain("numbering runs left to right, then top to bottom");
  });

  it("supplies one coordinate line per card", () => {
    const lines = facts.split("\n").filter((line) => /^- \d+: .+, row \d+, col \d+, .+ house$/.test(line));
    expect(lines).toHaveLength(36);
  });

  it("also lays the grid out as visual rows, for reliable model reading", () => {
    const rowLines = facts.split("\n").filter((line) => /^Row \d+: /.test(line));
    expect(rowLines).toHaveLength(4);
    expect(rowLines[0]).toMatch(/^Row 1: .+ \| .+ \| /);
    // The row view is the same cards, not a relation list.
    expect(rowLines.join(" ")).not.toMatch(/means|indicates|important|outcome/i);
  });

  it("reports the exact grid coordinate for every card", () => {
    const cards = draw(36, 13);
    for (let index = 0; index < 36; index++) {
      const expected = `- ${index + 1}: ${cards[index].name}, row ${Math.floor(index / 9) + 1}, col ${(index % 9) + 1}, `;
      // Person cards carry an annotation, so match on the coordinate prefix instead.
      const line = facts.split("\n").find((entry) => entry.startsWith(`- ${index + 1}: `))!;
      expect(line, `position ${index + 1}`).toContain(`row ${Math.floor(index / 9) + 1}, col ${(index % 9) + 1}, `);
      expect(line).toContain(cards[index].name);
      expect(expected.length).toBeGreaterThan(0);
    }
  });

  it("names every house exactly once, alongside its occupant", () => {
    expect(deck.every((card) => facts.includes(`${card.name} house`))).toBe(true);
    expect(facts.split("\n").filter((line) => / house$/.test(line))).toHaveLength(36);
  });

  it("never precomputes a relation list", () => {
    // Enumerating relations cost thousands of characters and pre-decided relevance.
    // They are derivable from the coordinates above, so the prompt must not contain them.
    expect(facts).not.toMatch(/^- \d+\+\d+: /m);
    expect(facts).not.toContain("- diagonal ");
    expect(facts).not.toContain("- knight: ");
    expect(facts).not.toContain("- column ");
    expect(facts).not.toContain("Adjacent pairs");
    expect(facts).not.toContain("Mirrored across a significator");
  });

  it("supplies no interpretation anywhere", () => {
    for (const line of facts.split("\n")) {
      expect(line, `structural facts carry interpretation: ${line}`).not.toMatch(
        /means|indicates|suggests|stands for|represents|is (?:good|bad)|positive|negative|luck/i,
      );
    }
  });
});

describe("buildSpreadFacts: the Petit Tableau supplies coordinates", () => {
  const facts = buildSpreadFacts(
    buildReadingContext("comprehensive", "What will the month bring?", draw(9, 5), cardsMap),
  );

  it("supplies one coordinate line per card", () => {
    expect(facts.split("\n").filter((line) => /^- \d+: .+, row \d+, col \d+$/.test(line))).toHaveLength(9);
  });

  it("also lays the grid out as visual rows", () => {
    expect(facts.split("\n").filter((line) => /^Row \d+: /.test(line))).toHaveLength(3);
  });

  it("still names the geometric centre", () => {
    expect(facts).toContain("Geometric centre: position 5 (row 2, col 2).");
  });

  it("never precomputes a relation list", () => {
    expect(facts).not.toMatch(/^- \d+\+\d+: /m);
    expect(facts).not.toContain("- diagonal ");
    expect(facts).not.toContain("- knight: ");
    expect(facts).not.toContain("- column ");
  });
});