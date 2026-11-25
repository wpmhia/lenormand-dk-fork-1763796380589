import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildClassicAnalysis } from "@/lib/classic-analysis";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { ReadingCard } from "@/lib/types";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);
const drawn = (count: number, offset = 0): ReadingCard[] =>
  Array.from({ length: count }, (_, i) => ({ id: deck[(i + offset) % 36].id, position: i }));
const nameOf = (index: number, offset = 0) => deck[(index + offset) % 36].name;

describe("classic analysis: deterministic, model-free and honest about its limits", () => {
  beforeEach(() => generateText.mockReset());

  it("returns the same output for the same input and makes zero model calls for every spread size", () => {
    for (const [id, n] of [["single-card", 1], ["sentence-3", 3], ["sentence-5", 5], ["comprehensive", 9], ["grand-tableau", 36]] as const) {
      buildClassicAnalysis(id, "Q", drawn(n));
    }
    expect(generateText).toHaveBeenCalledTimes(0);
    expect(buildClassicAnalysis("comprehensive", "Q", drawn(9, 3))).toEqual(
      buildClassicAnalysis("comprehensive", "Q", drawn(9, 3)),
    );
  });

  it("always states that it does not predict events and does not interpret combinations", () => {
    for (const [id, n] of [["single-card", 1], ["sentence-3", 3], ["sentence-5", 5], ["comprehensive", 9], ["grand-tableau", 36]] as const) {
      expect(buildClassicAnalysis(id, "Q", drawn(n)).note).toMatch(/does not predict events/);
    }
    const text = JSON.stringify(buildClassicAnalysis("grand-tableau", "Q", drawn(36)));
    expect(text).not.toMatch(/combinations? (suggests|means|reveals|indicates|shows)/i);
  });

  it("lists every card in drawn order with its catalogue meaning", () => {
    const analysis = buildClassicAnalysis("sentence-3", "Q", drawn(3, 7));
    expect(analysis.cards.map((c) => c.name)).toEqual(Array.from({ length: 3 }, (_, i) => nameOf(i, 7)));
    expect(analysis.cards.map((c) => c.position)).toEqual([1, 2, 3]);
    for (const card of analysis.cards) expect(card.meaning.length).toBeGreaterThan(0);
  });
});

describe("classic analysis: geometry", () => {
  it("describes the 3x3 grid: centre, rows, columns and both diagonals in grid order", () => {
    const analysis = buildClassicAnalysis("comprehensive", "Q", drawn(9, 0));
    expect(analysis.geometry[0]).toBe(`Centre (row 2, column 2): ${nameOf(4)}. Surrounding cards: ${[0, 1, 2, 3, 5, 6, 7, 8].map((i) => nameOf(i)).join(", ")}.`);
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

  it("describes the 4x9 Grand Tableau: four rows, significators, and per-card neighbours without wrap-around", () => {
    const cards = drawn(36, 0);
    const analysis = buildClassicAnalysis("grand-tableau", "Q", cards);

    const rows = analysis.geometry.filter((l) => /^Row \d: /.test(l));
    expect(rows).toHaveLength(4);
    for (let r = 0; r < 4; r++) {
      const names = Array.from({ length: 9 }, (_, c) => nameOf(r * 9 + c));
      expect(rows[r]).toBe(`Row ${r + 1}: ${names.join(" | ")}`);
    }

    const woman = cards.findIndex((c) => c.id === 29) + 1;
    const man = cards.findIndex((c) => c.id === 28) + 1;
    expect(analysis.geometry).toContain(`Woman (significator) is at position ${woman}.`);
    expect(analysis.geometry).toContain(`Man (significator) is at position ${man}.`);

    const cross = analysis.geometry.find((l) => l.startsWith(`${nameOf(35)} (position 36):`));
    expect(cross).toBeDefined();
    const neighbours = cross!.split(": ")[1].split(", ");
    expect(neighbours).toHaveLength(3);
    expect(neighbours).not.toContain(nameOf(0));

    expect(analysis.geometry.filter((l) => /\(position \d+\):/.test(l))).toHaveLength(36);
  });

  it("uses only the drawn cards and the question for its identity", () => {
    const a = buildClassicAnalysis("sentence-3", "Will it rain?", drawn(3));
    expect(a.question).toBe("Will it rain?");
    expect(a.spreadId).toBe("sentence-3");
  });
});
