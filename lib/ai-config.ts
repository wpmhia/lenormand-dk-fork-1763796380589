import { getEnv } from "./env";

const DEEPSEEK_BASE_URL = getEnv("DEEPSEEK_BASE_URL") || "https://api.deepseek.com";

// Maximum lengths for input sanitization
const MAX_QUESTION_LENGTH = 500;
const MAX_CARD_NAME_LENGTH = 100;

/**
 * Sanitize user input to prevent prompt injection attacks
 */
function sanitizeInput(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return "";
  
  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
    .replace(/["]/g, '"') // Escape double quotes
    .replace(/\\/g, "\\") // Escape backslashes
    .replace(/\n|\r/g, " "); // Replace newlines with spaces
}

// Harsh enforcement clause to break the AI's list-format habit and purple prose
const ENFORCEMENT = "If you use bullet points, numbered lists, or sections like 'First card:' you have failed. Use plain language - no flowery metaphors, no 'weaving narratives' or 'whispers'. Be direct and practical like traditional Lenormand. CRITICAL: Use ONLY card names (e.g. 'Tree', 'Lily', 'Paths'), never card numbers. Never write '30-Lily' - just write 'Lily'. Never reference card IDs.";

/**
 * Build spread-specific prompts with the question as narrative anchor
 * 
 * Each spread type gets a specialized prompt that matches its narrative logic:
 * - Temporal spreads flow through time
 * - Problem-solving spreads flow through obstacle → solution
 * - Grand Tableau reads by houses then synthesizes
 */
export function buildPrompt(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  question: string,
): string {
  // Sanitize inputs
  const sanitizedQuestion = sanitizeInput(question, MAX_QUESTION_LENGTH);
  const sanitizedCards = cards.map(c => ({
    id: c.id,
    name: sanitizeInput(c.name, MAX_CARD_NAME_LENGTH),
  }));

  // Build card list (names only, no numbers)
  const cardList = sanitizedCards.map((c) => c.name).join(", ");
  
  // Base persona with question as anchor
  const basePersona = `You are Marie-Anne Lenormand reading specifically for: "${sanitizedQuestion || "What do these cards reveal?"}"`;

  // Spread-specific prompts
  const spreadPrompts: Record<string, string> = {
    "single-card": `${basePersona}
Card: ${cardList}
Give a direct answer based on this card. Keep it practical and concrete. 1-2 sentences. ${ENFORCEMENT}`,

    "sentence-3": `${basePersona}
Cards: ${cardList}
Read these three cards as a sentence: first card modifies the second, which leads to the third. Be direct and practical. 3-5 sentences. ${ENFORCEMENT}`,

    "past-present-future": `${basePersona}
Cards: ${cardList}
Read through time: first card is what happened before, second card is the current situation, third card is what's coming. Connect them naturally in one paragraph. 4-5 sentences. ${ENFORCEMENT}`,

    "mind-body-spirit": `${basePersona}
Cards: ${cardList}
Read through three levels: first card is thoughts/mental state, second is actions/physical situation, third is spiritual/deeper meaning. Connect them naturally. 4-5 sentences. ${ENFORCEMENT}`,

    "yes-no-maybe": `${basePersona}
Cards: ${cardList}
Start with YES, NO, or MAYBE in caps, then explain why based on the cards. Be direct and practical. 2-3 sentences. ${ENFORCEMENT}`,

    "sentence-5": `${basePersona}
Cards: ${cardList}
Read all five cards as one connected answer. Each card adds meaning to create the complete picture. 5-7 sentences. ${ENFORCEMENT}`,

    "structured-reading": `${basePersona}
Cards: ${cardList}
Read as subject → verb → object → modifier → outcome. Connect all five cards to form one clear statement. ${ENFORCEMENT}`,

    "week-ahead": `${basePersona}
Cards: ${cardList}
Read the week ahead: show how each day's card connects to the next. One paragraph showing the progression. 6-8 sentences. No day-by-day listing. ${ENFORCEMENT}`,

    "relationship-double-significator": `${basePersona}
Cards: ${cardList}
Seven cards for two people: your past/present/future, the connection card, their past/present/future. Show how both paths relate. 6-8 sentences. ${ENFORCEMENT}`,

    "comprehensive": `${basePersona}
Cards: ${cardList}
Read the 3x3 grid: top row is past/context, middle row is present situation, bottom row is future/outcome. Focus on how the center card ties everything together. Two paragraphs. ${ENFORCEMENT}`,

    "grand-tableau": `${basePersona}
36 cards: ${cardList}
Read in three sections: cards 1-12 show the situation, 13-24 show people and relationships, 25-36 show outcome. Exactly 3 paragraphs. Find and mention the Significator (Man-28 or Woman-29). ${ENFORCEMENT}`,
  };

  // Return spread-specific prompt or fall back to generic based on card count
  if (spreadPrompts[spreadId]) {
    return spreadPrompts[spreadId];
  }

  // Fallback: card-count based generic prompts
  const cardCount = sanitizedCards.length;
  
  if (cardCount === 1) {
    return spreadPrompts["single-card"];
  } else if (cardCount === 3) {
    return spreadPrompts["sentence-3"];
  } else if (cardCount === 5) {
    return spreadPrompts["sentence-5"];
  } else if (cardCount === 7) {
    return `${basePersona}
Cards: ${cardList}
Read these seven cards as one connected answer. 6-8 sentences. ${ENFORCEMENT}`;
  } else if (cardCount === 9) {
    return spreadPrompts["comprehensive"];
  } else if (cardCount === 36) {
    return spreadPrompts["grand-tableau"];
  }

  // Ultimate fallback for any other count
  return `${basePersona}
Cards: ${cardList}
Read the cards together to form one clear answer. Be direct and practical. ${ENFORCEMENT}`;
}

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

export { DEEPSEEK_BASE_URL };
