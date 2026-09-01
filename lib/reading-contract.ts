import { z } from "zod";
import { Card } from "@/lib/types";
import { MAX_QUESTION_LENGTH } from "@/lib/constants";
import { SPREAD_DEFINITIONS, SpreadId } from "@/lib/spread-definitions";
import { getCanonicalLenormandPairMeaning } from "@/lib/pair-meaning";

export type { SpreadId };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function buildValidSpreads(): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [id, def] of Object.entries(SPREAD_DEFINITIONS)) {
    result[id] = def.cardCount;
  }
  return result;
}

const spreadIdSchema = z
  .string()
  .refine((val) => val in SPREAD_DEFINITIONS, {
    message: `Invalid spreadId. Must be one of: ${Object.keys(SPREAD_DEFINITIONS).join(", ")}`,
  })
  .transform((val) => val as SpreadId);

const rawCardSchema = z.object({
  id: z.number().int().min(1).max(36),
  position: z.number().optional(),
});

const bodySchema = z.object({
  question: z.string().max(MAX_QUESTION_LENGTH).optional().default(""),
  spreadId: spreadIdSchema,
  cards: z.array(rawCardSchema).min(1),
  significatorPreference: z.enum(["woman", "man", "both"]).optional().default("both"),
});

export const VALID_SPREADS = buildValidSpreads();

export interface NormalizedCard {
  id: number;
  name: string;
  keywords: string[];
  strength?: string;
}

interface ComboHint {
  cardA: string;
  cardB: string;
  meaning: string;
}

type SignificatorPreference = "woman" | "man" | "both";

interface NormalizedReadingRequest {
  question: string;
  spreadId: SpreadId;
  cards: NormalizedCard[];
  comboHints: ComboHint[];
  significatorPreference: SignificatorPreference;
}

function normalizeQuestion(str: string): string {
  return str
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/["]/g, '"')
    .replace(/\n|\r/g, " ");
}

function buildAdjacentComboHints(
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): ComboHint[] {
  const hints: ComboHint[] = [];
  for (let i = 0; i < cards.length - 1; i++) {
    const cardA = cardsMap.get(cards[i].id);
    const cardB = cardsMap.get(cards[i + 1].id);
    if (cardA && cardB) {
      const meaning = getCanonicalLenormandPairMeaning(cardA.id, cardB.id);
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
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new ValidationError(first?.message || "Invalid request body");
  }

  const data = parsed.data;
  const significatorPreference: SignificatorPreference = data.significatorPreference;
  const normalizedQuestion = normalizeQuestion(data.question);
  const expectedCount = VALID_SPREADS[data.spreadId];

  if (data.cards.length !== expectedCount) {
    throw new ValidationError(
      `Spread "${data.spreadId}" requires exactly ${expectedCount} cards, got ${data.cards.length}`,
    );
  }

  const seen = new Set<number>();
  const cards: NormalizedCard[] = [];

  for (let i = 0; i < data.cards.length; i++) {
    const rawCard = data.cards[i];
    if (seen.has(rawCard.id)) {
      throw new ValidationError(`Duplicate card id: ${rawCard.id}`);
    }
    seen.add(rawCard.id);

    const cardData = cardsMap.get(rawCard.id);
    if (!cardData) {
      throw new ValidationError(`Card id ${rawCard.id} not found`);
    }

    if (rawCard.position !== undefined) {
      if (!Number.isInteger(rawCard.position) || rawCard.position < 0 || rawCard.position >= expectedCount) {
        throw new ValidationError(`Card id ${rawCard.id} has invalid position ${rawCard.position} for spread requiring ${expectedCount} cards`);
      }
    }

    cards.push({
      id: cardData.id,
      name: cardData.name,
      keywords: cardData.keywords || [],
      strength: cardData.strength,
    });
  }

  const positionMap = new Map<number, number>();
  for (let i = 0; i < data.cards.length; i++) {
    const pos = data.cards[i].position;
    if (pos === undefined) continue;
    if (positionMap.has(pos)) {
      throw new ValidationError(`Duplicate position ${pos} on cards ${positionMap.get(pos)} and ${data.cards[i].id}`);
    }
    positionMap.set(pos, data.cards[i].id);
  }

  const hasAnyPosition = data.cards.some((c) => c.position !== undefined);
  if (hasAnyPosition) {
    for (let p = 0; p < expectedCount; p++) {
      if (!positionMap.has(p)) {
        throw new ValidationError(`Position ${p} is missing for spread "${data.spreadId}"`);
      }
    }
    cards.sort((a, b) => {
      const pa = data.cards.find((c) => c.id === a.id)?.position ?? 0;
      const pb = data.cards.find((c) => c.id === b.id)?.position ?? 0;
      return pa - pb;
    });
  }

  const comboHints = cards.length > 1 ? buildAdjacentComboHints(cards, cardsMap) : [];

  return {
    question: normalizedQuestion,
    spreadId: data.spreadId,
    cards,
    comboHints,
    significatorPreference,
  };
}
