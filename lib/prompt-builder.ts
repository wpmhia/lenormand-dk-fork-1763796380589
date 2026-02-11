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
  if (cardCount <= 3) return 280;   // ~200 words
  if (cardCount <= 9) return 320;   // ~230 words
  if (cardCount <= 36) return 380;  // ~280 words, significator + key cards
  return 280;
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
  return `You are a Lenormand fortune teller. Provide readings that NEVER truncate mid-sentence. Always finish every sentence completely.

Readings should be specific: name actual cards, describe their positions, explain their interactions. Avoid generic phrases like "lingering confusion and burdens" - instead say "the Clouds at position 12 indicates confusion about work."

Structure: 2-3 paragraphs. Be specific, contextual, and complete.`;
}

/**
 * Build prompts for each spread type
 * Spread-specific methodology hints for better readings
 */
const SPREAD_PROMPTS: Record<string, (questionContext: string, cardList: string) => string> = {
  "single-card": (question, cards) => `${question}
Card: ${cards}

Provide the card's meaning and a direct answer.`,

  "sentence-3": (question, cards) => `${question}
Cards: ${cards}

Read as a sentence. Blend pairs 1+2 and 2+3. Finish completely.`,

  "sentence-5": (question, cards) => `${question}
Cards: ${cards}

Read as an extended sentence using pair-reading. Finish completely.`,

  "comprehensive": (question, cards) => `${question}
Cards: ${cards}

9-Card spread (3x3). Read rows: opening, development, resolution. Finish completely.`,

  "grand-tableau": (question, cards) => `${question}
Cards: ${cards}

Grand Tableau: 1) Name the Significator's position, 2) Describe specific nearby cards by name (left=past, right=future, above=conscious, below=unconscious), 3) Synthesize their story in 2-3 sentences. Always finish your sentences.`
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
    return `${questionContext}\nCards: ${cardList}${yesNoInstruction}`;
  } else if (cardCount === 9) {
    const base = SPREAD_PROMPTS["comprehensive"](questionContext, cardList);
    return base + yesNoInstruction;
  } else if (cardCount === 36) {
    const base = SPREAD_PROMPTS["grand-tableau"](questionContext, cardList);
    return base + yesNoInstruction;
  }

  // Ultimate fallback
  return `${questionContext}\nCards: ${cardList}${yesNoInstruction}`;
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
