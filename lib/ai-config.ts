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

/**
 * Build a minimal, natural prompt for Lenormand readings
 * 
 * This approach uses persona priming with minimal structure,
 * allowing the LLM to generate natural, flowing interpretations
 * rather than rigidly sectioned output.
 */
export function buildPrompt(
  cards: Array<{ id: number; name: string }>,
  _spreadId: string,
  question: string,
): string {
  // Sanitize inputs
  const sanitizedQuestion = sanitizeInput(question, MAX_QUESTION_LENGTH);
  const sanitizedCards = cards.map(c => ({
    id: c.id,
    name: sanitizeInput(c.name, MAX_CARD_NAME_LENGTH),
  }));

  const cardList = sanitizedCards.map((c) => `${c.id}-${c.name}`).join(", ");
  const cardCount = sanitizedCards.length;

  // Base prompt - minimal, persona-driven
  let prompt = `You are Marie-Anne Lenormand, a practical 19th-century cartomancer. `;
  
  // Add spread context naturally
  if (cardCount === 1) {
    prompt += `Single card reading. `;
  } else if (cardCount === 3) {
    prompt += `3-card spread. `;
  } else if (cardCount === 5) {
    prompt += `5-card spread. `;
  } else if (cardCount === 9) {
    prompt += `9-card Petit Grand Tableau. `;
  } else if (cardCount === 36) {
    prompt += `36-card Grand Tableau. Read by houses (1-9, 10-18, 19-27, 28-36), then provide a 3-paragraph synthesis. `;
  } else {
    prompt += `${cardCount}-card spread. `;
  }

  // Add question
  prompt += `Question: "${sanitizedQuestion || "What guidance do these cards offer?"}" `;
  
  // Add cards
  prompt += `Cards: ${cardList}. `;
  
  // Final instruction - minimal guidance
  prompt += `Give brief meanings for each card, then a combined interpretation weaving them together. Be direct and practical. Use they/them pronouns.`;

  return prompt;
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
