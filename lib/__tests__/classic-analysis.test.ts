import { describe, expect, it } from "vitest";
import { buildClassicAnalysis } from "@/lib/classic-analysis";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { ReadingCard } from "@/lib/types";

const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);
const drawn = (count: number, offset = 0): ReadingCard[] =>
  Array.from({ length: count }, (_, i) => ({ id: deck[(i + offset) % 36].id, position: i }));
const nameOf = (index: number, offset = 0) => deck[(index + offset) % 36].name;

describe("classic analysis: deterministic and model-free", () => {
  it("returns the same output for the same input", () => {
    const cards = drawn(9, 3);
    expect(buildClassicAnalysis("comprehensive", "Q", cards)).toEqual(buildClassicAnalysis("comprehensive", "Q", cards));
  });

  it("always states that it is symbolic and not a prediction of events", () => {
    for (const [id, n] of [["single-card", 1], ["sentence-3", 3], ["sentence-5", 5], ["comprehensive", 9], ["grand-tableau", 36]] as const) {
      expect(buildClassicAnalysis(id, "Q", drawn(n)).note).toMatch(/not a prediction of events/);
    }
  });

  it("does not invent combination meanings the catalogue does not hold", () => {
    const text = JSON.stringify(buildClassicAnalysis("grand-tableau", "Q", drawn(36)));
    expect(text).not.toMatch(/combination/i);
  });
});

describe("classic analysis: card meanings and order", () => {
  it.each([1, 3, 5])("%i-card spread lists every card in drawn order with its catalogue meaning", (n) => {
    const spreadId = n === 1 ? "single-card" : n === 3 ? "sentence-3" : "sentence-5";
    const analysis = buildClassicAnalysis(spreadId, "Q", drawn(n, 7));
    expect(analysis.cards.map((c) => c.name)).toEqual(Array.from({ length: n }, (_, i) => nameOf(i, 7)));
    expect(analysis.cards.map((c) => c.position)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
    for (const card of analysis.cards) expect(card.meaning.length).toBeGreaterThan(0);
  });

  it("gives the single card a direct answer line", () => {
    expect(buildClassicAnalysis("single-card", "Q", drawn(1)).summary).toContain(nameOf(0));
  });
});

describe("classic analysis: 9-card geometry", () => {
  const cards = drawn(9, 0);
  const analysis = buildClassicAnalysis("comprehensive", "Q", cards);

  it("names the centre card at row 2, column 2", () => {
    expect(analysis.geometry[0]).toBe(`Centre (row 2, column 2): ${nameOf(4)}. Surrounding cards: ${[0, 1, 2, 3, 5, 6, 7, 8].map((i) => nameOf(i)).join(", ")}.`);
  });

  it("lists three rows, three columns and two diagonals in grid order", () => {
    const rows = analysis.geometry.filter((l) => l.startsWith("Row "));
    const cols = analysis.geometry.filter((l) => l.startsWith("Column "));
    const diags = analysis.geometry.filter((l) => l.startsWith("Diagonal "));
    expect(rows).toEqual([
      `Row 1: ${nameOf(0)} | ${nameOf(1)} | ${nameOf(2)}`,
      `Row 2: ${nameOf(3)} | ${nameOf(4)} | ${nameOf(5)}`,
      `Row 3: ${nameOf(6)} | ${nameOf(7)} | ${nameOf(8)}`,
    ]);
    expect(cols).toEqual([
      `Column 1: ${nameOf(0)} | ${nameOf(3)} | ${nameOf(6)}`,
      `Column 2: ${nameOf(1)} | ${nameOf(4)} | ${nameOf(7)}`,
      `Column 3: ${nameOf(2)} | ${nameOf(5)} | ${nameOf(8)}`,
    ]);
    expect(diags).toEqual([
      `Diagonal (top-left to bottom-right): ${nameOf(0)} | ${nameOf(4)} | ${nameOf(8)}`,
      `Diagonal (top-right to bottom-left): ${nameOf(2)} | ${nameOf(4)} | ${nameOf(6)}`,
    ]);
  });
});

describe("classic analysis: 36-card Grand Tableau geometry", () => {
  const cards = drawn(36, 0);
  const analysis = buildClassicAnalysis("grand-tableau", "Q", cards);

  it("prints four rows of nine cards", () => {
    const rows = analysis.geometry.filter((l) => /^Row \d: /.test(l));
    expect(rows).toHaveLength(4);
    for (let r = 0; r < 4; r++) {
      const names = Array.from({ length: 9 }, (_, c) => nameOf(r * 9 + c));
      expect(rows[r]).toBe(`Row ${r + 1}: ${names.join(" | ")}`);
    }
  });

  it("reports the Woman and Man significators at their drawn positions", () => {
    const woman = cards.findIndex((c) => c.id === 29) + 1;
    const man = cards.findIndex((c) => c.id === 28) + 1;
    expect(analysis.geometry).toContain(`Woman (significator) is at position ${woman}.`);
    expect(analysis.geometry).toContain(`Man (significator) is at position ${man}.`);
  });

  it("gives the corner card Cross its three real neighbours and no wrap-around", () => {
    const cross = analysis.geometry.find((l) => l.startsWith(`${nameOf(35)} (position 36):`));
    expect(cross).toBeDefined();
    const neighbours = cross!.split(": ")[1].split(", ");
    expect(neighbours).toHaveLength(3);
    expect(neighbours).not.toContain(nameOf(0));
  });

  it("gives one neighbour line per card", () => {
    const lines = analysis.geometry.filter((l) => /\(position \d+\):/.test(l));
    expect(lines).toHaveLength(36);
  });
});

describe("classic analysis: no hidden inputs", () => {
  it("uses only the drawn cards and the question for its identity", () => {
    const a = buildClassicAnalysis("sentence-3", "Will it rain?", drawn(3));
    expect(a.question).toBe("Will it rain?");
    expect(a.spreadId).toBe("sentence-3");
  });
});
