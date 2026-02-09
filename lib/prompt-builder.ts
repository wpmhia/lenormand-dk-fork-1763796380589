/**
 * Prompt Builder Utility
 * 
 * Centralized AI prompt generation for different spread types.
 * Makes it easy to adjust prompts and maintain consistency.
 */

import {
  MAX_QUESTION_LENGTH,
  MAX_CARD_NAME_LENGTH,
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
  return `You are a Lenormand fortune teller. Provide insightful, practical readings based on the cards drawn. Use natural language and be direct.`;
}

/**
 * Build prompts for each spread type
 */
const SPREAD_PROMPTS: Record<string, (questionContext: string, cardList: string) => string> = {
  "single-card": (question, cards) => `${question}\nCard: ${cards}\n\nProvide a direct reading of this card for the question.`,
  
  "sentence-3": (question, cards) => `${question}\nCards: ${cards}\n\nRead these three cards as a story: situation, turning point, outcome.`,
  
  "past-present-future": (question, cards) => `${question}\nCards: ${cards}\n\nInterpret as: past influence, present situation, future direction.`,
  
  "mind-body-spirit": (question, cards) => `${question}\nCards: ${cards}\n\nRead as: thoughts/mind, physical reality, deeper spiritual meaning.`,
  
  "yes-no-maybe": (question, cards) => `${question}\nCards: ${cards}\n\nAnswer YES, NO, or MAYBE, then explain what the cards reveal.`,
  
  "sentence-5": (question, cards) => `${question}\nCards: ${cards}\n\nRead these five cards as a complete unfolding: the full situation and direction.`,
  
  "structured-reading": (question, cards) => `${question}\nCards: ${cards}\n\nInterpret as: subject, action, object, context, outcome.`,
  
  "week-ahead": (question, cards) => `${question}\nCards: ${cards}\n\nRead how the week unfolds from start to finish.`,
  
  "relationship-double-significator": (question, cards) => `${question}\nCards: ${cards}\n\nRead: first three as one person's path, middle as the relationship, last three as the other person's path.`,
  
  "comprehensive": (question, cards) => `${question}\nCards: ${cards}\n\nRead as a 3x3 grid: top row is past/foundation, middle is present, bottom is future. Center card connects all.`,
  
  "grand-tableau": (question, cards) => `${question}\n36 cards: ${cards}\n\nRead three areas: 1-12 is situation, 13-24 is people/influences, 25-36 is outcome.`,
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
    ? "\n\nRemember: This is a YES/NO question."
    : "";

  // Use spread-specific prompt if available
  if (SPREAD_PROMPTS[spreadId]) {
    const basePrompt = SPREAD_PROMPTS[spreadId](questionContext, cardList);
    return basePrompt + yesNoInstruction;
  }

  // Fallback based on card count
  const cardCount = cards.length;

  if (cardCount === 1) {
    const base = SPREAD_PROMPTS["single-card"](questionContext, cardList);
    return base + yesNoInstruction;
  } else if (cardCount === 3) {
    const base = SPREAD_PROMPTS["sentence-3"](questionContext, cardList);
    return base + yesNoInstruction;
  } else if (cardCount === 5) {
    const base = SPREAD_PROMPTS["sentence-5"](questionContext, cardList);
    return base + yesNoInstruction;
  } else if (cardCount === 7) {
    return `${questionContext}\nCards: ${cardList}\n\nRead these cards as a complete answer.${yesNoInstruction}`;
  } else if (cardCount === 9) {
    const base = SPREAD_PROMPTS["comprehensive"](questionContext, cardList);
    return base + yesNoInstruction;
  } else if (cardCount === 36) {
    const base = SPREAD_PROMPTS["grand-tableau"](questionContext, cardList);
    return base + yesNoInstruction;
  }

  // Ultimate fallback
  return `${questionContext}\nCards: ${cardList}\n\nProvide a reading of these cards.${yesNoInstruction}`;
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
