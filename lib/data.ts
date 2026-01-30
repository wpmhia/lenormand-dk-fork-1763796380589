import { Card, Reading, ReadingCard } from "./types";
import staticCardsData from "@/public/data/cards.json";

// HMAC signing for URL-shared readings (security fix)
const READING_HMAC_SECRET =
  process.env.READING_HMAC_SECRET || "default-dev-key-change-in-production";

async function generateHMAC(data: string): Promise<string> {
  if (typeof window === "undefined") {
    // Node.js (server-side)
    const crypto = await import("crypto");
    return crypto
      .createHmac("sha256", READING_HMAC_SECRET)
      .update(data)
      .digest("hex")
      .slice(0, 16); // Use first 16 chars for URL shortness
  } else {
    // Browser (client-side) - use SubtleCrypto
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(READING_HMAC_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data),
    );
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex.slice(0, 16);
  }
}

export async function getCards(): Promise<Card[]> {
  const data = staticCardsData as Card[];

  if (!Array.isArray(data) || data.length === 0) {
    console.error("Invalid or empty cards data");
    return [];
  }

  return data;
}

export interface CardSummary {
  id: number;
  name: string;
  number: number;
  keywords: string[];
  imageUrl: string | null;
  uprightMeaning: string;
}

export async function getCardSummaries(): Promise<CardSummary[]> {
  const data = staticCardsData as Card[];

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map((card) => ({
    id: card.id,
    name: card.name,
    number: card.number,
    keywords: card.keywords,
    imageUrl: card.imageUrl,
    uprightMeaning: card.uprightMeaning,
  }));
}

export interface CardLookup {
  id: number;
  name: string;
  combos?: { withCardId: number; meaning: string }[];
}

export async function getCardLookupData(): Promise<CardLookup[]> {
  const data = staticCardsData as Card[];

  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map((card) => ({
    id: card.id,
    name: card.name,
    combos: card.combos?.slice(0, 10).map((c) => ({
      withCardId: c.withCardId,
      meaning: c.meaning,
    })),
  }));
}

export function getCardById(cards: Card[], id: number): Card | undefined {
  return cards.find((card) => card.id === id);
}

// Encode reading data for URL sharing with HMAC signature
export async function encodeReadingForUrl(reading: Reading): Promise<string> {
  const data = {
    t: reading.title,
    q: reading.question,
    l: reading.layoutType,
    c: reading.cards.map((card) => ({
      i: card.id,
      p: card.position,
    })),
  };
  const json = JSON.stringify(data);
  const base64 = btoa(json).replace(
    /[+/=]/g,
    (c) =>
      ({
        "+": "-",
        "/": "_",
        "=": "",
      })[c] || c,
  );

  // Add HMAC signature for verification
  const hmac = await generateHMAC(base64);
  return `${base64}.${hmac}`;
}

// Decode reading data from URL with HMAC validation
export async function decodeReadingFromUrl(
  encoded: string,
): Promise<Partial<Reading> | null> {
  try {
    // Split signature from data
    const [base64WithPad, providedHmac] = encoded.split(".");

    if (!base64WithPad || !providedHmac) {
      return null; // Invalid format
    }

    // Verify HMAC signature
    const computedHmac = await generateHMAC(base64WithPad);
    if (computedHmac !== providedHmac) {
      console.warn(
        "HMAC signature validation failed - URL may have been tampered with",
      );
      return null;
    }

    const base64 = base64WithPad.replace(
      /[-_]/g,
      (c) => ({ "-": "+", _: "/" })[c] || c,
    );
    const padLength = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64 + "=".repeat(padLength);
    const json = atob(paddedBase64);
    const data = JSON.parse(json);

    // Validate data structure to prevent XSS
    if (!Array.isArray(data.c) || typeof data.l !== "number") {
      return null;
    }

    return {
      title: String(data.t || ""),
      question: String(data.q || ""),
      layoutType: data.l,
      cards: data.c.map((card: any) => ({
        id: Number(card.i) || 0,
        position: Number(card.p) || 0,
      })),
    };
  } catch (error) {
    console.warn("Error decoding reading from URL:", error);
    return null;
  }
}

// Draw cards for reading - ensures complete randomness with no repetition
export function drawCards(cards: Card[], count: number): ReadingCard[] {
  if (count > cards.length) {
    throw new Error(
      `Cannot draw ${count} cards from a deck of ${cards.length}`,
    );
  }

  // Create a copy of the cards array to avoid modifying the original
  const availableCards = [...cards];
  const drawnCards: Card[] = [];

  // Draw cards randomly without replacement for complete uniqueness
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const drawnCard = availableCards.splice(randomIndex, 1)[0];
    drawnCards.push(drawnCard);
  }

  return drawnCards.map((card, index) => ({
    id: card.id,
    position: index,
  }));
}

// Get combination meaning between two cards
export function getCombinationMeaning(
  card1: Card,
  card2: Card,
  card1Position?: number,
  card2Position?: number,
): string | null {
  // For directional combinations, use the card that appears first in the spread
  const useCard1Perspective =
    card1Position !== undefined && card2Position !== undefined
      ? card1Position <= card2Position
      : true; // fallback to original behavior if positions not provided

  const primaryCard = useCard1Perspective ? card1 : card2;
  const secondaryCard = useCard1Perspective ? card2 : card1;

  const combos = Array.isArray(primaryCard.combos) ? primaryCard.combos : [];
  const combo = combos.find((c) => c.withCardId === secondaryCard.id);
  return combo?.meaning || null;
}

// Get adjacent cards for linear layouts (3, 5, 9 cards)
export function getLinearAdjacentCards(
  cards: ReadingCard[],
  currentIndex: number,
): ReadingCard[] {
  const adjacent: ReadingCard[] = [];

  // Check if currentIndex is valid
  if (currentIndex < 0 || currentIndex >= cards.length) {
    return adjacent;
  }

  if (currentIndex > 0) {
    adjacent.push(cards[currentIndex - 1]);
  }
  if (currentIndex < cards.length - 1) {
    adjacent.push(cards[currentIndex + 1]);
  }

  return adjacent;
}

// Get adjacent cards for Grand Tableau (36 cards in 9x4 grid)
export function getGrandTableauAdjacentCards(
  cards: ReadingCard[],
  currentIndex: number,
): ReadingCard[] {
  const adjacent: ReadingCard[] = [];

  // Check if currentIndex is valid
  if (currentIndex < 0 || currentIndex >= 36) {
    return adjacent;
  }

  const row = Math.floor(currentIndex / 9);
  const col = currentIndex % 9;

  // Create position-indexed map for O(1) lookup instead of O(n) search
  const cardByPosition = new Map(cards.map((card) => [card.position, card]));

  // Adjacent positions in grid (top, bottom, left, right)
  const adjacentPositions = [
    { r: row - 1, c: col }, // top
    { r: row + 1, c: col }, // bottom
    { r: row, c: col - 1 }, // left
    { r: row, c: col + 1 }, // right
  ].filter((pos) => pos.r >= 0 && pos.r < 4 && pos.c >= 0 && pos.c < 9);

  adjacentPositions.forEach((pos) => {
    const adjIndex = pos.r * 9 + pos.c;
    const adjCard = cardByPosition.get(adjIndex);
    if (adjCard) adjacent.push(adjCard);
  });

  return adjacent;
}
// Get all combinations of adjacent cards in a reading
export function getReadingCombinations(
  cards: ReadingCard[],
  allCards: Card[],
): Array<{
  card1: Card;
  card2: Card;
  position1: number;
  position2: number;
  meaning: string | null;
}> {
  const combinations: Array<{
    card1: Card;
    card2: Card;
    position1: number;
    position2: number;
    meaning: string | null;
  }> = [];

  // Find combinations between adjacent cards
  for (let i = 0; i < cards.length - 1; i++) {
    const currentCard = cards[i];
    const nextCard = cards[i + 1];

    const card1 = getCardById(allCards, currentCard.id);
    const card2 = getCardById(allCards, nextCard.id);

    if (card1 && card2) {
      const meaning = getCombinationMeaning(
        card1,
        card2,
        currentCard.position,
        nextCard.position,
      );
      if (meaning) {
        combinations.push({
          card1,
          card2,
          position1: currentCard.position,
          position2: nextCard.position,
          meaning,
        });
      }
    }
  }

  return combinations;
}
