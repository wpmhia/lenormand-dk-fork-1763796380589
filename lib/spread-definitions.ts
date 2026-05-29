export type SpreadId =
  | "single-card"
  | "daily-card"
  | "sentence-3"
  | "sentence-5"
  | "comprehensive"
  | "grand-tableau";

export type LayoutType =
  | "single"
  | "linear-sentence"
  | "petit-tableau"
  | "grand-tableau";

export interface SpreadPosition {
  index: number;
  label: string;
  meaning: string;
}

export interface SpreadDefinition {
  id: SpreadId;
  cardCount: number;
  label: string;
  description: string;
  layoutType: LayoutType;
  isAuthentic: boolean;
  order: number;
  positions?: SpreadPosition[];
}

export const SPREAD_DEFINITIONS = {
  "single-card": {
    id: "single-card",
    cardCount: 1,
    label: "Single Card",
    description: "Quick daily guidance - direct answer, immediate action",
    layoutType: "single",
    isAuthentic: true,
    order: 1,
  } as const,
  "daily-card": {
    id: "daily-card",
    cardCount: 1,
    label: "Daily Card",
    description: "A single card for today's guidance",
    layoutType: "single",
    isAuthentic: true,
    order: 0,
  } as const,
  "sentence-3": {
    id: "sentence-3",
    cardCount: 3,
    label: "3-Card Sentence",
    description: "Opening, turning point, and outcome with timing and action guidance",
    layoutType: "linear-sentence",
    isAuthentic: true,
    order: 2,
    positions: [
      { index: 0, label: "Opening Card", meaning: "The subject or starting point of the situation" },
      { index: 1, label: "Central Card", meaning: "The core action, challenge, or turning point" },
      { index: 2, label: "Closing Card", meaning: "The outcome or resolution; check the mirror relationship with the central card" },
    ],
  } as const,
  "sentence-5": {
    id: "sentence-5",
    cardCount: 5,
    label: "5-Card Sentence Reading",
    description: "Extended narrative using pair-reading technique - Lenormand's flexible approach for more complex situations",
    layoutType: "linear-sentence",
    isAuthentic: false,
    order: 3,
    positions: [
      { index: 0, label: "Subject", meaning: "Who or what the reading is about - the main person or situation" },
      { index: 1, label: "Action", meaning: "What is happening, being done, or influencing the subject" },
      { index: 2, label: "Focus", meaning: "The heart of the matter - the central action or key event" },
      { index: 3, label: "Development", meaning: "How the situation unfolds or what comes next" },
      { index: 4, label: "Outcome", meaning: "Where this leads - the result or conclusion" },
    ],
  } as const,
  "comprehensive": {
    id: "comprehensive",
    cardCount: 9,
    label: "Petit Tableau",
    description: "Deeper exploration of complex situations without overwhelming detail",
    layoutType: "petit-tableau",
    isAuthentic: true,
    order: 4,
    positions: [
      { index: 0, label: "Upper Line", meaning: "Context line - read with cards 1+2 and 2+3 as a Lenormand sentence" },
      { index: 1, label: "Upper Line", meaning: "Context line - part of the upper grid sentence with adjacent cards" },
      { index: 2, label: "Upper Line", meaning: "Context line - completes the upper row" },
      { index: 3, label: "Middle Line", meaning: "Main line - read with the center card and adjacent cards" },
      { index: 4, label: "Heart of the Matter", meaning: "Center card - the focal point of the Petit Tableau grid" },
      { index: 5, label: "Middle Line", meaning: "Main line - modifies or develops the center card's meaning" },
      { index: 6, label: "Lower Line", meaning: "Underlying line - read with cards 7+8 and 8+9 as a Lenormand sentence" },
      { index: 7, label: "Lower Line", meaning: "Underlying line - part of the lower grid sentence" },
      { index: 8, label: "Lower Line", meaning: "Underlying line - completes the lower row" },
    ],
  } as const,
  "grand-tableau": {
    id: "grand-tableau",
    cardCount: 36,
    label: "Grand Tableau",
    description: "Complete life situation through full 4x9 grid - the most comprehensive reading",
    layoutType: "grand-tableau",
    isAuthentic: true,
    order: 5,
  } as const,
} as const;

export const SPREAD_IDS: SpreadId[] = Object.keys(SPREAD_DEFINITIONS) as SpreadId[];

export function getDefinition(id: string): SpreadDefinition | undefined {
  return SPREAD_DEFINITIONS[id as SpreadId] as SpreadDefinition | undefined;
}

export function getCardCount(id: string): number | undefined {
  return getDefinition(id)?.cardCount;
}

export function getLayoutType(id: string): LayoutType | undefined {
  return getDefinition(id)?.layoutType;
}
