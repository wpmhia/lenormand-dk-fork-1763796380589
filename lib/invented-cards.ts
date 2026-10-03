import { CARD_CATALOG, CARD_NAME_TO_ID } from "@/lib/card-catalog";
import type { SimpleAnswer } from "@/lib/simple-answer";

/**
 * Grounding check: the model may not introduce a card that was not drawn.
 *
 * This is the last deterministic gate before a reading reaches a user, and it is the
 * one guarantee a Lenormand reading cannot survive without: a fabricated card is not a
 * stylistic flaw, it is a false statement about the user's spread.
 *
 * The hard part is that roughly half of the deck is also an ordinary English word.
 * House, Tree, Bear, Heart, Ring, Sun, Moon, Key, Fish, Cross, Man, Woman, Child,
 * Dog, Letter, Book, Mice and friends all occur constantly in normal prose, so a naive
 * name scan would reject perfectly good readings ("the heart of it", "a key part",
 * "their home will feel lighter"). Detection is therefore split by field:
 *
 * - Label fields (`cards[].combination`, `keyPatterns[].cards`,
 *   `housesAndMirrors[].house`) exist precisely to name cards, so a full scan is safe.
 * - Prose fields only flag a card on an explicit Lenormand reference (`A + B`, `the A
 *   card`, `card A`) or on a bare mention of a name that is not an everyday noun.
 */

const CANONICAL_CARD_NAMES = [...CARD_NAME_TO_ID.keys()];

function namesOf(ids: Set<number>): string[] {
  return CARD_CATALOG.filter((card) => ids.has(card.id)).map((card) => card.name);
}

/**
 * Card names so unlikely in ordinary English that a bare mention is a card reference in
 * any casing. Matching these case-insensitively is safe: "coffin", "scythe", "clover",
 * "lily", "stork" and "rider" are not words a reading reaches for incidentally, so
 * "Rider", "rider" and "the rider card" are all caught.
 *
 * The remaining distinctive names (Clouds, Birds, Anchor, Whip, Bouquet, Snake, Fox) are
 * deliberately NOT matched bare. They are ordinary words that a sentence can begin with
 * ("Clouds gather over this", "Birds of a feather", "Anchors the plan"), and a false
 * positive here rejects an entire reading, so they are only caught through the strict
 * label scan or an explicit `A + B` / `the A card` reference.
 */
const DISTINCTIVE_BARE_CARD_IDS = new Set([
  1, // Rider
  2, // Clover
  8, // Coffin
  10, // Scythe
  17, // Stork
  30, // Lily
]);

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

const ANY_CARD_PATTERN = new RegExp(`\\b(?:${alternation(CANONICAL_CARD_NAMES)})\\b`, "gi");

/** `Rider + Heart`, `Rider+Heart`, `the Rider card`, `card Rider`, in any casing. */
const EXPLICIT_REFERENCE_PATTERN = new RegExp(
  `\\b(?:${alternation(CANONICAL_CARD_NAMES)})\\b\\s*(?:\\+|,|and)\\s*\\b(?:${alternation(CANONICAL_CARD_NAMES)})\\b` +
    `|\\b(?:the\\s+)?(?:${alternation(CANONICAL_CARD_NAMES)})\\s+card\\b` +
    `|\\bcard\\s+(?:${alternation(CANONICAL_CARD_NAMES)})\\b`,
  "gi",
);

/** Bare mention of a distinctive name, lower- or capitalised. */
const DISTINCTIVE_BARE_PATTERN = new RegExp(`\\b(?:${alternation(namesOf(DISTINCTIVE_BARE_CARD_IDS))})\\b`, "gi");

function idsFrom(text: string, pattern: RegExp): number[] {
  const ids: number[] = [];
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    // A global regex that can match an empty string would never advance.
    if (match[0] === "") pattern.lastIndex++;
    for (const name of match[0].toLowerCase().split(/[^a-z]+/)) {
      const id = CARD_NAME_TO_ID.get(name);
      if (id) ids.push(id);
    }
  }
  return ids;
}

/**
 * House labels follow the convention "<Card> house" or "House of <Card>". The word
 * "House" is itself a card (id 4), so the wrapper is stripped before scanning,
 * otherwise every well-formed house label reads as a reference to the House card.
 */
function houseLabelText(label: string): string {
  return label.replace(/^\s*house\s+of\s+/i, "").replace(/\s+houses?\s*$/i, "");
}

/**
 * Label fields whose stated purpose is to name cards. A canonical card name here that
 * was not drawn is always a fabrication, so these are scanned without ambiguity guards.
 */
function labelText(answer: SimpleAnswer): string[] {
  return [
    ...answer.cards.map((card) => card.combination),
    ...answer.keyPatterns.map((pattern) => pattern.cards),
    ...answer.housesAndMirrors.map((item) => houseLabelText(item.house)),
  ];
}

/**
 * Everything the model writes as prose. Half the deck is an ordinary English word, so
 * these fields are only scanned for explicit card references.
 */
function proseText(answer: SimpleAnswer): string[] {
  return [
    answer.directAnswer,
    answer.interpretation,
    ...answer.positiveFactors,
    ...answer.challenges,
    answer.development || "",
    answer.timing || "",
    ...answer.cards.map((card) => card.meaning),
    ...answer.keyPatterns.map((pattern) => pattern.meaning),
    ...answer.housesAndMirrors.map((item) => item.meaning),
  ];
}

export function findInventedCards(answer: SimpleAnswer, drawnCardIds: number[]): number[] {
  const drawn = new Set(drawnCardIds);
  const invented = new Set<number>();

  for (const text of labelText(answer)) {
    for (const id of idsFrom(text, ANY_CARD_PATTERN)) {
      if (!drawn.has(id)) invented.add(id);
    }
  }

  for (const text of proseText(answer)) {
    for (const id of idsFrom(text, EXPLICIT_REFERENCE_PATTERN)) {
      if (!drawn.has(id)) invented.add(id);
    }
    for (const id of idsFrom(text, DISTINCTIVE_BARE_PATTERN)) {
      if (!drawn.has(id)) invented.add(id);
    }
  }

  return [...invented].sort((a, b) => a - b);
}