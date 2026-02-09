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

// ============================================================================
// Types
// ============================================================================

export interface AIReadingRequest {
  question: string;
  cards: Array<{
    id: number;
    name: string;
    position: number;
  }>;
  spreadId?: string;
}

export interface AIReadingResponse {
  reading: string;
  aiInterpretationId?: string;
  wasContinued?: boolean;
}

interface CardInput {
  id: number;
  name: string;
  keywords?: string[];
  uprightMeaning?: string;
}

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
 * Build the question context for the reading
 */
function buildQuestionContext(question: string): string {
  const sanitized = sanitizeInput(question, MAX_QUESTION_LENGTH);
  return `Question: "${sanitized || "What do these cards reveal?"}"`;
}

/**
 * Format cards with their keywords for better AI grounding
 * Includes top 3-4 keywords to help the AI understand traditional meanings
 */
function formatCardList(cards: CardInput[]): string {
  return cards
    .map((c) => {
      const name = sanitizeInput(c.name, MAX_CARD_NAME_LENGTH);
      const keywords = c.keywords?.slice(0, 3).join(", ");
      return keywords ? `${name} (${keywords})` : name;
    })
    .join(", ");
}

/**
 * Valid Lenormand card names for output validation
 */
export const VALID_CARD_NAMES = [
  "Rider", "Clover", "Ship", "House", "Tree", "Clouds", "Snake", "Coffin",
  "Bouquet", "Scythe", "Whip", "Birds", "Child", "Fox", "Bear", "Stars",
  "Stork", "Dog", "Tower", "Garden", "Mountain", "Crossroads", "Mice",
  "Heart", "Ring", "Book", "Letter", "Man", "Woman", "Lily", "Sun",
  "Moon", "Key", "Fish", "Anchor", "Cross"
];

/**
 * System prompt to establish AI behavior and quality constraints
 */
export function buildSystemPrompt(): string {
  return `You are a Lenormand fortune teller. Give direct readings using the cards shown.

RULES:
- Write complete sentences with proper grammar
- Use only cards shown - no invented dates, times, or details
- Cards: ${VALID_CARD_NAMES.join(", ")}
- Use card names, never numbers
- No bullet points, lists, or "First card:" labels
- Weave cards into one flowing narrative
- Preserve proper nouns exactly as written`;
}

/**
 * Build prompts for each spread type
 */
const SPREAD_PROMPTS: Record<string, (questionContext: string, cardList: string) => string> = {
  "single-card": (question, cards) => `${question}
Card: ${cards}

Give a direct answer based on this card for their situation. 1-2 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "sentence-3": (question, cards) => `${question}
Cards: ${cards}

Read as one flowing story: first card sets up, second is the turning point, third shows where it leads. 4-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "past-present-future": (question, cards) => `${question}
Cards: ${cards}

Show how past led to present and what future holds. One paragraph, 5-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "mind-body-spirit": (question, cards) => `${question}
Cards: ${cards}

First card: mind/thoughts. Second: body/actions. Third: deeper meaning. Show how all three connect. 4-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "yes-no-maybe": (question, cards) => `${question}
Cards: ${cards}

Answer: YES, NO, or MAYBE. Then explain what the cards show. 2-3 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "sentence-5": (question, cards) => `${question}
Cards: ${cards}

Five cards tell the complete story. Show the core situation, what's changing, and where it leads. 5-7 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "structured-reading": (question, cards) => `${question}
Cards: ${cards}

Five-card sentence: subject, verb, object, modifier, outcome. Connect them into one clear statement. ${AI_ENFORCEMENT_CLAUSE}`,

  "week-ahead": (question, cards) => `${question}
Cards: ${cards}

Show how the week unfolds day by day as a continuous narrative. One paragraph, 6-8 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "relationship-double-significator": (question, cards) => `${question}
Cards: ${cards}

Seven cards: your past/present/future, the connection, their past/present/future. Show how both paths relate. 6-8 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "comprehensive": (question, cards) => `${question}
Cards: ${cards}

3x3 grid: top row is past, middle is present, bottom is future. Center card ties it together. TWO paragraphs. ${AI_ENFORCEMENT_CLAUSE}`,

  "grand-tableau": (question, cards) => `${question}
36 cards: ${cards}

Three sections: 1-12 (situation), 13-24 (people), 25-36 (outcome). Find the Significator. THREE paragraphs. ${AI_ENFORCEMENT_CLAUSE}`,
};

/**
 * Detect if question is a yes/no type
 */
function isYesNoQuestion(question: string): boolean {
  return /^(will|is|are|can|should|do|does|did|could|would|may|might)\b/i.test(question.trim());
}

/**
 * Build prompt for AI reading
 */
export function buildPrompt(
  cards: CardInput[],
  spreadId: string,
  question: string,
): string {
  const questionContext = buildQuestionContext(question);
  const cardList = formatCardList(cards);

  // Add yes/no instruction for binary questions
  const yesNoInstruction = isYesNoQuestion(question) 
    ? "\n\nThis is a YES/NO question. Start your answer with YES, NO, or MAYBE, then explain why."
    : "";

  // Use spread-specific prompt if available
  if (SPREAD_PROMPTS[spreadId]) {
    const basePrompt = SPREAD_PROMPTS[spreadId](questionContext, cardList);
    return yesNoInstruction ? basePrompt.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : basePrompt;
  }

  // Fallback based on card count
  const cardCount = cards.length;

  if (cardCount === 1) {
    const base = SPREAD_PROMPTS["single-card"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  } else if (cardCount === 3) {
    const base = SPREAD_PROMPTS["sentence-3"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  } else if (cardCount === 5) {
    const base = SPREAD_PROMPTS["sentence-5"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  } else if (cardCount === 7) {
    return `${questionContext}
Cards: ${cardList}
Read these seven cards as one connected answer. 6-8 sentences.${yesNoInstruction} ${AI_ENFORCEMENT_CLAUSE}`;
  } else if (cardCount === 9) {
    const base = SPREAD_PROMPTS["comprehensive"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  } else if (cardCount === 36) {
    const base = SPREAD_PROMPTS["grand-tableau"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  }

  // Ultimate fallback
  return `${questionContext}
Cards: ${cardList}
Read the cards together to form one clear answer. Be direct and practical.${yesNoInstruction} ${AI_ENFORCEMENT_CLAUSE}`;
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
