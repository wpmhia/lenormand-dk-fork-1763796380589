import { SPREAD_DEFINITIONS } from "@/lib/spread-definitions";

export interface Spread {
  id: string;
  cards: number;
  label: string;
  description: string;
  isAuthentic?: boolean;
}

function defToSpread(id: string): Spread {
  const d = SPREAD_DEFINITIONS[id as keyof typeof SPREAD_DEFINITIONS];
  return { id: d.id, cards: d.cardCount, label: d.label, description: d.description, isAuthentic: d.isAuthentic };
}

export const AUTHENTIC_SPREADS: Spread[] = [
  "single-card", "sentence-3", "comprehensive", "grand-tableau",
].map(defToSpread);

export const MODERN_SPREADS: Spread[] = [
  "sentence-5",
].map(defToSpread);

export const COMPREHENSIVE_SPREADS: Spread[] = [
  "single-card", "sentence-3", "sentence-5", "comprehensive", "grand-tableau",
].map(defToSpread);



export type SignificatorType = "anima" | "animus" | "none";

export interface GrandTableauPosition {
  index: number;
  row: number;
  col: number;
  isCorner: boolean;
  isCenter: boolean;
  isCardsOfFate: boolean;
  isTopicCard: boolean;
  topicType?:
    | "health"
    | "home"
    | "love"
    | "job"
    | "boss"
    | "career"
    | "money"
    | "travel";
}

export interface DirectionalZone {
  name: string;
  description: string;
  color: string;
}

export const GRAND_TABLEAU_TOPIC_CARDS: Record<
  number,
  { type: string; label: string }
> = {
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
    description:
      "Cards to the left of the significator represent influences from the past",
    color: "text-amber-600",
  },
  right: {
    name: "Future",
    description:
      "Cards to the right of the significator represent potential outcomes",
    color: "text-blue-600",
  },
  above: {
    name: "Visible",
    description: "Cards above the significator represent visible or known influences",
    color: "text-purple-600",
  },
  below: {
    name: "Hidden",
    description: "Cards below the significator represent hidden or underlying influences",
    color: "text-emerald-600",
  },
  "top-left": {
    name: "Visible Influences",
    description:
      "Top-left diagonal - visible or known forces influencing the situation",
    color: "text-violet-600",
  },
  "bottom-left": {
    name: "Hidden Influences",
    description: "Bottom-left diagonal - hidden or underlying influences",
    color: "text-teal-600",
  },
  "top-right": {
    name: "Visible Possibilities",
    description: "Top-right diagonal - potential outcomes that are becoming visible",
    color: "text-indigo-600",
  },
  "bottom-right": {
    name: "Hidden Possibilities",
    description: "Bottom-right diagonal - potential outcomes still hidden",
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

  return {
    index,
    row,
    col,
    isCorner,
    isCenter,
    isCardsOfFate,
    isTopicCard: false,
    topicType: undefined,
  };
}

export function getPositionZone(
  significatorIndex: number,
  cardIndex: number,
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

  return {
    zone,
    distance: Math.round(distance * 10) / 10,
    direction: direction.replace("-", " "),
  };
}

export function getTopicCardsInSpread(
  cards: number[],
): { index: number; cardId: number; topic: { type: string; label: string } }[] {
  return cards
    .filter((id) => GRAND_TABLEAU_TOPIC_CARDS[id])
    .map((id) => ({
      index: cards.indexOf(id),
      cardId: id,
      topic: GRAND_TABLEAU_TOPIC_CARDS[id],
    }));
}

export function getDiagonalCards(
  significatorIndex: number,
  cards: number[],
): {
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
