import { Card, Reading, ReadingCard } from "./types";
import { CANONICAL_PAIRS, CARD_CATALOG, type CanonicalPair } from "@/lib/card-catalog";

const cards = CARD_CATALOG;

export function getCards(): Card[] {
  return cards;
}



export function getCardById(allCards: Card[], id: number): Card | undefined {
  return allCards.find((card) => card.id === id);
}

export async function decodeReadingFromUrl(encoded: string): Promise<Partial<Reading> | null> {
  try {
    const response = await fetch(`/api/readings/share?encoded=${encodeURIComponent(encoded)}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data.c) || typeof data.l !== "number") return null;
    return {
      title: String(data.t || ""),
      question: String(data.q || ""),
      layoutType: data.l,
      cards: data.c.map((card: any) => ({
        id: Number(card.i) || 0,
        position: Number(card.p) || 0,
      })),
    };
  } catch {
    return null;
  }
}

export function getCombinationMeaning(
  card1: Card,
  card2: Card,
  card1Position?: number,
  card2Position?: number,
): string | null {
  const useCard1Perspective = card1Position !== undefined && card2Position !== undefined
    ? card1Position <= card2Position
    : true;
  const first = useCard1Perspective ? card1 : card2;
  const second = useCard1Perspective ? card2 : card1;
  return getCanonicalPairMeaning(first.id, second.id);
}

export function getCanonicalPairMeaning(
  firstCardId: number,
  secondCardId: number,
  pairs: CanonicalPair[] = CANONICAL_PAIRS,
): string | null {
  return pairs.find(
    (pair) => pair.firstCardId === firstCardId && pair.secondCardId === secondCardId,
  )?.meaning ?? null;
}

export function getLinearAdjacentCards(cards: ReadingCard[], currentIndex: number): ReadingCard[] {
  if (currentIndex < 0 || currentIndex >= cards.length) return [];
  const adjacent: ReadingCard[] = [];
  if (currentIndex > 0) adjacent.push(cards[currentIndex - 1]);
  if (currentIndex < cards.length - 1) adjacent.push(cards[currentIndex + 1]);
  return adjacent;
}

export function getGrandTableauAdjacentCards(cards: ReadingCard[], currentIndex: number): ReadingCard[] {
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= 36) return [];
  const row = Math.floor(currentIndex / 9);
  const col = currentIndex % 9;
  const cardByPosition = new Map(cards.map((card) => [card.position, card]));
  const adjacent: ReadingCard[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      const neighbourRow = row + rowOffset;
      const neighbourColumn = col + columnOffset;
      if (neighbourRow < 0 || neighbourRow >= 4 || neighbourColumn < 0 || neighbourColumn >= 9) continue;
      const neighbour = cardByPosition.get(neighbourRow * 9 + neighbourColumn);
      if (neighbour) adjacent.push(neighbour);
    }
  }

  return adjacent;
}
