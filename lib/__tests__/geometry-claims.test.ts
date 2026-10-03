import { describe, it, expect } from "vitest";
import { findFalseGeometryClaims } from "@/lib/geometry-claims";
import { buildReadingContext } from "@/lib/reading-context";
import { getCardCatalogMap } from "@/lib/card-catalog";
import { SimpleAnswerSchema } from "@/lib/simple-answer";

/**
 * The geometry validator recomputes whatever relation the model asserts, so the prompt can
 * supply coordinates and let the model derive relations itself.
 *
 * The boundary under test is labels-only: `patterns[].cards` may be checked, prose may not.
 * An earlier version scanned `pattern.meaning` too and rejected valid readings — the
 * prompt's own example, "Clouds + Coffin: uncertainty sits next to closure", would fail
 * whenever the two cards were not geometrically adjacent.
 */

const cardsMap = getCardCatalogMap();

/** Places the given cards at the given grid positions; fills the rest in deck order. */
function tableauAt(positions: Record<number, number>) {
  const placed = Object.keys(positions).map(Number);
  const used = new Set(placed);
  const filler = [...cardsMap.values()]
    .sort((a, b) => a.id - b.id)
    .filter((card) => !used.has(card.id))
    .map((card) => card.id);

  const cards = Array.from({ length: 36 }, (_, index) => {
    const explicit = placed.find((id) => positions[id] === index);
    const id = explicit ?? filler.shift()!;
    const card = cardsMap.get(id)!;
    return { id: card.id, name: card.name, keywords: card.keywords, position: index };
  });
  return buildReadingContext("grand-tableau", "Q?", cards, cardsMap);
}

const answer = (patterns: { cards: string; meaning: string }[]) =>
  SimpleAnswerSchema.parse({ answer: "a", reading: "b", patterns, timing: null });

describe("geometry-claims: labels only, never prose", () => {
  // Cards 1 and 2 sit at positions 0 and 1 (adjacent); card 3 sits far away at position 30.
  const adjacentContext = tableauAt({ 1: 0, 2: 1, 3: 30 });

  it("does not scan the prose meaning for relation words", () => {
    expect(
      findFalseGeometryClaims(
        answer([{ cards: "Clouds + Scythe", meaning: "uncertainty sits next to closure" }]),
        adjacentContext,
      ),
    ).toEqual([]);
  });

  it("does not scan a meaning that claims a false relation", () => {
    expect(
      findFalseGeometryClaims(
        answer([{ cards: "Clouds + Scythe", meaning: "these two are diagonal neighbours" }]),
        adjacentContext,
      ),
    ).toEqual([]);
  });

  it("accepts a true adjacency asserted in the label", () => {
    expect(findFalseGeometryClaims(answer([{ cards: "Rider + Clover", meaning: "x" }]), adjacentContext)).toEqual([]);
  });

  it("flags a false adjacency asserted in the label", () => {
    const context = tableauAt({ 1: 0, 2: 30 });
    expect(findFalseGeometryClaims(answer([{ cards: "Rider adjacent to Clover", meaning: "x" }]), context)).not.toEqual([]);
  });

  it("flags a false knight's move", () => {
    const context = tableauAt({ 1: 0, 2: 1 });
    const claims = findFalseGeometryClaims(answer([{ cards: "Rider knight Clover", meaning: "x" }]), context);
    expect(claims).not.toEqual([]);
    expect(claims[0]).toMatch(/knight/i);
  });

  it("accepts a true knight's move", () => {
    // Position 0 is row 1 col 1; position 10 is row 2 col 2. Knight move is (1,2).
    const context = tableauAt({ 1: 0, 2: 11 });
    expect(findFalseGeometryClaims(answer([{ cards: "Rider knight Clover", meaning: "x" }]), context)).toEqual([]);
  });

  it("flags a false same-row claim", () => {
    const context = tableauAt({ 1: 0, 2: 9 }); // rows 1 and 2
    expect(findFalseGeometryClaims(answer([{ cards: "Rider same row as Clover", meaning: "x" }]), context)).not.toEqual([]);
  });

  it("ignores patterns with no relation word", () => {
    expect(findFalseGeometryClaims(answer([{ cards: "Rider + Clover + Ship", meaning: "x" }]), adjacentContext)).toEqual([]);
    expect(findFalseGeometryClaims(answer([{ cards: "Rider", meaning: "x" }]), adjacentContext)).toEqual([]);
  });

  it("reports an invented card through the invented-card path, not this one", () => {
    // Clouds is drawn in the filler deck; a card genuinely absent from `context.cards`
    // would be skipped here because findInventedCards owns that report.
    expect(findFalseGeometryClaims(answer([{ cards: "Rider adjacent to Nothing", meaning: "x" }]), adjacentContext)).toEqual([]);
  });
});

describe("geometry-claims: linear spreads define only consecutive order", () => {
  const linear = (ids: number[]) => {
    const cards = ids.map((id, index) => {
      const card = cardsMap.get(id)!;
      return { id: card.id, name: card.name, keywords: card.keywords, position: index };
    });
    return buildReadingContext("sentence-3", "Q?", cards, cardsMap);
  };

  it("accepts consecutive cards called adjacent", () => {
    const context = linear([1, 2, 3]);
    expect(findFalseGeometryClaims(answer([{ cards: "Rider adjacent to Clover", meaning: "x" }]), context)).toEqual([]);
  });

  it("flags non-consecutive cards called adjacent", () => {
    const context = linear([1, 2, 3]);
    expect(findFalseGeometryClaims(answer([{ cards: "Rider adjacent to Ship", meaning: "x" }]), context)).not.toEqual([]);
  });

  it("flags a diagonal claim, since a line has no diagonals", () => {
    const context = linear([1, 2, 3]);
    expect(findFalseGeometryClaims(answer([{ cards: "Rider diagonal Ship", meaning: "x" }]), context)).not.toEqual([]);
  });
});