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
    description: "A single card, read directly against your question.",
    layoutType: "single",
    tradition: "modern",
    order: 0,
  } as const,
  "sentence-3": {
    id: "sentence-3",
    cardCount: 3,
    label: "3-Card Sentence",
    description:
      "Three cards read left to right as one connected line. The central card is the focal point; the line as a whole, with its adjacent combinations, carries the meaning. No position is fixed in advance as the conclusion.",
    layoutType: "linear-sentence",
    tradition: "traditional",
    order: 2,
    positions: [
      { index: 0, label: "Opening", meaning: "The first position in the line; a neighbour of the central card." },
      { index: 1, label: "Central", meaning: "The middle position; the focal point of the line." },
      { index: 2, label: "Closing", meaning: "The final position in the line; not fixed in advance as the conclusion." },
    ],
  } as const,
  "sentence-5": {
    id: "sentence-5",
    cardCount: 5,
    label: "5-Card Sentence",
    description:
      "Five cards read left to right as one connected line. The central card is the focal point; adjacent combinations and the whole line carry the meaning. No card is fixed in advance as the conclusion.",
    layoutType: "linear-sentence",
    tradition: "modern",
    order: 3,
    positions: [
      { index: 0, label: "First card", meaning: "Position 1 of the line; a neighbour of the second card." },
      { index: 1, label: "Second card", meaning: "Position 2 of the line; a neighbour of the first and third cards." },
      { index: 2, label: "Third card", meaning: "Position 3 of the line; the central card and focal point of the five-card line." },
      { index: 3, label: "Fourth card", meaning: "Position 4 of the line; a neighbour of the third and fifth cards." },
      { index: 4, label: "Fifth card", meaning: "Position 5 of the line; the end of the line, not fixed in advance as the conclusion." },
    ],
  } as const,
  comprehensive: {
    id: "comprehensive",
    cardCount: 9,
    label: "Petit Tableau",
    description:
      "A 3x3 grid. The centre card is the focal point; rows, columns, diagonals and neighbours are read together. Numbering gives position only, not time order.",
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
      "All 36 cards in a 4x9 grid, read with the traditional Grand Tableau techniques: significators, houses, neighbours and relevant lines. No single position is predetermined as the final one.",
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