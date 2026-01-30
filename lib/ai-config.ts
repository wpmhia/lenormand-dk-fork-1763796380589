import { AUTHENTIC_SPREADS, MODERN_SPREADS, COMPREHENSIVE_SPREADS } from "@/lib/spreads";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

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
const GRAND_TABLEAU_POSITIONS = Array.from({ length: 36 }, (_, i) => `${i + 1}`);

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
  "comprehensive": [
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
  "relationship-double-significator": "Two-person reading with relationship focus.",
  "comprehensive": "9-card Petit Grand: Past/Present/Future × Inner/Action/Outer.",
  "grand-tableau": "36-card layout: Center energy, card interactions, directional flow.",
};

export function buildPrompt(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  question: string
): string {
  // Single O(1) lookup - try requested spreadId, fall back to default
  const spread = SPREAD_MAP.get(spreadId) || SPREAD_MAP.get("sentence-3");

  if (!spread) {
    throw new Error("Invalid spread ID and default spread not found");
  }

  const cardList = cards
    .map((c, i) => `Card ${i + 1}: ${c.name}`)
    .join("\n");

  const positionLabels = POSITION_LABELS[spread.id] || [];
  const spreadGuidance = SPREAD_GUIDANCE[spread.id] || "";

  const isYesNo = spread.id === "yes-no-maybe";

  const structure = isYesNo
    ? `STRUCTURE:
1. VERDICT: YES | NO | CONDITIONAL
2. Cards: 1-2 sentences per card
3. Why: Based on card energies`
    : `STRUCTURE:
1. Cards: 2-3 sentences per card
2. Summary: Connect all cards in one sentence
3. Story: 2-3 paragraphs on outcome
4. Action: Clear advice`;

  return `You are Marie-Anne Lenormand. Be direct and practical.

SIGNIFICATORS:
- Man (28) = querent or first person
- Woman (29) = other person
Use they/them pronouns.

READ:
- Cards in pairs, flowing narrative
- Left-to-right directional flow
- Proximity = weight

QUESTION: "${question}"

SPREAD: ${spread.label}
${spread.description || ""}
${spreadGuidance}

CARDS:
${cardList}

${structure}

Be practical.`;
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
