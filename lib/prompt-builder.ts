import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";

export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 1) return 400;
  if (cardCount <= 3) return 600;
  if (cardCount <= 5) return 800;
  if (cardCount <= 9) return 1100;
  if (cardCount <= 36) return 1500;
  return 500;
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

interface ComboHint {
  cardA: string;
  cardB: string;
  meaning: string;
}

function sanitizeInput(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/["]/g, '"')
    .replace(/\\/g, "\\\\")
    .replace(/\n|\r/g, " ");
}

export function buildSystemPrompt(): string {
  return `You are a Lenormand card reader. Lenormand is practical and direct — not poetic or mystical like Tarot.

The core technique is PAIR READING: every card is read in combination with the card that follows it. Cards do not have standalone meanings; their meaning is always modified by the adjacent card. For example, "Rider + Clover" means lucky news, while "Rider + Heart" means a romantic message.

IMPORTANT LENORMAND PRINCIPLES:
- Cards are always upright — never reversed
- Read in pairs: Card 1 + Card 2, then Card 2 + Card 3, etc.
- Each pair creates a specific combined meaning, not just two separate cards
- STRONG cards amplify the meaning; NEUTRAL cards describe the situation factually
- The goal is a direct, actionable answer to the querent's question

Write clear, down-to-earth prose in paragraphs. No lists or bullet points.
- Name each card pair: "Card A + Card B"
- Mention the traditional combo meaning when available
- If the reading faces timing, mention likely timing (days, weeks, months)
- Be concrete, specific, and practical
- End with a clear answer to the question`;
}

const SPREAD_PROMPTS: Record<string, (question: string, cards: string) => string> = {
  "single-card": (q, c) => `${q}\nCard: ${c}\n\nExplain what this card means in practical, concrete terms. Be specific about what action to take.`,
  "daily-card": (_, c) => `Daily card: ${c}. What happens today? One sentence, practical and direct.`,
  "sentence-3": (q, c) => `${q}\nCards: ${c}\n\nRead as a Lenormand sentence using PAIR READING:
Pair 1 (Card 1 + Card 2) = the subject and what modifies it
Pair 2 (Card 2 + Card 3) = the action and how it unfolds
Full sentence (Card 1 + Card 2 + Card 3) = the outcome

Name each pair: "The Rider plus the Clover means..." Explain how the cards modify each other. End with a clear answer.`,
  "sentence-5": (q, c) => `${q}\nCards: ${c}\n\nRead as a 5-card Lenormand sentence using PAIR READING:
Pair 1 (1+2) = Subject, Pair 2 (2+3) = Action, Pair 3 (3+4) = Development, Pair 4 (4+5) = Outcome

Name each pair. Explain how adjacent cards modify each other's meaning. Synthesize into flowing prose. End with the answer.`,
  "comprehensive": (q, c) => `${q}\nCards (3x3 grid): ${c}\n\nRead using Lenormand grid reading:
Top row (cards 1-2-3) = Past — read as pairs: 1+2, 2+3
Middle row (cards 4-5-6) = Present — read as pairs: 4+5, 5+6
Bottom row (cards 7-8-9) = Future — read as pairs: 7+8, 8+9
Card 5 (center) = the heart of the matter — name it first
Also read columns top-to-bottom for additional insight.

Read in pairs throughout. Name each pair. Write in paragraphs. End with the answer.`,
  "grand-tableau": (q, c) => `${q}\n36 cards (4x9 grid): ${c}\n\nRead using authentic Lenormand Grand Tableau method:
1. Find the MAN (29) or WOMAN (28) card — this is the Significator (the querent).
2. HOUSE SYSTEM: Each position in the 4x9 grid is a "house" named after the 36 cards in order:
   Position 0 = House of Rider, Position 1 = House of Clover, ..., Position 35 = House of Cross.
   A card in a house reads as "Card X in the House of Y" — meaning is colored by the house topic.
   e.g., Snake in the House of Rider means deception around news or messages.
3. Read in PAIRS: every card modifies the card that follows it. Focus especially on pairs surrounding the Significator.
4. DIRECTIONAL ZONES relative to the Significator:
   - Left of Significator = Past influences
   - Right of Significator = Future developments
   - Above Significator = Conscious thoughts
   - Below Significator = Unconscious forces
5. MIRRORING: Read cards that mirror across the Significator (same row, opposite column) as contrasting pairs.
6. The bottom row (positions 27-35) = Cards of Fate — major life themes.
7. Corner cards = the foundation or overall context. Center four cards = the heart of the matter.

Write in paragraphs. Describe the card pairs around the Significator. Name at least 4-5 specific card pairs and how they interact. Include what the house placement adds. End with the answer.`,
};

export function buildPrompt(cards: CardInput[], spreadId: string, question: string, comboHints?: ComboHint[]): string {
  const sanitizedQ = sanitizeInput(question, MAX_QUESTION_LENGTH);
  const qContext = `Question: "${sanitizedQ || "What do these cards reveal?"}"`;
  const cardList = cards.map((c) => {
    const name = sanitizeInput(c.name, MAX_CARD_NAME_LENGTH);
    const keywords = c.keywords?.slice(0, 3).join(", ");
    return keywords ? `${name} (${keywords})` : name;
  }).join(", ");

  let prompt = SPREAD_PROMPTS[spreadId] ? SPREAD_PROMPTS[spreadId](qContext, cardList) : (() => {
    const count = cards.length;
    const fallbackId = count === 1 ? "single-card" : count === 3 ? "sentence-3" : count === 5 ? "sentence-5" : count === 9 ? "comprehensive" : count === 36 ? "grand-tableau" : null;
    return fallbackId ? SPREAD_PROMPTS[fallbackId](qContext, cardList) : `${qContext}\nCards: ${cardList}`;
  })();

  if (comboHints && comboHints.length > 0) {
    prompt += `\n\nTraditional pair meanings for adjacent cards:\n${comboHints.map(h => `- ${h.cardA} + ${h.cardB}: ${h.meaning}`).join("\n")}`;
  }

  return prompt;
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}
