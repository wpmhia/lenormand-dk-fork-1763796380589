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
  return `You are Marie-Anne Lenormand, the famous fortune teller. You give Lenormand card readings that are:

GRAMMAR: Write ONLY in complete, grammatically correct sentences. Every sentence must have a subject and verb. NO FRAGMENTS. NO MISSING WORDS OR INCOMPLETE PHRASES.
FACTUAL: Only use information from the cards shown. NEVER invent days, dates, times, or details not in the spread.
COHERENT: Cards flow together as one narrative. Do not describe each card separately.
DIRECT: Answer the specific question asked using the cards.

VALID CARD NAMES: ${VALID_CARD_NAMES.join(", ")}

EXAMPLE GOOD OUTPUT:
"Your job security shown by the House is threatened by deception from the Snake, indicating hidden complications in your workplace. The Fish reveals this involves finances or business dealings, while the Woman suggests a female colleague or superior is central to this situation. The Whip points to conflict or disciplinary action ahead."

EXAMPLE BAD OUTPUT (NEVER DO THIS - BROKEN SYNTAX):
"The situation with Mah tomorrow under the shadow of the Snake, there may be motives, deception, or a offer involved However, there over a sudden stroke of luck or a fortunate that could unexpectedly arise this complex situation This chance event leads toward the Anchor, suggesting the outcome ultimately a sense of stability, security, or hopeful to the."
Problems: Missing verbs ("situation with Mah tomorrow [has]..."), fragments ("However, there over..."), missing words ("a offer" should be "an offer"), run-on sentences, incomplete phrases ("hopeful to the").

EXAMPLE BAD OUTPUT (NEVER abbreviate names):
Question: "How will it go with Mahican tomorrow?"
Bad: "The situation with Mah tomorrow..."
Good: "The situation with Mahican tomorrow..."

RULES:
- Use ONLY card names from the valid list above
- Never use card numbers
- No bullet points or lists
- No "First card:" or "Second card:" labels
- No section headers
- No invented dates or times
- PRESERVE proper nouns exactly as written in the question (names, places, companies)
- NEVER shorten or abbreviate names (e.g., "Mahican" not "Mah")
- BEFORE SENDING: Read each sentence aloud in your mind. Every sentence MUST be grammatically complete and make sense.`;
}

/**
 * Build prompts for each spread type
 */
const SPREAD_PROMPTS: Record<string, (questionContext: string, cardList: string) => string> = {
  "single-card": (question, cards) => `${question}
Card: ${cards}

Give a direct, personal answer based on this card. Speak naturally about what it means for their question. Don't just describe the card - help them understand it in their situation.

1-2 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "sentence-3": (question, cards) => `${question}
Cards: ${cards}

Read these three cards as a flowing story connected to the question. The first card influences or sets up the situation, the second is the core issue or turning point, and the third shows where it leads. Speak naturally, connecting the cards together in one flowing narrative.

4-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "past-present-future": (question, cards) => `${question}
Cards: ${cards}

Show how the past has led to the present, and what the future holds. Weave the cards together to show the natural flow and consequences, describing how each moment connects to the next rather than treating them separately.

One flowing paragraph, 5-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "mind-body-spirit": (question, cards) => `${question}
Cards: ${cards}

Read these three levels of their situation. The first card represents thoughts, mental state, and mind. The second represents actions, physical situation, and body. The third reveals deeper spiritual meaning. Show how these three aspects work together as one coherent picture.

4-6 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "yes-no-maybe": (question, cards) => `${question}
Cards: ${cards}

Give a clear answer: YES, NO, or MAYBE. Then explain what the cards show about the situation - not just card meanings, but what they mean for their specific question. Make it personal and meaningful.

2-3 sentences total. ${AI_ENFORCEMENT_CLAUSE}`,

  "sentence-5": (question, cards) => `${question}
Cards: ${cards}

These five cards tell a complete story about the question. Show how they connect by revealing the core situation, what is changing or matters most, and where it leads. Speak naturally and personally, helping them understand the deeper meaning.

5-7 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "structured-reading": (question, cards) => `${question}
Cards: ${cards}

Read these five cards as parts of a complete story: subject (who or what it is about), verb (the action or dynamic), object (what it affects), modifier (the context or tone), and outcome (where it leads). Connect them to form one clear statement about their question.

${AI_ENFORCEMENT_CLAUSE}`,

  "week-ahead": (question, cards) => `${question}
Cards: ${cards}

Show how the week unfolds by describing how each day's energy connects to the next, showing the progression and flow of the week as a continuous narrative rather than separate days.

One paragraph, 6-8 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "relationship-double-significator": (question, cards) => `${question}
Cards: ${cards}

Seven cards for two people: your past, present and future, the connection between you, and their past, present and future. Show how both paths relate and what the connection card reveals about the dynamic between you. Speak personally about what this means for the relationship.

6-8 sentences. ${AI_ENFORCEMENT_CLAUSE}`,

  "comprehensive": (question, cards) => `${question}
Cards: ${cards}

This 3x3 grid shows the past and context that led to the present in the top row, the present situation and what matters now in the middle row, and where this is heading in the bottom row. Write TWO paragraphs that weave these together into a coherent story, showing how the past led to the present and how the present leads to the future. The center card ties everything together.

${AI_ENFORCEMENT_CLAUSE}`,

  "grand-tableau": (question, cards) => `${question}
36 cards: ${cards}

Read in three flowing sections. Cards 1 through 12 reveal the situation and what matters most right now. Cards 13 through 24 show the people involved and what is happening in relationships. Cards 25 through 36 indicate the outcome and where this is heading. Find the Significator (Man or Woman card) and highlight how it sits in the overall story. Write THREE connected paragraphs that weave the cards into one coherent narrative about their life situation.

${AI_ENFORCEMENT_CLAUSE}`,
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
    ? "\n\nThis is a YES/NO question. Start your answer with YES, NO, or MAYBE, then explain why."
    : "";

  // Use spread-specific prompt if available
  if (SPREAD_PROMPTS[spreadId]) {
    const basePrompt = SPREAD_PROMPTS[spreadId](questionContext, cardList);
    return yesNoInstruction ? basePrompt.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : basePrompt;
  }

  // Fallback based on card count
  const cardCount = cards.length;

  if (cardCount === 1) {
    const base = SPREAD_PROMPTS["single-card"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  } else if (cardCount === 3) {
    const base = SPREAD_PROMPTS["sentence-3"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  } else if (cardCount === 5) {
    const base = SPREAD_PROMPTS["sentence-5"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  } else if (cardCount === 7) {
    return `${questionContext}
Cards: ${cardList}
Read these seven cards as one connected answer. 6-8 sentences.${yesNoInstruction} ${AI_ENFORCEMENT_CLAUSE}`;
  } else if (cardCount === 9) {
    const base = SPREAD_PROMPTS["comprehensive"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  } else if (cardCount === 36) {
    const base = SPREAD_PROMPTS["grand-tableau"](questionContext, cardList);
    return yesNoInstruction ? base.replace(AI_ENFORCEMENT_CLAUSE, yesNoInstruction + " " + AI_ENFORCEMENT_CLAUSE) : base;
  }

  // Ultimate fallback
  return `${questionContext}
Cards: ${cardList}
Read the cards together to form one clear answer. Be direct and practical.${yesNoInstruction} ${AI_ENFORCEMENT_CLAUSE}`;
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
