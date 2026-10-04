import { CARD_NAME_TO_ID } from "@/lib/card-catalog";
import type { ReadingContext } from "@/lib/reading-context";
import type { PatternRelation, SimpleAnswer } from "@/lib/simple-answer";

/**
 * The generic geometry validator.
 *
 * The model declares *what it claims* (`patterns[].relation`) and *between which cards*
 * (`patterns[].cards`, an array of canonical names). The server maps each name to an id,
 * each id to a position, and does arithmetic. It never parses a combined string, never
 * knows that a card is a Tree, a Woman or a Paths, and never infers a relation from prose
 * — a regex that guesses "this sentence sounds like adjacency" is a semantic engine
 * wearing a geometry hat, and it rejects valid readings.
 *
 * Works for any spread, and for any future spread that has a layout:
 *
 *   names -> card ids -> positions -> geometry check
 */

export interface LayoutGeometry {
  kind: "single" | "line" | "grid";
  rowCount?: number;
  columnCount?: number;
  hasHouses?: boolean;
}

export function geometryOf(context: ReadingContext): LayoutGeometry {
  switch (context.layout.type) {
    case "linear-sentence":
      return { kind: "line" };
    case "petit-tableau":
      return { kind: "grid", rowCount: 3, columnCount: 3, hasHouses: false };
    case "grand-tableau":
      return { kind: "grid", rowCount: 4, columnCount: 9, hasHouses: true };
    default:
      return { kind: "single" };
  }
}

function rowOf(index: number, columnCount: number): number {
  return Math.floor(index / columnCount);
}

function columnOf(index: number, columnCount: number): number {
  return index % columnCount;
}

function chebyshev(a: number, b: number, columnCount: number): number {
  return Math.max(
    Math.abs(rowOf(a, columnCount) - rowOf(b, columnCount)),
    Math.abs(columnOf(a, columnCount) - columnOf(b, columnCount)),
  );
}

function isKnightStep(a: number, b: number, columnCount: number): boolean {
  const rowDelta = Math.abs(rowOf(a, columnCount) - rowOf(b, columnCount));
  const columnDelta = Math.abs(columnOf(a, columnCount) - columnOf(b, columnCount));
  return (rowDelta === 1 && columnDelta === 2) || (rowDelta === 2 && columnDelta === 1);
}

function steps(indices: number[]): [number, number][] {
  return indices.slice(1).map((index, position) => [indices[position], index] as [number, number]);
}

/**
 * Whether a claimed relation actually holds for these positions in this layout.
 *
 * Returns `false` rather than skipping when a relation is undefined for the layout: a
 * column claim on a 5-card line is not "unverifiable", it is false.
 */
export function validateRelation(
  indices: number[],
  relation: PatternRelation,
  geometry: LayoutGeometry,
): boolean {
  if (relation === "combination") return true; // asserts no geometric relation
  if (indices.length < 2) return true; // nothing to relate
  if (geometry.kind === "single") return false;

  const { kind, columnCount } = geometry;
  const columns = columnCount ?? 1;

  switch (relation) {
    case "sequence":
      return kind === "line" && steps(indices).every(([a, b]) => b - a === 1);

    case "adjacent":
      return steps(indices).every(([a, b]) =>
        kind === "line" ? Math.abs(a - b) === 1 : chebyshev(a, b, columns) === 1,
      );

    case "surrounding":
      // The first named card is the focal card; every other card is one step from it.
      return indices
        .slice(1)
        .every((index) => (kind === "line" ? Math.abs(indices[0] - index) === 1 : chebyshev(indices[0], index, columns) === 1));

    case "row":
      return kind === "grid" && new Set(indices.map((index) => rowOf(index, columns))).size === 1;

    case "column":
      return kind === "grid" && new Set(indices.map((index) => columnOf(index, columns))).size === 1;

    case "diagonal": {
      if (kind !== "grid") return false;
      // All cells lie on one diagonal line iff row-column or row+column is constant.
      const differences = new Set(indices.map((index) => rowOf(index, columns) - columnOf(index, columns)));
      const sums = new Set(indices.map((index) => rowOf(index, columns) + columnOf(index, columns)));
      return differences.size === 1 || sums.size === 1;
    }

    case "knight":
      // A knight's move is defined between exactly two cards.
      return kind === "grid" && indices.length === 2 && isKnightStep(indices[0], indices[1], columns);

    case "house":
      // A house relation can only be asserted where houses exist (the Grand Tableau).
      return kind === "grid" && geometry.hasHouses === true;

    default:
      return true;
  }
}

/**
 * Returns the patterns whose claimed geometry the layout does not support, with their
 * index in `patterns` so the caller can drop exactly those.
 *
 * A false spatial claim is locally repairable: the rest of the reading is still usable,
 * so this reports rather than rejects. Discarding a whole Grand Tableau because one of
 * ten patterns mis-declared `row` throws away a good reading over a detail.
 *
 * `combination` patterns assert nothing geometric and are skipped. Cards that were not
 * drawn are reported separately by `findInventedCards`; the caller drops the offending
 * pattern, so this function only ever sees patterns whose geometry it still checks.
 */
export function findInvalidGeometryPatterns(
  answer: SimpleAnswer,
  context: ReadingContext,
): { index: number; message: string }[] {
  const geometry = geometryOf(context);
  const invalid: { index: number; message: string }[] = [];

  answer.patterns.forEach((pattern, index) => {
    if (pattern.relation === "combination") return;

    // Direct lookup per named card. No parsing, no regex, no combined-string splitting.
    const indices = pattern.cards
      .map((name) => CARD_NAME_TO_ID.get(name.trim().toLowerCase()))
      .map((id) => (id === undefined ? -1 : context.cards.findIndex((card) => card.id === id)));

    if (indices.length < 2 || indices.some((position) => position < 0)) return;

    if (!validateRelation(indices, pattern.relation, geometry)) {
      invalid.push({
        index,
        message: `Pattern "${pattern.cards.join(" + ")}" claims relation "${pattern.relation}", but the coordinates do not support it.`,
      });
    }
  });

  return invalid;
}