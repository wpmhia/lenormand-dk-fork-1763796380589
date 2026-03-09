import { Card, Reading, ReadingCard } from "./types";
import staticCardsData from "@/public/data/cards.json";

const cards = staticCardsData as Card[];

export function getCards(): Card[] {
  return cards;
}

export type CardSummary = Card;
export type CardLookup = Card;

export function getCardSummaries(): Card[] {
  return cards;
}

export function getCardLookupData(): Card[] {
  return cards;
}

export function getCardById(allCards: Card[], id: number): Card | undefined {
  return allCards.find((card) => card.id === id);
}

export async function encodeReadingForUrl(reading: Reading): Promise<string> {
  const response = await fetch("/api/readings/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      t: reading.title,
      q: reading.question,
      l: reading.layoutType,
      c: reading.cards.map((card) => ({ i: card.id, p: card.position })),
    }),
  });
  if (!response.ok) throw new Error("Failed to encode reading");
  const { encoded } = await response.json();
  return encoded;
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

export function drawCards(allCards: Card[], count: number): ReadingCard[] {
  if (count > allCards.length) {
    throw new Error(`Cannot draw ${count} cards from a deck of ${allCards.length}`);
  }
  const available = [...allCards];
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * available.length);
    drawn.push(available.splice(idx, 1)[0]);
  }
  return drawn.map((card, index) => ({ id: card.id, position: index }));
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
  const primary = useCard1Perspective ? card1 : card2;
  const secondary = useCard1Perspective ? card2 : card1;
  const combos = Array.isArray(primary.combos) ? primary.combos : [];
  return combos.find((c) => c.withCardId === secondary.id)?.meaning || null;
}

export function getLinearAdjacentCards(cards: ReadingCard[], currentIndex: number): ReadingCard[] {
  if (currentIndex < 0 || currentIndex >= cards.length) return [];
  const adjacent: ReadingCard[] = [];
  if (currentIndex > 0) adjacent.push(cards[currentIndex - 1]);
  if (currentIndex < cards.length - 1) adjacent.push(cards[currentIndex + 1]);
  return adjacent;
}

export function getGrandTableauAdjacentCards(cards: ReadingCard[], currentIndex: number): ReadingCard[] {
  if (currentIndex < 0 || currentIndex >= 36) return [];
  const row = Math.floor(currentIndex / 9);
  const col = currentIndex % 9;
  const cardByPosition = new Map(cards.map((card) => [card.position, card]));
  const adjacent: ReadingCard[] = [];
  const positions = [
    { r: row - 1, c: col },
    { r: row + 1, c: col },
    { r: row, c: col - 1 },
    { r: row, c: col + 1 },
  ].filter((pos) => pos.r >= 0 && pos.r < 4 && pos.c >= 0 && pos.c < 9);
  for (const pos of positions) {
    const adjCard = cardByPosition.get(pos.r * 9 + pos.c);
    if (adjCard) adjacent.push(adjCard);
  }
  return adjacent;
}

export function getReadingCombinations(
  cards: ReadingCard[],
  allCards: Card[],
): Array<{ card1: Card; card2: Card; position1: number; position2: number; meaning: string | null }> {
  const combinations: Array<{ card1: Card; card2: Card; position1: number; position2: number; meaning: string | null }> = [];
  for (let i = 0; i < cards.length - 1; i++) {
    const currentCard = cards[i];
    const nextCard = cards[i + 1];
    const card1 = getCardById(allCards, currentCard.id);
    const card2 = getCardById(allCards, nextCard.id);
    if (card1 && card2) {
      const meaning = getCombinationMeaning(card1, card2, currentCard.position, nextCard.position);
      if (meaning) {
        combinations.push({ card1, card2, position1: currentCard.position, position2: nextCard.position, meaning });
      }
    }
  }
  return combinations;
}
