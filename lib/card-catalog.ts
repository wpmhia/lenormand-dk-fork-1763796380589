import staticCardsData from "@/public/data/cards.json";
import type { Card } from "@/lib/types";

export const CARD_CATALOG = staticCardsData as Card[];

// Names that readers may use while the numbered catalog remains canonical.
const ALIASES_BY_ID: Record<number, string[]> = { 22: ["paths"] };

export const CARD_NAME_TO_ID = new Map(
  CARD_CATALOG.flatMap((card) => [
    [card.name.toLowerCase(), card.id] as const,
    ...(ALIASES_BY_ID[card.id] ?? []).map((alias) => [alias, card.id] as const),
  ]),
);

export function getCardCatalogMap(): Map<number, Card> {
  return new Map(CARD_CATALOG.map((card) => [card.id, card]));
}
