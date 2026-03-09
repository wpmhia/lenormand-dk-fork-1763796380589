import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";

export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 1) return 150;
  if (cardCount <= 3) return 250;
  if (cardCount <= 5) return 350;
  if (cardCount <= 9) return 450;
  if (cardCount <= 36) return 550;
  return 250;
}

export interface AIReadingResponse {
  reading: string;
  source?: string;
}

interface CardInput {
  id: number;
  name: string;
  keywords?: string[];
}

function sanitizeInput(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/["]/g, '"')
    .replace(/\\/g, "\\")
    .replace(/\n|\r/g, " ");
}

export function buildSystemPrompt(): string {
  return `You are a Lenormand card reader. Lenormand is practical and direct - not poetic or mystical like Tarot.

Write clear, down-to-earth prose in paragraphs. No lists or bullet points.
- Name each card (The Rider, The Clover, etc.)
- Give concrete, specific meanings
- Be practical and direct
- End with a clear answer to the question`;
}

const SPREAD_PROMPTS: Record<string, (question: string, cards: string) => string> = {
  "single-card": (q, c) => `${q}\nCard: ${c}\n\nExplain what this card means for the question. Be specific and practical.`,
  "daily-card": (_, c) => `Daily: ${c}. What happens today? One sentence.`,
  "sentence-3": (q, c) => `${q}\nCards: ${c}\n\nPositions: 1=Opening, 2=Development, 3=Outcome.\nWrite as flowing prose. Name each card and explain how the reading unfolds. End with the answer.`,
  "sentence-5": (q, c) => `${q}\nCards: ${c}\n\nPositions: 1=Past, 2=Present, 3=Heart, 4=Near Future, 5=Outcome.\nWrite as a story in paragraphs. Card 3 is the pivot. Name each card. End with the answer.`,
  "comprehensive": (q, c) => `${q}\nCards (3x3 grid): ${c}\n\nRows: Top=Mental, Middle=Present, Bottom=Emotional. Center card=Heart of matter.\nWrite in paragraphs. Name the center card first, then describe each row. End with the answer.`,
  "grand-tableau": (q, c) => `${q}\n36 cards (4x9 grid): ${c}\n\nFind the Man (29) or Woman (28) card - this is the Significator.\nNear the Significator: Left=Past, Right=Future, Above=Conscious, Below=Unconscious.\nWrite in paragraphs. Describe what surrounds the Significator. Name specific cards. End with the answer.`,
};

export function buildPrompt(cards: CardInput[], spreadId: string, question: string): string {
  const sanitizedQ = sanitizeInput(question, MAX_QUESTION_LENGTH);
  const qContext = `Question: "${sanitizedQ || "What do these cards reveal?"}"`;
  const cardList = cards.map((c) => {
    const name = sanitizeInput(c.name, MAX_CARD_NAME_LENGTH);
    const keywords = c.keywords?.slice(0, 3).join(", ");
    return keywords ? `${name} (${keywords})` : name;
  }).join(", ");

  if (SPREAD_PROMPTS[spreadId]) return SPREAD_PROMPTS[spreadId](qContext, cardList);

  // Fallback based on card count
  const count = cards.length;
  const fallbackId = count === 1 ? "single-card" : count === 3 ? "sentence-3" : count === 5 ? "sentence-5" : count === 9 ? "comprehensive" : count === 36 ? "grand-tableau" : null;
  return fallbackId ? SPREAD_PROMPTS[fallbackId](qContext, cardList) : `${qContext}\nCards: ${cardList}`;
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}
