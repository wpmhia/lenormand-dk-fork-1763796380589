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

/**
 * Determine token budget based on card count
 * Scales with spread complexity for appropriate depth
 * Completes in 4-8 seconds on Vercel free plan
 */
export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 1) return 200;
  if (cardCount <= 3) return 350;
  if (cardCount <= 5) return 450;
  if (cardCount <= 9) return 550;
  if (cardCount <= 36) return 700;
  return 350;
}

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
  source?: string;
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
 * 3-paragraph structure: individual cards → blend → direct answer
 */
export function buildSystemPrompt(): string {
  return `You are a Lenormand card reader. Write flowing prose, not lists or bullet points.

- Name each card (The Rider, The Clover, etc.)
- Write complete sentences in paragraphs
- Explain positions naturally in the flow
- Describe card interactions
- End with a direct answer to the question
- Never use numbered lists or bullet points`;
}

/**
 * Build prompts for each spread type
 * Spread-specific methodology hints for better readings
 */
const SPREAD_PROMPTS: Record<string, (questionContext: string, cardList: string, positions?: string) => string> = {
  "single-card": (question, cards) => `${question}
Card: ${cards}

Explain what this card means for the question. Be specific and practical.`,

  "daily-card": (question, cards) => `${question}
Card: ${cards}

This is a daily draw. Predict what will happen today based on this card. Be concrete and specific.`,

  "sentence-3": (question, cards) => `${question}
Cards: ${cards}

Positions: 1=Opening, 2=Development, 3=Outcome.
Write as flowing prose. Name each card and explain how the reading unfolds. End with the answer.`,

  "sentence-5": (question, cards) => `${question}
Cards: ${cards}

Positions: 1=Past, 2=Present, 3=Heart, 4=Near Future, 5=Outcome.
Write as a story in paragraphs. Card 3 is the pivot. Name each card. End with the answer.`,

  "comprehensive": (question, cards) => `${question}
Cards (3x3 grid): ${cards}

Rows: Top=Mental, Middle=Present, Bottom=Emotional. Center card=Heart of matter.
Write in paragraphs. Name the center card first, then describe each row. End with the answer.`,

  "grand-tableau": (question, cards) => `${question}
36 cards (4x9 grid): ${cards}

Find the Man (29) or Woman (28) card - this is the Significator.
Near the Significator: Left=Past, Right=Future, Above=Conscious, Below=Unconscious.
Write in paragraphs. Describe what surrounds the Significator. Name specific cards. End with the answer.`
};

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

  // Use spread-specific prompt if available
  if (SPREAD_PROMPTS[spreadId]) {
    const basePrompt = SPREAD_PROMPTS[spreadId](questionContext, cardList);
    return basePrompt;
  }

  // Fallback based on card count
  const cardCount = cards.length;

  if (cardCount === 1) {
    return SPREAD_PROMPTS["single-card"](questionContext, cardList);
  } else if (cardCount === 3) {
    return SPREAD_PROMPTS["sentence-3"](questionContext, cardList);
  } else if (cardCount === 5) {
    return SPREAD_PROMPTS["sentence-5"](questionContext, cardList);
  } else if (cardCount === 7) {
    return `${questionContext}\nCards: ${cardList}`;
  } else if (cardCount === 9) {
    return SPREAD_PROMPTS["comprehensive"](questionContext, cardList);
  } else if (cardCount === 36) {
    return SPREAD_PROMPTS["grand-tableau"](questionContext, cardList);
  }

  // Ultimate fallback
  return `${questionContext}\nCards: ${cardList}`;
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
