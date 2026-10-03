import type { Card } from "@/lib/types";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { NormalizedCard, SpreadId } from "@/lib/reading-contract";
import { getLayoutType } from "@/lib/spread-definitions";

/**
 * The reading context is the cards, where they sit, and who the user bound them to.
 *
 * It no longer contains a question domain, a question frame, a parsed semantic question,
 * weighted adjacency pairs, traditional pair meanings, timing evidence or topic focus.
 * Every one of those was the server forming an opinion about the reading before the model
 * saw it. What remains is either user-declared (a binding) or positional (a layout), which
 * is exactly the line this architecture draws: code knows where the cards are.
 */

export interface PersonBinding {
  cardId: 28 | 29;
  source: "explicit-significator";
  evidence: string;
}

export interface SingleCardLayout {
  type: "single";
}

export interface LinearSentencePosition {
  index: number;
  role: string;
}

export interface LinearSentenceLayout {
  type: "linear-sentence";
  positions: LinearSentencePosition[];
}

export interface GridCell {
  index: number;
  card: NormalizedCard;
}

export interface PetitTableauLayout {
  type: "petit-tableau";
  center: GridCell;
}

export interface HousePlacement {
  position: number;
  houseCardId: number;
  houseName: string;
  occupyingCard: NormalizedCard;
}

export interface SignificatorInfo {
  index: number;
  card: NormalizedCard;
}

export interface GrandTableauLayout {
  type: "grand-tableau";
  houses: HousePlacement[];
  significators: {
    woman?: SignificatorInfo;
    man?: SignificatorInfo;
  };
  significatorPreference: "woman" | "man" | "both";
}

export type ReadingLayout =
  | SingleCardLayout
  | LinearSentenceLayout
  | PetitTableauLayout
  | GrandTableauLayout;

export interface ReadingContext {
  spreadId: SpreadId;
  question: string;
  situationContext: string;
  cards: NormalizedCard[];
  layout: ReadingLayout;
  personBindings: PersonBinding[];
}

/**
 * The 3-card sentence is the one linear spread with traditional position meanings, so its
 * roles are supplied. The 5-card line is a house construct: it gets neutral ordinal labels
 * and no "this position is the outcome" claim, which would licence the model to treat the
 * last card as a verdict.
 */
const SENTENCE_3_POSITIONS: LinearSentencePosition[] = [
  { index: 0, role: "Opening card" },
  { index: 1, role: "Central card" },
  { index: 2, role: "Closing card" },
];

function ordinal(index: number): string {
  return ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh"][index] ?? `Card ${index + 1}`;
}

function buildLinearSentenceLayout(cards: NormalizedCard[]): LinearSentenceLayout {
  const positions =
    cards.length === 3
      ? SENTENCE_3_POSITIONS
      : cards.map((_, index) => ({ index, role: `${ordinal(index)} card` }));
  return { type: "linear-sentence", positions };
}

function buildPetitTableauLayout(cards: NormalizedCard[]): PetitTableauLayout {
  return { type: "petit-tableau", center: { index: 4, card: cards[4] } };
}

function buildGrandTableauLayout(
  cards: NormalizedCard[],
  significatorPreference: "woman" | "man" | "both",
): GrandTableauLayout {
  const houseNames = [...CARD_CATALOG].sort((a, b) => a.id - b.id).map((card) => card.name);
  const houses: HousePlacement[] = cards.map((card, index) => ({
    position: index + 1,
    houseCardId: CARD_CATALOG[index]?.id ?? index + 1,
    houseName: houseNames[index] ?? `Position ${index + 1}`,
    occupyingCard: card,
  }));

  const significators: GrandTableauLayout["significators"] = {};
  const manIndex = cards.findIndex((card) => card.id === 28);
  if (manIndex !== -1) significators.man = { index: manIndex, card: cards[manIndex] };
  const womanIndex = cards.findIndex((card) => card.id === 29);
  if (womanIndex !== -1) significators.woman = { index: womanIndex, card: cards[womanIndex] };

  return { type: "grand-tableau", houses, significators, significatorPreference };
}

/**
 * A person card is bound only when the user explicitly selected it. The previous grammar
 * heuristic that guessed at husband/wife/partner from the question text is gone: it
 * fabricated identity, and a card the user did not bind is simply an unassigned person
 * reference the model must not turn into a specific individual.
 */
function explicitPersonBindings(preference: "woman" | "man" | "both"): PersonBinding[] {
  if (preference === "woman") {
    return [{ cardId: 29, source: "explicit-significator", evidence: "The request explicitly selected Woman as the significator." }];
  }
  if (preference === "man") {
    return [{ cardId: 28, source: "explicit-significator", evidence: "The request explicitly selected Man as the significator." }];
  }
  return [];
}

export function buildReadingContext(
  spreadId: SpreadId,
  question: string,
  cards: NormalizedCard[],
  _cardsMap?: Map<number, Card>,
  significatorPreference: "woman" | "man" | "both" = "both",
  situationContext = "",
): ReadingContext {
  const layoutType = getLayoutType(spreadId);
  let layout: ReadingLayout;

  switch (layoutType) {
    case "linear-sentence":
      layout = buildLinearSentenceLayout(cards);
      break;
    case "petit-tableau":
      layout = buildPetitTableauLayout(cards);
      break;
    case "grand-tableau":
      layout = buildGrandTableauLayout(cards, significatorPreference);
      break;
    default:
      layout = { type: "single" };
  }

  return {
    spreadId,
    question,
    situationContext,
    cards,
    layout,
    personBindings: explicitPersonBindings(significatorPreference),
  };
}