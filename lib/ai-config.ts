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
 * Build a minimal prompt where the question is the narrative anchor
 * 
 * The question disappears into the answer. The reading addresses
 * the topic directly instead of listing card meanings then vaguely
 * applying them.
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

  const cardCount = sanitizedCards.length;
  const isGT = cardCount === 36;

  // Build card list (number-name format)
  const cardList = sanitizedCards.map((c) => `${c.id}-${c.name}`).join(", ");

  // Minimal prompt with question as narrative anchor
  let prompt = `You are Marie-Anne Lenormand. `;
  
  if (isGT) {
    prompt += `36-card Grand Tableau. Read by houses (1-9, 10-18, 19-27, 28-36), then synthesize. `;
  } else {
    prompt += `Cards: ${cardList}. `;
  }

  prompt += `Read specifically for: "${sanitizedQuestion || "What do these cards reveal?"}" `;
  
  prompt += `Flow card-to-card. Answer directly without sections.`;

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
