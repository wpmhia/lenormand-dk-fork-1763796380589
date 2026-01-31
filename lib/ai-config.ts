import {
  AUTHENTIC_SPREADS,
  MODERN_SPREADS,
  COMPREHENSIVE_SPREADS,
} from "@/lib/spreads";

// Edge runtime compatible env var access
const getEnv = (key: string): string | undefined => {
  return (process.env as Record<string, string | undefined>)?.[key] ||
         ((globalThis as unknown) as Record<string, Record<string, string | undefined>>)?.env?.[key];
};

const DEEPSEEK_API_KEY = getEnv("DEEPSEEK_API_KEY");
const DEEPSEEK_BASE_URL = getEnv("DEEPSEEK_BASE_URL") || "https://api.deepseek.com";

// Maximum lengths for input sanitization
const MAX_QUESTION_LENGTH = 500;
const MAX_CARD_NAME_LENGTH = 100;

/**
 * Sanitize user input to prevent prompt injection attacks
 * - Removes control characters
 * - Escapes quotes
 * - Truncates to max length
 * - Removes newlines that could break prompt structure
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
 * Validate and sanitize card data
 */
function sanitizeCardData(cards: Array<{ id: number; name: string; position: number }>): Array<{ id: number; name: string; position: number }> {
  return cards.map(card => ({
    id: typeof card.id === "number" ? card.id : 0,
    name: sanitizeInput(card.name, MAX_CARD_NAME_LENGTH),
    position: typeof card.position === "number" ? card.position : 0,
  }));
}

// Cache all spreads in a single array at module load time
const ALL_SPREADS = [...AUTHENTIC_SPREADS, ...MODERN_SPREADS];

// Create a Map for O(1) spread lookups instead of O(n) find()
const SPREAD_MAP = new Map(ALL_SPREADS.map((s) => [s.id, s]));

export function isDeepSeekAvailable(): boolean {
  return !!DEEPSEEK_API_KEY;
}

export function getAllSpreads() {
  return ALL_SPREADS;
}

export function getSpreadById(spreadId: string) {
  return SPREAD_MAP.get(spreadId);
}

export function getMaxTokens(spreadCards: number): number {
  if (spreadCards <= 3) return 800;
  if (spreadCards <= 5) return 1200;
  if (spreadCards < 9) return 1800;
  return 2000;
}

// Pre-build grand-tableau position labels once at module load
const GRAND_TABLEAU_POSITIONS = Array.from(
  { length: 36 },
  (_, i) => `${i + 1}`,
);

const POSITION_LABELS: Record<string, string[]> = {
  "single-card": ["Card"],
  "sentence-3": ["1", "2", "3"],
  "past-present-future": ["Past", "Present", "Future"],
  "yes-no-maybe": ["1", "2", "3"],
  "situation-challenge-advice": ["Situation", "Challenge", "Advice"],
  "mind-body-spirit": ["Mind", "Body", "Spirit"],
  "sentence-5": ["1", "2", "3", "4", "5"],
  "structured-reading": ["Subject", "Verb", "Object", "Modifier", "Outcome"],
  "week-ahead": ["1", "2", "3", "4", "5", "6", "7"],
  "relationship-double-significator": [
    "Your Past",
    "Your Present",
    "Your Future",
    "Connection",
    "Their Past",
    "Their Present",
    "Their Future",
  ],
  comprehensive: [
    "Past-Inner",
    "Past-Action",
    "Past-Outer",
    "Present-Inner",
    "Present-Action",
    "Present-Outer",
    "Future-Inner",
    "Future-Action",
    "Future-Outer",
  ],
  "grand-tableau": GRAND_TABLEAU_POSITIONS,
};

const SPREAD_GUIDANCE: Record<string, string> = {
  "single-card": "Direct guidance on the question.",
  "sentence-3": "3-card narrative: Opening → Central → Closing.",
  "past-present-future": "Time: Past → Present → Future.",
  "yes-no-maybe": "YES/NO answer based on card energies. Equal = CONDITIONAL.",
  "situation-challenge-advice": "Situation → Obstacle → Action.",
  "mind-body-spirit": "Mind → Body → Spirit.",
  "sentence-5": "5-card story arc.",
  "structured-reading": "Subject → Action → Impact → Conditions → Result.",
  "week-ahead": "7-day reading with action for each day.",
  "relationship-double-significator":
    "Two-person reading with relationship focus.",
  comprehensive:
    "9-card Petit Grand: Past/Present/Future × Inner/Action/Outer.",
  "grand-tableau":
    "36-card layout: Center energy, card interactions, directional flow.",
};

export function buildPrompt(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  question: string,
): string {
  // Sanitize inputs to prevent prompt injection
  const sanitizedQuestion = sanitizeInput(question, MAX_QUESTION_LENGTH);
  const sanitizedCards = cards.map(c => ({
    id: c.id,
    name: sanitizeInput(c.name, MAX_CARD_NAME_LENGTH),
  }));
  
  // Single O(1) lookup - try requested spreadId, fall back to default
  const spread = SPREAD_MAP.get(spreadId) || SPREAD_MAP.get("sentence-3");

  if (!spread) {
    throw new Error("Invalid spread ID and default spread not found");
  }

  const cardList = sanitizedCards.map((c, i) => `Card ${i + 1}: ${c.name}`).join("\n");

  const positionLabels = POSITION_LABELS[spread.id] || [];
  const spreadGuidance = SPREAD_GUIDANCE[spread.id] || "";

  const isYesNo = spread.id === "yes-no-maybe";

  const structure = isYesNo
    ? `FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

**VERDICT:** [YES / NO / CONDITIONAL]

**CARDS**

[Card 1 name]: [2-3 sentences explaining meaning and role in this position]

[Card 2 name]: [2-3 sentences explaining meaning and role]

[Card 3 name]: [2-3 sentences explaining meaning and role]

**SUMMARY**

[One flowing sentence connecting all cards to the question]

**STORY**

[2-3 paragraphs weaving cards into a narrative. Explain how they interact and what they reveal together. Use they/them pronouns. Be specific about the situation.]

**ACTION**

[2-3 clear, practical sentences on what to do. Be direct and actionable.]`
    : `FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

**CARDS**

[Card 1 name]: [2-3 sentences explaining meaning and its role in position 1]

[Card 2 name]: [2-3 sentences explaining meaning and its role in position 2]

[Card 3 name]: [2-3 sentences explaining meaning and its role in position 3]
[Continue for ALL cards with their positions...]

**SUMMARY**

[One flowing sentence connecting all cards to the question]

**STORY**

[2-3 paragraphs weaving cards into a narrative. Explain how they interact and what they reveal together. Use they/them pronouns. Be specific about the situation.]

**ACTION**

[2-3 clear, practical sentences on what to do. Be direct and actionable.]`;

  return `You are Marie-Anne Lenormand, the famous 19th century cartomancer. Give direct, practical readings.

RULES:
- Use they/them pronouns (not he/she)
- Man card (28) = querent/first person
- Woman card (29) = other person
- Read cards left-to-right, in pairs
- Proximity = weight/importance
- Be specific, not vague

QUESTION: "${sanitizedQuestion}"

SPREAD: ${spread.label}
${spread.description ? `- ${spread.description}` : ""}
${spreadGuidance ? `- ${spreadGuidance}` : ""}

CARDS DRAWN:
${cardList}

${structure}

Do not deviate from this format. Use markdown headers (**) exactly as shown.`;
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
