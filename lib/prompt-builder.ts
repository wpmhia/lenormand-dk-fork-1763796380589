/**
 * Prompt Builder Utility
 * 
 * Centralized AI prompt generation for different spread types.
 * Makes it easy to adjust prompts and maintain consistency.
 */

import {
  MAX_QUESTION_LENGTH,
  MAX_CARD_NAME_LENGTH,
  AI_ENFORCEMENT_CLAUSE,
} from "./constants";

/**
 * Sanitize user input to prevent prompt injection
 */
function sanitizeInput(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return "";

  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
    .replace(/["]/g, '"') // Escape quotes
    .replace(/\\/g, "\\") // Escape backslashes
    .replace(/\n|\r/g, " "); // Replace newlines
}

/**
 * Build the base persona string with question context
 */
function buildBasePersona(question: string): string {
  const sanitized = sanitizeInput(question, MAX_QUESTION_LENGTH);
  return `You are Marie-Anne Lenormand reading specifically for: "${sanitized || "What do these cards reveal?"}"`;
}

/**
 * Format cards as comma-separated names only (no numbers)
 */
function formatCardList(
  cards: Array<{ id: number; name: string }>,
): string {
  return cards
    .map((c) => sanitizeInput(c.name, MAX_CARD_NAME_LENGTH))
    .join(", ");
}

/**
 * Build prompts for each spread type
 */
const SPREAD_PROMPTS: Record<string, (basePersona: string, cardList: string) => string> = {
  "single-card": (persona, cards) => `${persona}
Card: ${cards}
Give a direct answer based on this card. Keep it practical and concrete. 1-2 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "sentence-3": (persona, cards) => `${persona}
Cards: ${cards}
Read these three cards as a sentence: first card modifies the second, which leads to the third. Be direct and practical. 3-5 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "past-present-future": (persona, cards) => `${persona}
Cards: ${cards}
Read through time: first card is what happened before, second card is the current situation, third card is what's coming. Connect them naturally in one paragraph. 4-5 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "mind-body-spirit": (persona, cards) => `${persona}
Cards: ${cards}
Read through three levels: first card is thoughts/mental state, second is actions/physical situation, third is spiritual/deeper meaning. Connect them naturally. 4-5 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "yes-no-maybe": (persona, cards) => `${persona}
Cards: ${cards}
Start with YES, NO, or MAYBE in caps, then explain why based on the cards. Be direct and practical. 2-3 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "sentence-5": (persona, cards) => `${persona}
Cards: ${cards}
Read all five cards as one connected answer. Each card adds meaning to create the complete picture. 5-7 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "structured-reading": (persona, cards) => `${persona}
Cards: ${cards}
Read as subject → verb → object → modifier → outcome. Connect all five cards to form one clear statement. ${AI_ENFORCEMENT_CLAUSE}`,

  "week-ahead": (persona, cards) => `${persona}
Cards: ${cards}
Read the week ahead: show how each day's card connects to the next. One paragraph showing the progression. 6-8 sentences. No day-by-day listing. ${AI_ENFORCEMENT_CLAUSE}`,

  "relationship-double-significator": (persona, cards) => `${persona}
Cards: ${cards}
Seven cards for two people: your past/present/future, the connection card, their past/present/future. Show how both paths relate. 6-8 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "comprehensive": (persona, cards) => `${persona}
Cards: ${cards}
Read the 3x3 grid: top row is past/context, middle row is present situation, bottom row is future/outcome. Focus on how the center card ties everything together. Two paragraphs. ${AI_ENFORCEMENT_CLAUSE}`,

  "grand-tableau": (persona, cards) => `${persona}
36 cards: ${cards}
Read in three sections: cards 1-12 show the situation, 13-24 show people and relationships, 25-36 show outcome. Exactly 3 paragraphs. Find and mention the Significator (Man-28 or Woman-29). ${AI_ENFORCEMENT_CLAUSE}`,
};

/**
 * Build prompt for AI reading
 */
export function buildPrompt(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  question: string,
): string {
  const persona = buildBasePersona(question);
  const cardList = formatCardList(cards);

  // Use spread-specific prompt if available
  if (SPREAD_PROMPTS[spreadId]) {
    return SPREAD_PROMPTS[spreadId](persona, cardList);
  }

  // Fallback based on card count
  const cardCount = cards.length;

  if (cardCount === 1) {
    return SPREAD_PROMPTS["single-card"](persona, cardList);
  } else if (cardCount === 3) {
    return SPREAD_PROMPTS["sentence-3"](persona, cardList);
  } else if (cardCount === 5) {
    return SPREAD_PROMPTS["sentence-5"](persona, cardList);
  } else if (cardCount === 7) {
    return `${persona}
Cards: ${cardList}
Read these seven cards as one connected answer. 6-8 sentences. ${AI_ENFORCEMENT_CLAUSE}`;
  } else if (cardCount === 9) {
    return SPREAD_PROMPTS["comprehensive"](persona, cardList);
  } else if (cardCount === 36) {
    return SPREAD_PROMPTS["grand-tableau"](persona, cardList);
  }

  // Ultimate fallback
  return `${persona}
Cards: ${cardList}
Read the cards together to form one clear answer. Be direct and practical. ${AI_ENFORCEMENT_CLAUSE}`;
}

/**
 * Sanitize question input for use in prompts
 */
export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

/**
 * Sanitize card name for use in prompts
 */
export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}
