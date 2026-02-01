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

// Harsh enforcement clause to break the AI's list-format habit
const ENFORCEMENT = "If you use bullet points, numbered lists, or sections like 'First card:' you have failed.";

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

  // Build card list (number-name format)
  const cardList = sanitizedCards.map((c) => `${c.id}-${c.name}`).join(", ");
  
  // Base persona with question as anchor
  const basePersona = `You are Marie-Anne Lenormand reading specifically for: "${sanitizedQuestion || "What do these cards reveal?"}"`;

  // Spread-specific prompts
  const spreadPrompts: Record<string, string> = {
    "single-card": `${basePersona}
Card: ${cardList}
Answer the question directly using this single card's energy. 1-2 sentences. ${ENFORCEMENT}`,

    "sentence-3": `${basePersona}
Cards: ${cardList}
Weave these three cards into one flowing narrative. 3-5 sentences. ${ENFORCEMENT}`,

    "past-present-future": `${basePersona}
Cards: ${cardList}
Flow through time: the first card reveals the past foundation, the second shows the present moment, the third opens the future. One continuous paragraph, 4-5 sentences. No isolated card meanings. ${ENFORCEMENT}`,

    "mind-body-spirit": `${basePersona}
Cards: ${cardList}
Flow through the levels: first card reveals the mental landscape, second shows the physical reality, third opens the spiritual dimension. One continuous paragraph, 4-5 sentences. ${ENFORCEMENT}`,

    "yes-no-maybe": `${basePersona}
Cards: ${cardList}
Start with YES, NO, or MAYBE in caps, then explain in 2-3 flowing sentences why the cards show this verdict. ${ENFORCEMENT}`,

    "sentence-5": `${basePersona}
Cards: ${cardList}
Tell one continuous story across all five cards. 5-7 sentences. No sections, no card numbers. ${ENFORCEMENT}`,

    "structured-reading": `${basePersona}
Cards: ${cardList}
Five cards as subject → verb → object → modifier → outcome. One flowing sentence or paragraph connecting all five into a complete statement. ${ENFORCEMENT}`,

    "week-ahead": `${basePersona}
Cards: ${cardList}
Seven days flow: each card blends into the next showing the week's progression. One narrative paragraph, 6-8 sentences. No day-by-day listing. ${ENFORCEMENT}`,

    "relationship-double-significator": `${basePersona}
Cards: ${cardList}
Seven cards weaving two people's paths: your past/present/future, the connection between you, their past/present/future. One continuous narrative showing how these lives intertwine. 6-8 sentences. ${ENFORCEMENT}`,

    "comprehensive": `${basePersona}
Cards: ${cardList}
Read this 3x3 grid: top row = past/context, middle = present/core, bottom = future/resolution. Two flowing paragraphs showing how the center influences all around it. ${ENFORCEMENT}`,

    "grand-tableau": `${basePersona}
36 cards: ${cardList}
Three groups: 1-12 (the situation), 13-24 (people/dynamics), 25-36 (outcome). Exactly 3 paragraphs. Identify the Significator (card 28/29). ${ENFORCEMENT}`,
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
Weave these seven cards into one continuous narrative flow. 6-8 sentences. ${ENFORCEMENT}`;
  } else if (cardCount === 9) {
    return spreadPrompts["comprehensive"];
  } else if (cardCount === 36) {
    return spreadPrompts["grand-tableau"];
  }

  // Ultimate fallback for any other count
  return `${basePersona}
Cards: ${cardList}
Flow card-to-card into one narrative. Answer directly without sections. ${ENFORCEMENT}`;
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
