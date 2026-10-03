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
  /** What the reader does. Describes the method the model is actually given. */
  description: string;
  layoutType: LayoutType;
  /**
   * "traditional" (a spread with established Lenormand usage) or "modern" (a house
   * construct). This replaces the old `isAuthentic` boolean, which read as if a modern
   * spread were somehow invalid.
   */
  tradition: "traditional" | "modern";
  order: number;
  positions?: SpreadPosition[];
}

/**
 * The single canonical description of every spread: what it is, what it means
 * positionally, and how the server lays it out.
 *
 * This is deliberately the same method the reading prompt receives. The prompt supplies
 * coordinates and, for linear spreads, these position labels; it never asserts a
 * "main line", an "outcome slot" or a deterministic sequence of cause and effect, and
 * neither may this file. When pedagogy and production disagree, the product teaches one
 * method while the model reads another.
 */
export const SPREAD_DEFINITIONS = {
  "single-card": {
    id: "single-card",
    cardCount: 1,
    label: "Single Card",
    description: "One card, read directly against your question.",
    layoutType: "single",
    tradition: "traditional",
    order: 1,
  } as const,
  "daily-card": {
    id: "daily-card",
    cardCount: 1,
    label: "Daily Card",
    description: "A single card for today.",
    layoutType: "single",
    tradition: "modern",
    order: 0,
  } as const,
  "sentence-3": {
    id: "sentence-3",
    cardCount: 3,
    label: "3-Card Sentence",
    description:
      "Three cards read left to right as one sentence. Opening, central and closing are positional descriptors, not a guaranteed sequence of cause and effect.",
    layoutType: "linear-sentence",
    tradition: "traditional",
    order: 2,
    positions: [
      { index: 0, label: "Opening", meaning: "The first position in the line - where the sentence opens." },
      { index: 1, label: "Central", meaning: "The middle position - the point the line turns on." },
      { index: 2, label: "Closing", meaning: "The final position - where the line currently leads, not a guaranteed conclusion." },
    ],
  } as const,
  "sentence-5": {
    id: "sentence-5",
    cardCount: 5,
    label: "5-Card Sentence",
    description:
      "Five cards read left to right as one connected sentence. Each card modifies the next; no card holds a fixed role.",
    layoutType: "linear-sentence",
    tradition: "modern",
    order: 3,
    positions: [
      { index: 0, label: "First card", meaning: "Position 1 of the line; read in sequence with its neighbour." },
      { index: 1, label: "Second card", meaning: "Position 2 of the line; modifies and is modified by its neighbours." },
      { index: 2, label: "Third card", meaning: "Position 3 of the line; modifies and is modified by its neighbours." },
      { index: 3, label: "Fourth card", meaning: "Position 4 of the line; modifies and is modified by its neighbours." },
      { index: 4, label: "Fifth card", meaning: "Position 5 of the line; the last card, not a predetermined conclusion." },
    ],
  } as const,
  comprehensive: {
    id: "comprehensive",
    cardCount: 9,
    label: "Petit Tableau",
    description:
      "A 3x3 grid. The centre is structurally special; rows, columns, diagonals and surrounding cards may all be weighed. No row is singled out.",
    layoutType: "petit-tableau",
    tradition: "traditional",
    order: 4,
    positions: [
      { index: 0, label: "Top row", meaning: "Row 1, column 1. Part of the top row; read with the cards around it." },
      { index: 1, label: "Top row", meaning: "Row 1, column 2. Part of the top row; read with the cards around it." },
      { index: 2, label: "Top row", meaning: "Row 1, column 3. Part of the top row; read with the cards around it." },
      { index: 3, label: "Middle row", meaning: "Row 2, column 1. Part of the middle row; read with the cards around it." },
      { index: 4, label: "Centre", meaning: "Row 2, column 2. The geometric centre of the grid." },
      { index: 5, label: "Middle row", meaning: "Row 2, column 3. Part of the middle row; read with the cards around it." },
      { index: 6, label: "Bottom row", meaning: "Row 3, column 1. Part of the bottom row; read with the cards around it." },
      { index: 7, label: "Bottom row", meaning: "Row 3, column 2. Part of the bottom row; read with the cards around it." },
      { index: 8, label: "Bottom row", meaning: "Row 3, column 3. Part of the bottom row; read with the cards around it." },
    ],
  } as const,
  "grand-tableau": {
    id: "grand-tableau",
    cardCount: 36,
    label: "Grand Tableau",
    description:
      "All 36 cards in a 4x9 grid: every house, the significators, relative geometry and traditional Grand Tableau technique. No single position is predetermined as the final one.",
    layoutType: "grand-tableau",
    tradition: "traditional",
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