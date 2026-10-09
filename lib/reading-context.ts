import type { Card } from "@/lib/types";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { NormalizedCard, SpreadId } from "@/lib/reading-contract";
import { getDefinition, getLayoutType } from "@/lib/spread-definitions";

/**
 * The reading context contains the cards, their positions, and an optional user-selected
 * reading focus. It does not identify people or infer relationships from that selection.
 */

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
  significatorPreference: "woman" | "man" | "both";
}

/**
 * Linear position labels come straight from the canonical spread definition, so the
 * prompt and the UI can never describe a line differently. The server supplies these as
 * positional descriptors only; it does not assert that the last card is an outcome.
 */
function buildLinearSentenceLayout(spreadId: SpreadId, cards: NormalizedCard[]): LinearSentenceLayout {
  const defined = getDefinition(spreadId)?.positions ?? [];
  const positions =
    defined.length > 0
      ? defined.map((position) => ({ index: position.index, role: position.label }))
      : cards.map((_, index) => ({ index, role: `Card ${index + 1}` }));
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
      layout = buildLinearSentenceLayout(spreadId, cards);
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
    significatorPreference,
  };
}
