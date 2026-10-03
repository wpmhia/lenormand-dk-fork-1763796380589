import staticCardsData from "@/public/data/cards.json";
import type { Card } from "@/lib/types";

export const CARD_CATALOG = staticCardsData as Card[];

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
