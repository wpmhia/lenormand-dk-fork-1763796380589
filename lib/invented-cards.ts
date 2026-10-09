import { CARD_CATALOG, CARD_NAME_TO_ID } from "@/lib/card-catalog";
import type { SimpleAnswer } from "@/lib/simple-answer";

/**
 * Finds undrawn cards in the structured pattern labels. Prose is deliberately not scanned:
 * card names there can be ordinary words, negations, or references to another spread.
 */

export type InventedCardField = "pattern";

export interface InventedCardMatch {
  id: number;
  name: string;
  field: InventedCardField;
  /** Index of the pattern with the undrawn card label. */
  patternIndex?: number;
  /** The exact card label from `patterns[].cards`. */
  fragment: string;
}

export interface UnresolvedCardLabel {
  patternIndex: number;
  label: string;
}

/**
 * A pattern label that is not a canonical card name (or a known alias).
 *
 * Detecting only *recognised* names is not enough: `["Heart", "ImaginaryCard"]` would pass
 * an invented-card scan untouched, and a `combination` pattern is never geometry-checked,
 * so the unknown name would reach the user. The contract says `cards[]` holds canonical
 * names, so an unresolvable element is a structural defect of that pattern, dropped like
 * any other.
 */
export function findUnresolvedCardLabels(answer: SimpleAnswer): UnresolvedCardLabel[] {
  const unresolved: UnresolvedCardLabel[] = [];
  answer.patterns.forEach((pattern, patternIndex) => {
    for (const label of pattern.cards) {
      const key = label.trim().toLowerCase();
      if (!CARD_NAME_TO_ID.has(key)) unresolved.push({ patternIndex, label: label.trim() });
    }
  });
  return unresolved;
}

const CARD_NAME_BY_ID = new Map(CARD_CATALOG.map((card) => [card.id, card.name]));

function nameOf(id: number): string {
  return CARD_NAME_BY_ID.get(id) ?? String(id);
}

/** Returns canonical card labels in patterns that do not belong to this spread. */
export function findInventedCards(answer: SimpleAnswer, drawnCardIds: number[]): InventedCardMatch[] {
  const drawn = new Set(drawnCardIds);
  const matches: InventedCardMatch[] = [];

  answer.patterns.forEach((pattern, patternIndex) => {
    for (const label of pattern.cards) {
      const id = CARD_NAME_TO_ID.get(label.trim().toLowerCase());
      if (id !== undefined && !drawn.has(id)) {
        matches.push({ id, name: nameOf(id), field: "pattern", patternIndex, fragment: label.trim() });
      }
    }
  });

  return matches;
}
