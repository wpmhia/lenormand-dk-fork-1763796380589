import { cardIdsInText } from "@/lib/invented-cards";
import { gridRelation } from "@/lib/spread-geometry";
import type { ReadingContext } from "@/lib/reading-context";
import type { SimpleAnswer } from "@/lib/simple-answer";

/**
 * Factual check on claimed spatial relations.
 *
 * The prompt no longer precomputes adjacency, diagonals or knight's moves; it supplies
 * coordinates and tells the model to derive relations itself. This validator closes that
 * loop: it recomputes the relation the model actually asserts and rejects it if the
 * coordinates say otherwise.
 *
 * Scope is deliberately narrow. Only the structured `patterns[].cards` labels are checked,
 * and only when such a label names exactly two cards and contains an explicit relation
 * word. Combined with the invented-card check, the hard facts are covered:
 *
 *   - a card that was not drawn        -> findInventedCards
 *   - a relation that does not hold    -> this module
 *
 * What is intentionally *not* checked is prose. Deciding whether a sentence in `reading`
 * asserts a spatial relation would mean building a natural-language rule engine, which is
 * the expert system this architecture exists to remove. A regex that guesses at meaning
 * would reject good readings more often than it catches bad ones.
 */

interface RelationCheck {
  label: string;
  pattern: RegExp;
  holds: (rowDelta: number, columnDelta: number) => boolean;
}

const RELATION_CHECKS: RelationCheck[] = [
  {
    label: "adjacent",
    pattern: /\badjacent\b|\bnext to\b|\bbeside\b|\bneighbour|\bneighbor/i,
    holds: (rowDelta, columnDelta) => Math.max(Math.abs(rowDelta), Math.abs(columnDelta)) === 1,
  },
  {
    label: "a knight's move",
    pattern: /\bknight/i,
    holds: (rowDelta, columnDelta) =>
      (Math.abs(rowDelta) === 1 && Math.abs(columnDelta) === 2) ||
      (Math.abs(rowDelta) === 2 && Math.abs(columnDelta) === 1),
  },
  {
    label: "in the same row",
    pattern: /\bsame row\b/i,
    holds: (rowDelta) => rowDelta === 0,
  },
  {
    label: "in the same column",
    pattern: /\bsame column\b/i,
    holds: (_rowDelta, columnDelta) => columnDelta === 0,
  },
  {
    label: "diagonal",
    pattern: /\bdiagonal/i,
    holds: (rowDelta, columnDelta) =>
      rowDelta !== 0 && Math.abs(rowDelta) === Math.abs(columnDelta),
  },
];

function gridShape(context: ReadingContext): { rowCount: number; columnCount: number } | null {
  switch (context.layout.type) {
    case "petit-tableau":
      return { rowCount: 3, columnCount: 3 };
    case "grand-tableau":
      return { rowCount: 4, columnCount: 9 };
    default:
      return null;
  }
}

export function findFalseGeometryClaims(answer: SimpleAnswer, context: ReadingContext): string[] {
  const violations: string[] = [];
  const grid = gridShape(context);
  const isLinear = context.layout.type === "linear-sentence";

  for (const pattern of answer.patterns) {
    // Only the structured label is checked, never `meaning`. The meaning is prose, and a
    // model writing "Clouds + Coffin: uncertainty sits next to closure" is describing the
    // combination, not asserting geometric adjacency. Scanning prose for relation words
    // rejected valid readings; the boundary is labels only.
    const check = RELATION_CHECKS.find((candidate) => candidate.pattern.test(pattern.cards));
    if (!check) continue;

    const ids = cardIdsInText(pattern.cards);
    if (ids.length !== 2) continue;

    const [a, b] = ids;
    const indexA = context.cards.findIndex((card) => card.id === a);
    const indexB = context.cards.findIndex((card) => card.id === b);
    if (indexA < 0 || indexB < 0) continue; // an invented card is reported separately

    const holds = (() => {
      if (isLinear) {
        // In a line, the only relation the spread defines is consecutive order.
        return check.label === "adjacent" ? Math.abs(indexA - indexB) === 1 : false;
      }
      if (!grid) return false;
      const relation = gridRelation(indexA, indexB, grid.columnCount);
      return check.holds(relation.rowDelta, relation.columnDelta);
    })();

    if (!holds) {
      violations.push(
        `Pattern "${pattern.cards}" claims the cards are ${check.label}, but the coordinates do not support that.`,
      );
    }
  }

  return violations;
}