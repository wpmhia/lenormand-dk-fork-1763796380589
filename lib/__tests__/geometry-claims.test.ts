import { describe, it, expect } from "vitest";
import { validateRelation, findInvalidGeometryPatterns, geometryOf, type LayoutGeometry } from "@/lib/geometry-claims";
import { buildReadingContext } from "@/lib/reading-context";
import { getCardCatalogMap } from "@/lib/card-catalog";
import { SimpleAnswerSchema, type PatternRelation } from "@/lib/simple-answer";

/**
 * The validator is card-agnostic: it receives positions and a relation type and does
 * arithmetic. Nothing here names a card as a special case, and nothing here infers a
 * relation from prose. These tests exercise the generic function at its edges, then a
 * handful of real spreads.
 */

const cardsMap = getCardCatalogMap();
const catalog = [...cardsMap.values()].sort((a, b) => a.id - b.id);

const GT: LayoutGeometry = { kind: "grid", rowCount: 4, columnCount: 9, hasHouses: true };
const PETIT: LayoutGeometry = { kind: "grid", rowCount: 3, columnCount: 3, hasHouses: false };
const LINE: LayoutGeometry = { kind: "line" };
const SINGLE: LayoutGeometry = { kind: "single" };

/** The Grand Tableau's houses, in position order: house 1 is named after card 1. */
const GT_HOUSES = catalog.map((card) => card.name);
const GT_WITH_HOUSES: LayoutGeometry = { ...GT, houses: GT_HOUSES };

describe("validateRelation: generic geometry, independent of any card", () => {
  it("treats combination and single-card sets as unconstrained", () => {
    expect(validateRelation([0, 30], "combination", GT)).toBe(true);
    expect(validateRelation([0], "adjacent", GT)).toBe(true);
    expect(validateRelation([0, 30], "adjacent", SINGLE)).toBe(false);
  });

  it("checks adjacency as one step in any direction", () => {
    expect(validateRelation([0, 1], "adjacent", GT)).toBe(true);
    expect(validateRelation([0, 9], "adjacent", GT)).toBe(true); // vertically
    expect(validateRelation([0, 10], "adjacent", GT)).toBe(true); // diagonally
    expect(validateRelation([0, 2], "adjacent", GT)).toBe(false);
    expect(validateRelation([0, 19], "adjacent", GT)).toBe(false); // knight distance, not adjacent
  });

  it("checks rows and columns by constant coordinate", () => {
    expect(validateRelation([0, 5, 8], "row", GT)).toBe(true);
    expect(validateRelation([0, 9], "row", GT)).toBe(false);
    expect(validateRelation([0, 9, 18], "column", GT)).toBe(true);
    expect(validateRelation([0, 10], "column", GT)).toBe(false);
  });

  it("checks diagonals by constant row-column or row+column", () => {
    expect(validateRelation([0, 10, 20], "diagonal", GT)).toBe(true);
    expect(validateRelation([2, 10, 18], "diagonal", GT)).toBe(true);
    expect(validateRelation([0, 1], "diagonal", GT)).toBe(false);
  });

  it("checks knight moves as exactly one-and-two, between exactly two cards", () => {
    expect(validateRelation([0, 11], "knight", GT)).toBe(true); // (1,2)
    expect(validateRelation([0, 19], "knight", GT)).toBe(true); // (2,1)
    expect(validateRelation([0, 1], "knight", GT)).toBe(false);
    expect(validateRelation([0, 10], "knight", GT)).toBe(false); // diagonal
    expect(validateRelation([0, 11, 20], "knight", GT)).toBe(false); // three cards is not a knight move
  });

  it("checks sequence only in a line", () => {
    expect(validateRelation([0, 1, 2], "sequence", LINE)).toBe(true);
    expect(validateRelation([0, 2], "sequence", LINE)).toBe(false);
    expect(validateRelation([0, 1], "sequence", GT)).toBe(false);
  });

  it("checks surrounding relative to the first named card", () => {
    expect(validateRelation([0, 1, 10], "surrounding", GT)).toBe(true);
    expect(validateRelation([0, 5], "surrounding", GT)).toBe(false);
  });

  it("checks real house occupancy, not merely that houses exist", () => {
    // Position 0 occupies the house named after card 1 (Rider).
    expect(validateRelation([0], "house", GT_WITH_HOUSES, "Rider")).toBe(true);
    // Position 20 is not in the Rider house.
    expect(validateRelation([20], "house", GT_WITH_HOUSES, "Rider")).toBe(false);
    // A house claim without a named house cannot be verified.
    expect(validateRelation([0], "house", GT_WITH_HOUSES)).toBe(false);
    // The same claim on a layout without houses is false.
    expect(validateRelation([0], "house", PETIT, "Rider")).toBe(false);
    expect(validateRelation([0, 1], "house", LINE, "Rider")).toBe(false);
  });

  it("returns false for grid-only relations asserted on a line", () => {
    for (const relation of ["row", "column", "diagonal", "knight"] as PatternRelation[]) {
      expect(validateRelation([0, 1], relation, LINE), relation).toBe(false);
    }
  });
});

describe("geometryOf: layout to geometry, nothing else", () => {
  const context = (spreadId: "sentence-3" | "comprehensive" | "grand-tableau") => {
    const count = spreadId === "sentence-3" ? 3 : spreadId === "comprehensive" ? 9 : 36;
    const cards = catalog.slice(0, count).map((card, index) => ({
      id: card.id,
      name: card.name,
      keywords: card.keywords,
      position: index,
    }));
    return buildReadingContext(spreadId, "Q?", cards, cardsMap);
  };

  it("maps each layout to its geometry", () => {
    expect(geometryOf(context("sentence-3"))).toEqual({ kind: "line" });
    expect(geometryOf(context("comprehensive"))).toEqual({ kind: "grid", rowCount: 3, columnCount: 3, hasHouses: false });
    expect(geometryOf(context("grand-tableau"))).toEqual({
      kind: "grid",
      rowCount: 4,
      columnCount: 9,
      hasHouses: true,
      houses: GT_HOUSES,
    });
  });

  it("maps a single-card spread to single", () => {
    const card = catalog[0];
    const ctx = buildReadingContext("single-card", "Q?", [{ id: card.id, name: card.name, keywords: card.keywords }], cardsMap);
    expect(geometryOf(ctx)).toEqual({ kind: "single" });
  });
});

describe("findFalseGeometryClaims: end to end on real spreads", () => {
  /** Places named cards at chosen indices; fills the rest in deck order. */
  function tableauAt(positions: Record<number, number>) {
    const placed = Object.keys(positions).map(Number);
    const used = new Set(placed);
    const filler = catalog.filter((card) => !used.has(card.id)).map((card) => card.id);
    const cards = Array.from({ length: 36 }, (_, index) => {
      const explicit = placed.find((id) => positions[id] === index);
      const id = explicit ?? filler.shift()!;
      const card = cardsMap.get(id)!;
      return { id: card.id, name: card.name, keywords: card.keywords, position: index };
    });
    return buildReadingContext("grand-tableau", "Q?", cards, cardsMap);
  }

  const answer = (patterns: { cards: string[]; relation: PatternRelation; house?: string | null; meaning: string }[]) =>
    SimpleAnswerSchema.parse({ answer: "a", reading: "b", patterns, timing: null });

  it("accepts a true claim and rejects a false one for the same card pair", () => {
    const close = tableauAt({ 1: 0, 2: 1 }); // Rider and Clover adjacent
    expect(findInvalidGeometryPatterns(answer([{ cards: ["Rider", "Clover"], relation: "adjacent", meaning: "x" }]), close)).toEqual([]);

    const far = tableauAt({ 1: 0, 2: 30 });
    expect(findInvalidGeometryPatterns(answer([{ cards: ["Rider", "Clover"], relation: "adjacent", meaning: "x" }]), far)).not.toEqual([]);
  });

  it("never scans prose for relation words", () => {
    const context = tableauAt({ 1: 0, 2: 30 });
    // "next to" appears only in the meaning, and the declared relation is combination.
    expect(
      findInvalidGeometryPatterns(
        answer([{ cards: ["Rider", "Clover"], relation: "combination", meaning: "uncertainty sits next to closure" }]),
        context,
      ),
    ).toEqual([]);
  });

  it("flags a house claim on a layout without houses", () => {
    const cards = catalog.slice(0, 9).map((card, index) => ({
      id: card.id,
      name: card.name,
      keywords: card.keywords,
      position: index,
    }));
    const petit = buildReadingContext("comprehensive", "Q?", cards, cardsMap);
    expect(
      findInvalidGeometryPatterns(answer([{ cards: ["Rider", "Clover"], relation: "house", meaning: "x" }]), petit),
    ).not.toEqual([]);
  });

  it("validates a Grand Tableau house claim against real occupancy", () => {
    const context = tableauAt({ 1: 0 }); // Rider occupies position 1, the Rider house
    expect(
      findInvalidGeometryPatterns(answer([{ cards: ["Rider"], relation: "house", house: "Rider", meaning: "x" }]), context),
    ).toEqual([]);
    // A valid card in the wrong house is rejected.
    expect(
      findInvalidGeometryPatterns(answer([{ cards: ["Rider"], relation: "house", house: "Clover", meaning: "x" }]), context),
    ).not.toEqual([]);
    // A house claim without a named house cannot be verified.
    expect(
      findInvalidGeometryPatterns(answer([{ cards: ["Rider"], relation: "house", meaning: "x" }]), context),
    ).not.toEqual([]);
  });

  it("does not treat the referenced house card as a second occupant", () => {
    // Woman sits in position 8, the Coffin house. The Coffin card itself is not the occupant.
    const context = tableauAt({ 29: 7 });
    expect(
      findInvalidGeometryPatterns(
        answer([{ cards: ["Woman", "Coffin"], relation: "house", house: "Coffin", meaning: "x" }]),
        context,
      ),
    ).toEqual([]);
    // `house` may also carry the house name without repeating it in cards[].
    expect(
      findInvalidGeometryPatterns(
        answer([{ cards: ["Woman"], relation: "house", house: "Coffin", meaning: "x" }]),
        context,
      ),
    ).toEqual([]);
    // Naming a different house remains a factual error.
    expect(
      findInvalidGeometryPatterns(
        answer([{ cards: ["Woman", "Coffin"], relation: "house", house: "Rider", meaning: "x" }]),
        context,
      ),
    ).not.toEqual([]);
    // A single house claim cannot assert that two occupants are in one house.
    expect(
      findInvalidGeometryPatterns(
        answer([{ cards: ["Woman", "Man", "Coffin"], relation: "house", house: "Coffin", meaning: "x" }]),
        context,
      ),
    ).not.toEqual([]);
  });

  it("validates a multi-card column claim from an array of names", () => {
    // Rider at row 1 col 1, and two filler cards placed down column 1: indices 0, 9, 18.
    const column = tableauAt({ 1: 0, 2: 9, 3: 18 });
    expect(
      findInvalidGeometryPatterns(
        answer([{ cards: ["Rider", "Clover", "Ship"], relation: "column", meaning: "x" }]),
        column,
      ),
    ).toEqual([]);

    // The same three cards called a diagonal do not form one.
    expect(
      findInvalidGeometryPatterns(
        answer([{ cards: ["Rider", "Clover", "Ship"], relation: "diagonal", meaning: "x" }]),
        column,
      ),
    ).not.toEqual([]);
  });

  it("reports the offending pattern by index so exactly that one can be dropped", () => {
    const context = tableauAt({ 1: 0, 2: 30 });
    const invalid = findInvalidGeometryPatterns(
      answer([
        { cards: ["Rider", "Clover"], relation: "combination", meaning: "kept" },
        { cards: ["Rider", "Clover"], relation: "adjacent", meaning: "dropped" },
      ]),
      context,
    );
    expect(invalid).toHaveLength(1);
    expect(invalid[0].index).toBe(1);
    expect(invalid[0].message).toMatch(/adjacent/);
  });

  it("ignores a claim naming a card that was not drawn", () => {
    const context = tableauAt({ 1: 0 });
    expect(
      findInvalidGeometryPatterns(answer([{ cards: ["Rider", "Nothing"], relation: "knight", meaning: "x" }]), context),
    ).toEqual([]);
  });
});
