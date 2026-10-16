import type { NormalizedCard, SpreadId } from "@/lib/reading-contract";

/**
 * What the reading needs: the question, the drawn cards in order, and the spread id. The
 * prompt derives the grid, houses and significators from these directly.
 */
export interface ReadingContext {
  spreadId: SpreadId;
  question: string;
  cards: NormalizedCard[];
  significatorPreference: "woman" | "man" | "both";
}

export function buildReadingContext(
  spreadId: SpreadId,
  question: string,
  cards: NormalizedCard[],
  _cardsMap?: unknown,
  significatorPreference: "woman" | "man" | "both" = "both",
): ReadingContext {
  return { spreadId, question, cards, significatorPreference };
}
