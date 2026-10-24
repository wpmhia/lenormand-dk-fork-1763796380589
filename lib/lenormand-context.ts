import {
  SIMPLE_LENORMAND_SYSTEM_PROMPT,
  buildReadingFacts,
  JSON_OUTPUT_CONTRACT,
  READABLE_OUTPUT_CONTRACT,
} from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { normalizeReadingRequest } from "@/lib/reading-contract";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import type { SpreadId } from "@/lib/spread-definitions";

/**
 * The single source of the Lenormand reading context. DeepSeek receives it through the API and
 * "Copy for AI" receives the same content as one text, so the facts and the interpretation
 * instructions cannot diverge. Only the packaging differs.
 *
 * Input is the same for both paths: the spread id, the question, and the drawn cards as catalogue
 * ids with their positions. Validation and normalisation go through the same function the API uses.
 */
export interface LenormandContext {
  /** The interpretation instructions (identical for every model). */
  instructions: string;
  /** The facts: question, spread, drawn cards in order, geometry, houses and significators. */
  facts: string;
  /** The output contract the API parses. Only the API path uses it. */
  jsonOutput: string;
  /** The readable output contract for external assistants. Only Copy for AI uses it. */
  readableOutput: string;
}

export interface RawDrawnCard {
  id: number;
  position: number;
}

/**
 * Builds the shared context. Throws a ValidationError for an invalid spread, card or position,
 * exactly as the API does. Nothing here calls a model.
 */
export function buildLenormandContext(
  spreadId: SpreadId,
  question: string,
  drawn: RawDrawnCard[],
  significatorPreference: "woman" | "man" | "both" = "both",
): LenormandContext {
  const cardsMap = getCardCatalogMap();
  const validated = normalizeReadingRequest(
    { spreadId, question, cards: drawn, significatorPreference },
    cardsMap,
  );
  const context = buildReadingContext(
    validated.spreadId,
    validated.question,
    validated.cards,
    cardsMap,
    validated.significatorPreference,
  );
  return {
    instructions: SIMPLE_LENORMAND_SYSTEM_PROMPT,
    facts: buildReadingFacts(context),
    jsonOutput: JSON_OUTPUT_CONTRACT,
    readableOutput: READABLE_OUTPUT_CONTRACT,
  };
}

export { CARD_CATALOG };
