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

// Style guide for direct, practical Lenormand readings
const ENFORCEMENT = `INSTRUCTIONS FOR LENORMAND READING:

You are a Lenormand reader. Your response must be clear English, well-formed sentences, and directly answer the question asked.

OUTPUT FORMAT: Write 1-4 complete, grammatically correct sentences. That's it.

CONTENT RULES:
- Answer the YES/NO/MAYBE question directly in the first sentence
- Then briefly explain which cards support this answer
- Be literal, not poetic. No metaphors.
- Use only card names (Fox, Bear, Garden, etc) - never card numbers

TONE:
- Professional and direct
- Clear English only
- No fragments or run-on sentences
- No "my dear" or flowery language
- No bullet points or lists
- No random capitalization or weird punctuation

WHAT TO AVOID:
- Do NOT add random words or incomplete phrases
- Do NOT write like you're having a glitch
- Do NOT use flowery or poetic language
- Do NOT describe each card separately - just the combined meaning
- Do NOT use card numbers (e.g. "28-Fox" is wrong, "Fox" is correct)
- Do NOT write anything unclear or hard to understand

EXAMPLE OF GOOD RESPONSE (for "Will she get the job?"):
"NO. The Fox suggests cunning or deception in the situation, and the Bear shows power concentrated elsewhere. This indicates the timing or circumstances are not favorable."

EXAMPLE OF BAD RESPONSE:
"NO. Fox cunning a TMC The is, and the Bear suggests she has strength but is focused on power resources elsewhere."`;




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

Write 2-3 clear sentences answering the question:
- What does the combination of cards show?
- What is the key meaning for the question?

Use only card names. Write clear English. No fragments or strange phrases.

${ENFORCEMENT}`,

     "past-present-future": `${basePersona}
Cards: ${cardList}

Show what happened (past), what's happening now (present), and what's coming (future). Answer the question directly. Connect the cards to show cause and effect.

2-4 sentences. ${ENFORCEMENT}`,

    "mind-body-spirit": `${basePersona}
Cards: ${cardList}
Read through three levels: first card is thoughts/mental state, second is actions/physical situation, third is spiritual/deeper meaning. Connect them naturally. 4-5 sentences. ${ENFORCEMENT}`,

      "yes-no-maybe": `${basePersona}
Cards: ${cardList}

You MUST respond in exactly this format:
1. First word: YES or NO or MAYBE (in caps)
2. Then: A period and one clear sentence explaining why based on the cards

Example: "NO. The Fox suggests deception and the Bear shows power directed elsewhere."

2 sentences MAXIMUM. Clear English only. ${ENFORCEMENT}`,

     "sentence-5": `${basePersona}
Cards: ${cardList}

What do these five cards show about the question? Explain how they connect. Be direct and practical.

3-4 sentences. ${ENFORCEMENT}`,

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

This 3x3 grid shows past (top), present (middle), and future (bottom). What does it show about the question? How do the cards connect? The center card is key.

3-4 sentences. ${ENFORCEMENT}`,

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
