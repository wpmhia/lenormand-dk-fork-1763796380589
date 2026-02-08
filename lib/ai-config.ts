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

// Style guide for more conversational, personal, meaningful readings
const ENFORCEMENT = `You are a skilled Lenormand reader giving a personal, meaningful reading. 

TONE: Conversational and warm, like speaking to a friend. Not mechanical or list-like.
STYLE: Use natural language that connects the card meanings to the person's actual situation. Speak directly to them.
FLOW: Build ideas across cards showing how they relate to each other and the question. Don't just describe each card separately.
PERSONALIZATION: Reference the question or the person to make it feel personal and relevant to their life.

CRITICAL RULES:
- NEVER use card numbers. Only use card names (e.g. 'Tree', 'Lily', 'Paths' - never '5-Tree' or 'Card 30')
- NEVER use bullet points, numbered lists, or sections like "First card:" - this shows you've failed
- NEVER use flowery metaphors like "weaving narratives" or "whispers" - be direct and practical
- NEVER describe cards in isolation - show how they connect to create meaning
- ALWAYS connect the reading back to the actual question or situation
- ALWAYS speak naturally, as if you're having a real conversation, not reading from a script

GOOD EXAMPLE: "The Moon's influence on the Fish shows that his communication is shaped by public or emotional factors. The Stars reveal that when he does speak, his words will be clear and sincere. This means he will talk when the timing and environment feel right, and his message will be honest and well received."

BAD EXAMPLE: "The Moon shows emotional influence. The Fish shows communication. The Stars show clarity. This reading suggests..."`;


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

Read these three cards as a flowing story that connects to the question. Show how:
- The first card influences or sets up the situation
- The second card is the core issue or turning point  
- The third card shows where it leads

Speak naturally, connecting the card meanings together. The reading should feel like advice from someone who understands the situation, not a mechanical card interpretation. 4-6 sentences.

${ENFORCEMENT}`,

     "past-present-future": `${basePersona}
Cards: ${cardList}

Read these three cards showing how the past has led to the present, and what the future holds. Rather than describing each card separately, weave them together to show the natural flow and consequences. Help them understand how each moment connects to the next. Speak as if you're explaining their situation, not just interpreting cards.

One flowing paragraph, 5-6 sentences. ${ENFORCEMENT}`,

    "mind-body-spirit": `${basePersona}
Cards: ${cardList}
Read through three levels: first card is thoughts/mental state, second is actions/physical situation, third is spiritual/deeper meaning. Connect them naturally. 4-5 sentences. ${ENFORCEMENT}`,

     "yes-no-maybe": `${basePersona}
Cards: ${cardList}

Give a clear answer: YES, NO, or MAYBE. Then explain what the cards show about the situation - not just card meanings, but what they mean for their specific question. Make it personal and meaningful.

2-3 sentences total. ${ENFORCEMENT}`,

     "sentence-5": `${basePersona}
Cards: ${cardList}

These five cards tell a complete story about the question. Show how they connect:
- What's the core situation?
- What's changing or what matters most?
- Where does it lead?

Speak naturally and personally, helping them understand the deeper meaning. Connect the cards to create insight, not just list their meanings.

5-7 sentences. ${ENFORCEMENT}`,

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

This 3x3 grid shows:
- Top row: the past/context that led here
- Middle row: the present situation and what matters now
- Bottom row: where this is heading

Write TWO paragraphs that weave these together into a coherent story. Show how the past led to the present, and how the present is leading to the future. Make it personal and meaningful to the question. The center card is key - it ties everything together.

${ENFORCEMENT}`,

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
