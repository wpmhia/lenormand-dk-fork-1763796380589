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
 * Build the base persona string with question context
 */
function buildBasePersona(question: string): string {
  const sanitized = sanitizeInput(question, MAX_QUESTION_LENGTH);
  return `You are Marie-Anne Lenormand reading specifically for: "${sanitized || "What do these cards reveal?"}"`;
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
 * Build prompts for each spread type
 */
const SPREAD_PROMPTS: Record<string, (basePersona: string, cardList: string) => string> = {
  "single-card": (persona, cards) => `${persona}
Card: ${cards}

Give a direct, personal answer based on this card. Speak naturally about what it means for their question. Don't just describe the card - help them understand it in their situation.

1-2 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "sentence-3": (persona, cards) => `${persona}
Cards: ${cards}

Read these three cards as a flowing story connected to the question:
- First card influences or sets up the situation
- Second card is the core issue or turning point
- Third card shows where it leads

Speak naturally, connecting the cards together. 4-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "past-present-future": (persona, cards) => `${persona}
Cards: ${cards}

Show how the past has led to the present, and what the future holds. Rather than describing each card separately, weave them together to show the natural flow and consequences. Help them understand how each moment connects to the next.

One flowing paragraph, 5-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "mind-body-spirit": (persona, cards) => `${persona}
Cards: ${cards}

Read these three levels of their situation:
- First card: thoughts/mental state/mind
- Second card: actions/physical situation/body
- Third card: deeper spiritual meaning

Show how these three aspects work together and what it means for them. Connect them naturally. 4-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "yes-no-maybe": (persona, cards) => `${persona}
Cards: ${cards}

Give a clear answer: YES, NO, or MAYBE. Then explain what the cards show about the situation - not just card meanings, but what they mean for their specific question. Make it personal and meaningful.

2-3 sentences total. ${AI_ENFORCEMENT_CLAUSE}`,

  "sentence-5": (persona, cards) => `${persona}
Cards: ${cards}

These five cards tell a complete story about the question. Show how they connect:
- What's the core situation?
- What's changing or what matters most?
- Where does it lead?

Speak naturally and personally, helping them understand the deeper meaning. 5-7 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "structured-reading": (persona, cards) => `${persona}
Cards: ${cards}

Read these five cards as parts of a complete story: 
- Subject (who/what it's about)
- Verb (the action or dynamic)
- Object (what it affects)
- Modifier (the context or tone)
- Outcome (where it leads)

Connect them to form one clear statement about their question. ${AI_ENFORCEMENT_CLAUSE}`,

  "week-ahead": (persona, cards) => `${persona}
Cards: ${cards}

Show how the week unfolds: how each day's energy connects to the next, showing the progression and flow of the week. Speak naturally about the rhythm and movement, not as separate days but as a flowing narrative.

One paragraph, 6-8 sentences. No day-by-day listing. ${AI_ENFORCEMENT_CLAUSE}`,

  "relationship-double-significator": (persona, cards) => `${persona}
Cards: ${cards}

Seven cards for two people: your past/present/future, the connection between you, and their past/present/future. Show how both paths relate and what the connection card reveals about the dynamic between you. Speak personally about what this means for the relationship.

6-8 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "comprehensive": (persona, cards) => `${persona}
Cards: ${cards}

This 3x3 grid shows:
- Top row: the past/context that led here
- Middle row: the present situation and what matters now
- Bottom row: where this is heading

Write TWO paragraphs that weave these together into a coherent story. Show how the past led to the present, and how the present is leading to the future. Make it personal and meaningful to the question. The center card is key - it ties everything together.

${AI_ENFORCEMENT_CLAUSE}`,

  "grand-tableau": (persona, cards) => `${persona}
36 cards: ${cards}

Read in three flowing sections:
- Cards 1-12: the situation and what matters most right now
- Cards 13-24: the people involved and what's happening in relationships
- Cards 25-36: the outcome and where this is heading

Find the Significator (Man or Woman card) and highlight how it sits in the overall story. Write THREE connected paragraphs that weave the cards into one coherent narrative about their life situation and what's unfolding.

${AI_ENFORCEMENT_CLAUSE}`,
};

/**
 * Build prompt for AI reading
 */
export function buildPrompt(
  cards: CardInput[],
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
