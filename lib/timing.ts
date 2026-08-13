import { TimingEvidence } from "@/lib/reading-context";

export type TimingRangeKey = "days" | "weeks" | "months" | "long-term";

export interface TimingCardDefinition {
  id: number;
  name: string;
  range: TimingRangeKey;
  output: string;
  validatorRange: "days" | "weeks" | "months" | "years";
  promptGuidance: string;
}

export const TIMING_CARDS: Record<number, TimingCardDefinition> = {
  12: {
    id: 12,
    name: "Birds",
    range: "days",
    output: "Within days or very soon.",
    validatorRange: "days",
    promptGuidance:
      "Birds are present. Likely timing: within days or very soon — communication, news, or short-cycle development.",
  },
  17: {
    id: 17,
    name: "Stork",
    range: "weeks",
    output: "Over the coming weeks.",
    validatorRange: "weeks",
    promptGuidance:
      "Stork is present. Likely timing: over the coming weeks — a change, transition, or relocation cycle is starting.",
  },
  32: {
    id: 32,
    name: "Moon",
    range: "months",
    output: "Within the current lunar cycle, roughly a month.",
    validatorRange: "months",
    promptGuidance:
      "Moon is present. Likely timing: around an upcoming lunar phase or emotional cycle — about a month, but tied to the querent's rhythm.",
  },
  5: {
    id: 5,
    name: "Tree",
    range: "long-term",
    output: "Long-term; likely months to years.",
    validatorRange: "years",
    promptGuidance:
      "Tree is present. Likely timing: develops slowly; think in months to years rather than weeks. Long-term, organic progress.",
  },
};

export function getTimingCard(id: number): TimingCardDefinition | undefined {
  return TIMING_CARDS[id];
}

export function isTimingCardId(id: number): boolean {
  return id in TIMING_CARDS;
}

export const TIMING_CARD_IDS: ReadonlySet<number> = new Set(Object.keys(TIMING_CARDS).map(Number));

export const NO_TIMING_OUTPUT = "Not clearly shown by these cards.";

export const NO_TIMING_INSTRUCTION =
  "No timing evidence detected. Do not infer a time range — write: Likely timing: Not clearly shown by these cards.";

/**
 * Build the deterministic timing line for the Prediction contract.
 * This is what the model is told to repeat verbatim in **Likely timing:**.
 */
export function buildPredictionTimingLine(timingEvidence: TimingEvidence[]): string {
  const recognised: TimingCardDefinition[] = [];
  for (const te of timingEvidence) {
    const def = getTimingCard(te.cardId);
    if (def) recognised.push(def);
  }

  if (recognised.length === 0) return NO_TIMING_OUTPUT;
  if (recognised.length === 1) return recognised[0].output;
  const joined = recognised.map((d) => d.name).join(" and ");
  return `${joined}: ${recognised.map((d) => d.output).join(" / ")}`;
}

export const PREDICTION_TIMING_LABEL = "Likely timing";

export const REQUIRED_PREDICTION_FIELDS = [
  "Most likely development",
  "Likely timing",
  "Watch for",
  "Practical action",
] as const;

export type RequiredPredictionField = (typeof REQUIRED_PREDICTION_FIELDS)[number];

export function buildTimingEvidencePrompt(timingEvidence: TimingEvidence[]): string {
  const recognised: TimingCardDefinition[] = [];
  for (const te of timingEvidence) {
    const def = getTimingCard(te.cardId);
    if (def) recognised.push(def);
  }

  if (recognised.length === 0) {
    return `Timing evidence:\n${NO_TIMING_INSTRUCTION}`;
  }

  const lines: string[] = ["Timing evidence:"];
  for (const def of recognised) {
    lines.push(`- ${def.name}: ${def.promptGuidance}`);
  }

  return lines.join("\n");
}

export type CardTimingCategory =
  | "primary"
  | "supporting-short"
  | "supporting-medium"
  | "supporting-long"
  | "neutral";

export interface CardTimingKnowledge {
  cardId: number;
  cardName: string;
  category: CardTimingCategory;
  learningLabel: string;
  aiLabel: string;
}

export const CARD_TIMING_KNOWLEDGE: Record<number, CardTimingKnowledge> = {
  1: {
    cardId: 1,
    cardName: "Rider",
    category: "supporting-short",
    learningLabel: "Soon, news on the move — supports a short timeframe (days).",
    aiLabel: "Rider hints at short-cycle movement. If Birds is also drawn, treat as days; if not, this is a soft signal only.",
  },
  2: {
    cardId: 2,
    cardName: "Clover",
    category: "neutral",
    learningLabel: "No timing on its own — only a short moment in general.",
    aiLabel: "Clover is not a timing card. Do not infer a timeframe from it.",
  },
  3: {
    cardId: 3,
    cardName: "Ship",
    category: "supporting-medium",
    learningLabel: "Suggests weeks-to-months movement when paired with a primary timing card.",
    aiLabel: "Ship suggests weeks-to-months movement. It is not a primary timing card by itself.",
  },
  4: {
    cardId: 4,
    cardName: "House",
    category: "neutral",
    learningLabel: "Lasting and stable — duration is anchored, not imminent.",
    aiLabel: "House signals stability over time, not a specific timeframe.",
  },
  5: {
    cardId: 5,
    cardName: "Tree",
    category: "primary",
    learningLabel: "Primary timing card — months to years.",
    aiLabel: "Tree is a primary timing card (years). Use it when present.",
  },
  6: {
    cardId: 6,
    cardName: "Clouds",
    category: "neutral",
    learningLabel: "Unclear timing — wait for clarity.",
    aiLabel: "Clouds indicates uncertainty in timing rather than a timeframe.",
  },
  7: {
    cardId: 7,
    cardName: "Snake",
    category: "neutral",
    learningLabel: "Deceptive or delayed timing.",
    aiLabel: "Snake suggests deception or hidden delay, not a timeframe.",
  },
  8: {
    cardId: 8,
    cardName: "Coffin",
    category: "neutral",
    learningLabel: "An ending — duration depends on surrounding cards.",
    aiLabel: "Coffin marks an ending. It is not itself a timeframe indicator.",
  },
  9: {
    cardId: 9,
    cardName: "Bouquet",
    category: "neutral",
    learningLabel: "Soon, joyful — not a specific timeframe.",
    aiLabel: "Bouquet suggests something pleasant arriving, not a timeframe.",
  },
  10: {
    cardId: 10,
    cardName: "Scythe",
    category: "neutral",
    learningLabel: "Sudden or decisive moment.",
    aiLabel: "Scythe suggests something sharp or sudden, not a timeframe.",
  },
  11: {
    cardId: 11,
    cardName: "Whip",
    category: "neutral",
    learningLabel: "Repetitive cycle, no specific duration.",
    aiLabel: "Whip signals repetition or conflict, not a timeframe.",
  },
  12: {
    cardId: 12,
    cardName: "Birds",
    category: "primary",
    learningLabel: "Primary timing card — within days.",
    aiLabel: "Birds is a primary timing card (days). Use it when present.",
  },
  13: {
    cardId: 13,
    cardName: "Child",
    category: "neutral",
    learningLabel: "New and small — not a timeframe.",
    aiLabel: "Child signals a new beginning, not a timeframe.",
  },
  14: {
    cardId: 14,
    cardName: "Fox",
    category: "neutral",
    learningLabel: "Strategic delay is possible.",
    aiLabel: "Fox signals cunning or work, not a timeframe.",
  },
  15: {
    cardId: 15,
    cardName: "Bear",
    category: "neutral",
    learningLabel: "Powerful but not time-specific.",
    aiLabel: "Bear signals strength or authority, not a timeframe.",
  },
  16: {
    cardId: 16,
    cardName: "Stars",
    category: "neutral",
    learningLabel: "Guidance over an unspecified horizon.",
    aiLabel: "Stars signals inspiration or guidance, not a timeframe.",
  },
  17: {
    cardId: 17,
    cardName: "Stork",
    category: "primary",
    learningLabel: "Primary timing card — over the coming weeks.",
    aiLabel: "Stork is a primary timing card (weeks). Use it when present.",
  },
  18: {
    cardId: 18,
    cardName: "Dog",
    category: "neutral",
    learningLabel: "Loyal and steady — no timeframe.",
    aiLabel: "Dog signals loyalty or friendship, not a timeframe.",
  },
  19: {
    cardId: 19,
    cardName: "Tower",
    category: "neutral",
    learningLabel: "Institutional pace, not a timeframe.",
    aiLabel: "Tower signals institutions or authority, not a timeframe.",
  },
  20: {
    cardId: 20,
    cardName: "Garden",
    category: "neutral",
    learningLabel: "Public, social setting — no specific timeframe.",
    aiLabel: "Garden signals social or public contexts, not a timeframe.",
  },
  21: {
    cardId: 21,
    cardName: "Mountain",
    category: "neutral",
    learningLabel: "Slow or delayed.",
    aiLabel: "Mountain signals obstacles or delay, not a timeframe.",
  },
  22: {
    cardId: 22,
    cardName: "Crossroads",
    category: "neutral",
    learningLabel: "Decision point — no specific duration.",
    aiLabel: "Crossroads signals choice or direction, not a timeframe.",
  },
  23: {
    cardId: 23,
    cardName: "Mice",
    category: "neutral",
    learningLabel: "Gradual erosion over time.",
    aiLabel: "Mice signals slow loss or erosion, not a specific timeframe.",
  },
  24: {
    cardId: 24,
    cardName: "Heart",
    category: "neutral",
    learningLabel: "Emotional, present-moment focus.",
    aiLabel: "Heart signals emotional core, not a timeframe.",
  },
  25: {
    cardId: 25,
    cardName: "Ring",
    category: "supporting-long",
    learningLabel: "Cyclical or contracted — supports a long timeframe.",
    aiLabel: "Ring suggests something cyclical or contractual, often longer than weeks.",
  },
  26: {
    cardId: 26,
    cardName: "Book",
    category: "neutral",
    learningLabel: "Hidden, secret, undisclosed.",
    aiLabel: "Book signals secrets or knowledge, not a timeframe.",
  },
  27: {
    cardId: 27,
    cardName: "Letter",
    category: "supporting-short",
    learningLabel: "Written and formal — supports short timeframe.",
    aiLabel: "Letter suggests short-cycle written communication, often days to a week.",
  },
  28: {
    cardId: 28,
    cardName: "Man",
    category: "neutral",
    learningLabel: "Present moment — person card.",
    aiLabel: "Man is a person card, not a timeframe.",
  },
  29: {
    cardId: 29,
    cardName: "Woman",
    category: "neutral",
    learningLabel: "Present moment — person card.",
    aiLabel: "Woman is a person card, not a timeframe.",
  },
  30: {
    cardId: 30,
    cardName: "Lily",
    category: "supporting-long",
    learningLabel: "Peaceful, mature, longer arc.",
    aiLabel: "Lily signals maturity or peace over a longer arc, not a specific timeframe.",
  },
  31: {
    cardId: 31,
    cardName: "Sun",
    category: "neutral",
    learningLabel: "Daytime, success — not a specific timeframe.",
    aiLabel: "Sun signals success or vitality, not a timeframe.",
  },
  32: {
    cardId: 32,
    cardName: "Moon",
    category: "primary",
    learningLabel: "Primary timing card — evening / lunar cycle.",
    aiLabel: "Moon is a primary timing card (months/lunar phases). Use it when present.",
  },
  33: {
    cardId: 33,
    cardName: "Key",
    category: "neutral",
    learningLabel: "Immediate solution.",
    aiLabel: "Key signals a solution or access, not a timeframe.",
  },
  34: {
    cardId: 34,
    cardName: "Fish",
    category: "supporting-medium",
    learningLabel: "Flowing, business, money — supports medium timeframe.",
    aiLabel: "Fish signals commerce or abundance, often weeks to months.",
  },
  35: {
    cardId: 35,
    cardName: "Anchor",
    category: "supporting-long",
    learningLabel: "Long-term stability.",
    aiLabel: "Anchor signals stability or permanence, often longer than weeks.",
  },
  36: {
    cardId: 36,
    cardName: "Cross",
    category: "neutral",
    learningLabel: "Burden, destiny — no timeframe.",
    aiLabel: "Cross signals burden or destiny, not a timeframe.",
  },
};

export function getCardTimingKnowledge(id: number): CardTimingKnowledge | undefined {
  return CARD_TIMING_KNOWLEDGE[id];
}
