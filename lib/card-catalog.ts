import cardCatalogData from "@/public/data/cards.json";
import canonicalPairsData from "@/public/data/canonical-pairs.json";
import cardMeaningSourceData from "@/public/data/card-meaning-sources.json";
import type { Card } from "@/lib/types";

export interface CanonicalPair {
  firstCardId: number;
  secondCardId: number;
  meaning: string;
  sourceIds: string[];
  reviewStatus: string;
}

export interface CardMeaningSource {
  id: string;
  title: string;
  url: string;
  kind: string;
  scope: string;
}

const catalog = cardCatalogData as Card[];
const meaningSourceRegistry = cardMeaningSourceData as { sources: CardMeaningSource[] };
const pairRegistry = canonicalPairsData as { pairs: CanonicalPair[] };

export const CARD_CATALOG = catalog;
export const CARD_MEANING_SOURCES = meaningSourceRegistry.sources;
export const CANONICAL_PAIRS = pairRegistry.pairs;

// Names that readers may use while the numbered catalog remains canonical.
// Card 22 is canonically "Paths" in cards.json. "Crossroads" is the traditional name for
// the same card and is still accepted, so older and user-facing terminology resolves to
// the canonical id. Aliases must never duplicate a canonical name.
const ALIASES_BY_ID: Record<number, string[]> = { 22: ["crossroads"] };

export const CARD_NAME_TO_ID = new Map(
  CARD_CATALOG.flatMap((card) => [
    [card.name.toLowerCase(), card.id] as const,
    ...(ALIASES_BY_ID[card.id] ?? []).map((alias) => [alias, card.id] as const),
  ]),
);

export function getCardCatalogMap(): Map<number, Card> {
  return new Map(CARD_CATALOG.map((card) => [card.id, card]));
}
