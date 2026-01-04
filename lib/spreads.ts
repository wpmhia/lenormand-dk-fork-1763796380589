export interface Spread {
  id: string;
  cards: number;
  label: string;
  description: string;
  isAuthentic?: boolean;
}

// Marie-Anne's Original Spreads
export const AUTHENTIC_SPREADS: Spread[] = [
  {
    id: "single-card",
    cards: 1,
    label: "Single Card",
    description: "Quick daily guidance - direct answer, immediate action",
    isAuthentic: true,
  },
  {
    id: "sentence-3",
    cards: 3,
    label: "3-Card Sentence",
    description:
      "Her daily reading: opening → turning point → outcome + deadline + action",
    isAuthentic: true,
  },
  {
    id: "comprehensive",
    cards: 9,
    label: "9-Card Petit Grand Tableau",
    description:
      "Deeper exploration of complex situations without overwhelming detail",
    isAuthentic: true,
  },
  {
    id: "grand-tableau",
    cards: 36,
    label: "36-Card Grand Tableau",
    description:
      "Complete life situation through full 4x9 grid - her most comprehensive reading",
    isAuthentic: true,
  },
];

// Modern Spreads
export const MODERN_SPREADS: Spread[] = [
  {
    id: "past-present-future",
    cards: 3,
    label: "3-Card: Past-Present-Future",
    description: "Time-based variation interpreted with her deadline system",
    isAuthentic: false,
  },
  {
    id: "yes-no-maybe",
    cards: 3,
    label: "3-Card: Yes or No",
    description: "Direct answer - her characteristic bluntness applied",
    isAuthentic: false,
  },
  {
    id: "situation-challenge-advice",
    cards: 3,
    label: "3-Card: Situation-Challenge-Advice",
    description: "Problem-solving through her diagnostic method",
    isAuthentic: false,
  },
  {
    id: "mind-body-spirit",
    cards: 3,
    label: "3-Card: Mind-Body-Spirit",
    description: "Holistic reading with practical application",
    isAuthentic: false,
  },
  {
    id: "sentence-5",
    cards: 5,
    label: "5-Card: Sentence Reading",
    description: "Extended narrative using her flowing story structure",
    isAuthentic: false,
  },
  {
    id: "structured-reading",
    cards: 5,
    label: "5-Card Reading: Structured",
    description: "Grammar-based analysis: Subject → Verb → Object → Modifier → Outcome",
    isAuthentic: false,
  },
  {
    id: "week-ahead",
    cards: 7,
    label: "7-Card Reading: Week Ahead",
    description: "Daily structure with her day-by-day action model",
    isAuthentic: false,
  },
  {
    id: "relationship-double-significator",
    cards: 7,
    label: "7-Card: Relationship",
    description: "Her significator system with dual focus - power and flow",
    isAuthentic: false,
  },
];

// All spreads combined - Authentic first, then Modern
export const COMPREHENSIVE_SPREADS: Spread[] = [
  ...AUTHENTIC_SPREADS,
  ...MODERN_SPREADS,
];

// Legacy names for backward compatibility
export const CORE_SPREADS: Spread[] = COMPREHENSIVE_SPREADS;
export const ADVANCED_SPREADS: Spread[] = MODERN_SPREADS;

// Grand Tableau Specific Types and Data

export type SignificatorType = "anima" | "animus" | "none";

export interface GrandTableauPosition {
  index: number;
  row: number;
  col: number;
  isCorner: boolean;
  isCenter: boolean;
  isCardsOfFate: boolean;
  isTopicCard: boolean;
  topicType?: "health" | "home" | "love" | "job" | "boss" | "career" | "money" | "travel";
}

export interface DirectionalZone {
  name: string;
  description: string;
  color: string;
}

export const GRAND_TABLEAU_TOPIC_CARDS: Record<number, { type: string; label: string }> = {
  5: { type: "health", label: "Health" },
  4: { type: "home", label: "Home & Family" },
  24: { type: "love", label: "Love" },
  14: { type: "job", label: "Current Job" },
  15: { type: "boss", label: "Boss/Authority" },
  35: { type: "career", label: "Career" },
  34: { type: "money", label: "Money" },
  3: { type: "travel", label: "Travel" },
};

export const GRAND_TABLEAU_CORNERS = [0, 8, 27, 35];

export const GRAND_TABLEAU_CARDS_OF_FATE = [32, 33, 34, 35];

export const GRAND_TABLEAU_CENTER_CARDS = [13, 14, 22, 23];

export const DIRECTIONAL_ZONES: Record<string, DirectionalZone> = {
  left: {
    name: "Past",
    description: "Cards to the left of the significator represent influences from the past",
    color: "text-amber-600",
  },
  right: {
    name: "Future",
    description: "Cards to the right of the significator represent potential outcomes",
    color: "text-blue-600",
  },
  above: {
    name: "Conscious",
    description: "Cards above the significator represent thoughts and ideas",
    color: "text-purple-600",
  },
  below: {
    name: "Unconscious",
    description: "Cards below the significator represent unconscious forces",
    color: "text-emerald-600",
  },
  "top-left": {
    name: "Conscious Influences",
    description: "Top-left diagonal - conscious forces influencing the situation",
    color: "text-violet-600",
  },
  "bottom-left": {
    name: "Unconscious Influences",
    description: "Bottom-left diagonal - hidden influences from the past",
    color: "text-teal-600",
  },
  "top-right": {
    name: "Conscious Possibilities",
    description: "Top-right diagonal - potential outcomes you're aware of",
    color: "text-indigo-600",
  },
  "bottom-right": {
    name: "Unconscious Possibilities",
    description: "Bottom-right diagonal - hidden potential outcomes",
    color: "text-cyan-600",
  },
};

export const SIGNIFICATOR_CARDS = {
  anima: 28,
  animus: 29,
};

export function getGrandTableauPosition(index: number): GrandTableauPosition {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const isCorner = GRAND_TABLEAU_CORNERS.includes(index);
  const isCenter = GRAND_TABLEAU_CENTER_CARDS.includes(index);
  const isCardsOfFate = GRAND_TABLEAU_CARDS_OF_FATE.includes(index);
  const topicInfo = GRAND_TABLEAU_TOPIC_CARDS[index];

  return {
    index,
    row,
    col,
    isCorner,
    isCenter,
    isCardsOfFate,
    isTopicCard: !!topicInfo,
    topicType: topicInfo?.type as "health" | "home" | "love" | "job" | "boss" | "career" | "money" | "travel" | undefined,
  };
}

export function getPositionZone(
  significatorIndex: number,
  cardIndex: number
): { zone: string; distance: number; direction: string } {
  if (significatorIndex === -1) {
    return { zone: "general", distance: 0, direction: "" };
  }

  const sigPos = getGrandTableauPosition(significatorIndex);
  const cardPos = getGrandTableauPosition(cardIndex);

  const rowDiff = cardPos.row - sigPos.row;
  const colDiff = cardPos.col - sigPos.col;
  const distance = Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);

  let direction = "";
  let zone = "surrounding";

  if (colDiff < 0) direction += "left";
  else if (colDiff > 0) direction += "right";

  if (rowDiff < 0) direction += "-above";
  else if (rowDiff > 0) direction += "-below";

  if (Math.abs(rowDiff) === Math.abs(colDiff) && rowDiff !== 0) {
    zone = direction;
  } else if (colDiff < 0) {
    zone = "left";
  } else if (colDiff > 0) {
    zone = "right";
  } else if (rowDiff < 0) {
    zone = "above";
  } else if (rowDiff > 0) {
    zone = "below";
  }

  return { zone, distance: Math.round(distance * 10) / 10, direction: direction.replace("-", " ") };
}

export function getTopicCardsInSpread(cards: number[]): { index: number; cardId: number; topic: { type: string; label: string } }[] {
  return cards
    .filter(id => GRAND_TABLEAU_TOPIC_CARDS[id])
    .map(id => ({
      index: cards.indexOf(id),
      cardId: id,
      topic: GRAND_TABLEAU_TOPIC_CARDS[id],
    }));
}

export function getDiagonalCards(significatorIndex: number, cards: number[]): {
  topLeft: number[];
  bottomLeft: number[];
  topRight: number[];
  bottomRight: number[];
} {
  if (significatorIndex === -1) {
    return { topLeft: [], bottomLeft: [], topRight: [], bottomRight: [] };
  }

  const sigPos = getGrandTableauPosition(significatorIndex);
  const sigRow = sigPos.row;
  const sigCol = sigPos.col;

  const result = {
    topLeft: [] as number[],
    bottomLeft: [] as number[],
    topRight: [] as number[],
    bottomRight: [] as number[],
  };

  cards.forEach((cardId, cardIndex) => {
    const pos = getGrandTableauPosition(cardIndex);
    const rowDiff = pos.row - sigRow;
    const colDiff = pos.col - sigCol;

    if (Math.abs(rowDiff) === Math.abs(colDiff) && rowDiff !== 0) {
      if (rowDiff < 0 && colDiff < 0) result.topLeft.push(cardIndex);
      else if (rowDiff > 0 && colDiff < 0) result.bottomLeft.push(cardIndex);
      else if (rowDiff < 0 && colDiff > 0) result.topRight.push(cardIndex);
      else if (rowDiff > 0 && colDiff > 0) result.bottomRight.push(cardIndex);
    }
  });

  return result;
}
