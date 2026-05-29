import { Card } from "@/lib/types";
import { MAX_QUESTION_LENGTH } from "@/lib/constants";
import { SPREAD_DEFINITIONS, SpreadId } from "@/lib/spread-definitions";

export type { SpreadId };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function buildValidSpreads(): Record<SpreadId, number> {
  const result = {} as Record<SpreadId, number>;
  for (const id of Object.keys(SPREAD_DEFINITIONS) as SpreadId[]) {
    result[id] = SPREAD_DEFINITIONS[id].cardCount;
  }
  return result;
}

export const VALID_SPREADS = buildValidSpreads();

export interface NormalizedCard {
  id: number;
  name: string;
  keywords: string[];
  timing?: string;
  strength?: string;
}

export interface ComboHint {
  cardA: string;
  cardB: string;
  meaning: string;
}

export interface NormalizedReadingRequest {
  question: string;
  spreadId: SpreadId;
  cards: NormalizedCard[];
  comboHints: ComboHint[];
}

export function buildAdjacentComboHints(
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): ComboHint[] {
  const hints: ComboHint[] = [];
  for (let i = 0; i < cards.length - 1; i++) {
    const cardA = cardsMap.get(cards[i].id);
    const cardB = cardsMap.get(cards[i + 1].id);
    if (cardA && cardB) {
      const forwardCombo = cardA.combos?.find(c => c.withCardId === cardB.id);
      const reverseCombo = cardB.combos?.find(c => c.withCardId === cardA.id);
      const meaning = [forwardCombo?.meaning, reverseCombo?.meaning]
        .filter(Boolean)
        .join(" - ");
      if (meaning) {
        hints.push({ cardA: cardA.name, cardB: cardB.name, meaning });
      }
    }
  }
  return hints;
}

export function normalizeReadingRequest(
  body: unknown,
  cardsMap: Map<number, Card>,
): NormalizedReadingRequest {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const data = body as Record<string, unknown>;

  const question = typeof data.question === "string" ? data.question : "";
  const sanitizedQuestion = question
    .slice(0, MAX_QUESTION_LENGTH)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/["]/g, '"')
    .replace(/\\/g, "\\\\")
    .replace(/\n|\r/g, " ");

  const spreadId = data.spreadId;
  if (typeof spreadId !== "string" || !(spreadId in VALID_SPREADS)) {
    throw new ValidationError(
      `Invalid spreadId. Must be one of: ${Object.keys(VALID_SPREADS).join(", ")}`,
    );
  }
  const expectedCount = VALID_SPREADS[spreadId as SpreadId];

  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    throw new ValidationError("Cards must be a non-empty array");
  }

  if (data.cards.length !== expectedCount) {
    throw new ValidationError(
      `Spread "${spreadId}" requires exactly ${expectedCount} cards, got ${data.cards.length}`,
    );
  }

  const seen = new Set<number>();
  const cards: NormalizedCard[] = [];

  for (let i = 0; i < data.cards.length; i++) {
    const card = data.cards[i];
    if (!card || typeof card !== "object") {
      throw new ValidationError(`Card at index ${i} must be an object`);
    }

    const id = (card as Record<string, unknown>).id;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1 || id > 36) {
      throw new ValidationError(`Card at index ${i} has invalid id: must be an integer 1-36`);
    }

    if (seen.has(id)) {
      throw new ValidationError(`Duplicate card id: ${id}`);
    }
    seen.add(id);

    const cardData = cardsMap.get(id);
    if (!cardData) {
      throw new ValidationError(`Card id ${id} not found`);
    }

    cards.push({
      id: cardData.id,
      name: cardData.name,
      keywords: cardData.keywords || [],
      timing: cardData.timing,
      strength: cardData.strength,
    });
  }

  const comboHints = cards.length > 1 ? buildAdjacentComboHints(cards, cardsMap) : [];

  return {
    question: sanitizedQuestion,
    spreadId: spreadId as SpreadId,
    cards,
    comboHints,
  };
}
