import { CARD_CATALOG, CARD_NAME_TO_ID } from "@/lib/card-catalog";
import type { SimpleAnswer } from "@/lib/simple-answer";

/**
 * Grounding check: the model may not introduce a card that was not drawn.
 *
 * The contract is split by how certain a mention is:
 *
 * - `patterns[].cards` is the strict, structured source of named cards. That field exists
 *   precisely to name cards, so a canonical name there is unambiguous. An undrawn card in
 *   it is a fabrication of the *pattern*, and the caller repairs it by dropping that one
 *   pattern rather than rejecting the whole reading.
 *
 * - Free prose is only scanned for *explicit* card references: the app's `A + B`
 *   combination syntax and `the A card` / `card A`. A bare card word is never treated as a
 *   reference on its own. Roughly half the deck is an ordinary English (and Dutch) word —
 *   man, woman, sun, moon, heart, ring, dog, house, tree, key — and "the man and woman
 *   need to talk" is a sentence, not a combination. An earlier version scanned prose with a
 *   list of loose card words and a generic `A and B` pairing; it rejected valid readings by
 *   the thousand. TypeScript checks structure; it does not police language.
 *
 * Every rejection carries the field and the matched fragment, so a genuine hallucination
 * can be told apart from an ordinary sentence.
 */

export type InventedCardField = "pattern" | "answer" | "reading" | "pattern-meaning" | "timing";

export interface InventedCardMatch {
  id: number;
  name: string;
  field: InventedCardField;
  /** Present when the mention sits in a `patterns[]` label or that pattern's meaning. */
  patternIndex?: number;
  /** The matched text with a little surrounding context, for logging. */
  fragment: string;
}

const CARD_NAME_BY_ID = new Map(CARD_CATALOG.map((card) => [card.id, card.name]));

const CANONICAL_CARD_NAMES = [...CARD_NAME_TO_ID.keys()];

function nameOf(id: number): string {
  return CARD_NAME_BY_ID.get(id) ?? String(id);
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function alternation(names: string[]): string {
  return names
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
}

/** Any canonical name or alias, used only for the structured `cards[]` labels. */
const ANY_CARD_PATTERN = new RegExp(`\\b(?:${alternation(CANONICAL_CARD_NAMES)})\\b`, "gi");

const NAMES = alternation(CANONICAL_CARD_NAMES);

/**
 * Unambiguous prose references only:
 *
 *   `Rider + Heart`   (the app's combination syntax)
 *   `the Rider card`  / `de Rider kaart`
 *   `card Rider`      / `kaart Rider`
 *
 * No bare names and no `A and B` / `A, B`: those are ordinary language.
 */
const EXPLICIT_REFERENCE_PATTERN = new RegExp(
  `\\b(?:${NAMES})\\b\\s*\\+\\s*\\b(?:${NAMES})\\b` +
    `|\\b(?:the|de|het)\\s+(?:${NAMES})\\s+(?:card|kaart)\\b` +
    `|\\b(?:${NAMES})\\s+(?:card|kaart)\\b` +
    `|\\b(?:card|kaart)\\s+(?:${NAMES})\\b`,
  "gi",
);

const FRAGMENT_WINDOW = 24;

function fragmentOf(text: string, index: number, length: number): string {
  const start = Math.max(0, index - FRAGMENT_WINDOW);
  const end = Math.min(text.length, index + length + FRAGMENT_WINDOW);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

function matchesIn(text: string, pattern: RegExp, field: InventedCardField, patternIndex?: number): InventedCardMatch[] {
  const matches: InventedCardMatch[] = [];
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    // A global regex that could match an empty string would never advance.
    if (match[0] === "") {
      pattern.lastIndex++;
      continue;
    }
    const fragment = fragmentOf(text, match.index, match[0].length);
    for (const token of match[0].toLowerCase().split(/[^a-z]+/)) {
      const id = CARD_NAME_TO_ID.get(token);
      if (id !== undefined) matches.push({ id, name: nameOf(id), field, patternIndex, fragment });
    }
  }
  return matches;
}

/** Drops duplicate (field, pattern, card) rows while keeping the first fragment seen. */
function dedupe(matches: InventedCardMatch[]): InventedCardMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.field}|${match.patternIndex ?? ""}|${match.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function findInventedCards(answer: SimpleAnswer, drawnCardIds: number[]): InventedCardMatch[] {
  const drawn = new Set(drawnCardIds);
  const matches: InventedCardMatch[] = [];

  // Strict source: a canonical card name in a pattern label is always a card reference.
  answer.patterns.forEach((pattern, patternIndex) => {
    for (const label of pattern.cards) {
      for (const match of matchesIn(label, ANY_CARD_PATTERN, "pattern", patternIndex)) {
        if (!drawn.has(match.id)) matches.push(match);
      }
    }
  });

  // Prose: explicit references only.
  const proseFields: { field: InventedCardField; text: string; patternIndex?: number }[] = [
    { field: "answer", text: answer.answer },
    { field: "reading", text: answer.reading },
    ...answer.patterns.map((pattern, patternIndex) => ({
      field: "pattern-meaning" as const,
      text: pattern.meaning,
      patternIndex,
    })),
  ];
  if (answer.timing) proseFields.push({ field: "timing", text: answer.timing });

  for (const { field, text, patternIndex } of proseFields) {
    for (const match of matchesIn(text, EXPLICIT_REFERENCE_PATTERN, field, patternIndex)) {
      if (!drawn.has(match.id)) matches.push(match);
    }
  }

  return dedupe(matches);
}
