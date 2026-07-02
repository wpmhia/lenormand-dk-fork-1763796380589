import { z } from "zod";
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
  significatorPreference: z.string().optional().default("both"),
});

export const VALID_SPREADS = buildValidSpreads();

export interface NormalizedCard {
  id: number;
  name: string;
  keywords: string[];
  timing?: string;
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

function sanitize(str: string): string {
  return str
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/["]/g, '"')
    .replace(/\\/g, "\\\\")
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
      const forwardCombo = cardA.combos?.find((c) => c.withCardId === cardB.id);
      const reverseCombo = cardB.combos?.find((c) => c.withCardId === cardA.id);
      const meaning = [forwardCombo?.meaning, reverseCombo?.meaning].filter(Boolean).join(" - ");
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
  const significatorPreference: SignificatorPreference =
    data.significatorPreference === "woman" || data.significatorPreference === "man" || data.significatorPreference === "both"
      ? data.significatorPreference
      : "both";
  const sanitizedQuestion = sanitize(data.question);
  const expectedCount = VALID_SPREADS[data.spreadId];

  if (data.cards.length !== expectedCount) {
    throw new ValidationError(
      `Spread "${data.spreadId}" requires exactly ${expectedCount} cards, got ${data.cards.length}`,
    );
  }

  const seen = new Set<number>();
  const cards: NormalizedCard[] = [];

  for (const rawCard of data.cards) {
    if (seen.has(rawCard.id)) {
      throw new ValidationError(`Duplicate card id: ${rawCard.id}`);
    }
    seen.add(rawCard.id);

    const cardData = cardsMap.get(rawCard.id);
    if (!cardData) {
      throw new ValidationError(`Card id ${rawCard.id} not found`);
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
    spreadId: data.spreadId,
    cards,
    comboHints,
    significatorPreference,
  };
}
