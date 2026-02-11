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
 */
export function buildSystemPrompt(): string {
  return `You are a Lenormand fortune teller with 20 years of experience. Your readings are:
- Written in clear, complete sentences (no lists)
- Direct and actionable
- Professional but warm in tone
- Typically 2-4 paragraphs for single cards

Always write prose, never lists.`;
}

/**
 * Build prompts for each spread type - Lenormand-compliant readings
 * All spreads use pair-reading method: combine adjacent cards for flowing narrative
 */
const SPREAD_PROMPTS: Record<string, (questionContext: string, cardList: string) => string> = {
  "single-card": (question, cards) => `${question}
Card: ${cards}

Write a single clear paragraph. Start with what the card means for the question, then expand on the message. Keep it under 100 words.`,
  
  "sentence-3": (question, cards) => `${question}
Cards (left to right): ${cards}

Read as one flowing sentence by combining card pairs:
- Card 1: Current situation or topic
- Cards 1+2: How the situation develops (combine their meanings)
- Cards 2+3: The outcome and resolution

Connect all meanings into a single narrative sentence.`,
  
  "sentence-5": (question, cards) => `${question}
Cards (left to right): ${cards}

Read as a complete flowing sentence by combining card pairs:
Each pair tells part of the story: 1+2, 2+3, 3+4, 4+5
Connect all meanings into one unfolding narrative.`,
  
  "comprehensive": (question, cards) => `${question}
9-Card Petit Grand Tableau (3x3 grid): ${cards}

Read as three rows, each row combining pairs:

ROW 1 (cards 1-3): Opening situation
- Card 1: Topic
- Cards 1+2: How it opens
- Cards 2+3: Where it leads

ROW 2 (cards 4-6): Development and complication

ROW 3 (cards 7-9): Resolution and outcome

CENTER CARD (position 5): The heart connecting all

Read each row as a connected sentence, then the three rows as a complete story.`,
  
  "grand-tableau": (question, cards) => `${question}
36-Card Grand Tableau (4x9 grid): ${cards}

Read as a comprehensive layout:

GRID STRUCTURE (read left-to-right by row):
- Rows 1-3: Foundation and current situation
- Rows 2-4: Development and complications
- Rows 3-4: Resolution and outcome

DIRECTIONAL READING:
Left side: Influences from the past
Right side: Emerging futures
Top: Conscious thoughts and awareness
Bottom: Unconscious forces and hidden factors
Center: Heart of the matter

Read by combining pairs within each row, then weave all rows into a comprehensive narrative.`,
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
