import { Card } from "@/lib/types";
import { NormalizedCard, SpreadId } from "@/lib/reading-contract";
import { getLayoutType } from "@/lib/spread-definitions";
import {
  GRAND_TABLEAU_TOPIC_CARDS,
  GRAND_TABLEAU_CORNERS,
  GRAND_TABLEAU_CARDS_OF_FATE,
  GRAND_TABLEAU_CENTER_CARDS,
} from "@/lib/spreads";

export interface AdjacentPair {
  indexA: number;
  indexB: number;
  cardA: NormalizedCard;
  cardB: NormalizedCard;
  traditionalMeaning?: string;
}

export type ReadingLayout =
  | SingleCardLayout
  | LinearSentenceLayout
  | PetitTableauLayout
  | GrandTableauLayout;

export interface ReadingContext {
  spreadId: SpreadId;
  question: string;
  cards: NormalizedCard[];
  adjacentPairs: AdjacentPair[];
  layout: ReadingLayout;
}

export interface SingleCardLayout {
  type: "single";
}

export interface LinearSentencePosition {
  index: number;
  role: string;
  function: string;
}

export interface LinearSentenceLayout {
  type: "linear-sentence";
  positions: LinearSentencePosition[];
}

export interface GridCell {
  index: number;
  card: NormalizedCard;
}

export interface PetitTableauLayout {
  type: "petit-tableau";
  grid: GridCell[][];
  center: GridCell;
  rows: {
    top: GridCell[];
    middle: GridCell[];
    bottom: GridCell[];
  };
  columns: {
    left: GridCell[];
    center: GridCell[];
    right: GridCell[];
  };
  diagonals: {
    main: GridCell[];
    other: GridCell[];
  };
}

export interface HousePlacement {
  position: number;
  houseCardId: number;
  houseName: string;
  occupyingCard: NormalizedCard;
}

export interface SignificatorInfo {
  index: number;
  card: NormalizedCard;
}

export interface MirrorPair {
  indexA: number;
  indexB: number;
  cardA: NormalizedCard;
  cardB: NormalizedCard;
}

export interface GrandTableauLayout {
  type: "grand-tableau";
  grid: GridCell[][];
  rows: GridCell[][];
  houses: HousePlacement[];
  significators: {
    woman?: SignificatorInfo;
    man?: SignificatorInfo;
  };
  corners: GridCell[];
  centerFour: GridCell[];
  cardsOfFate: GridCell[];
  topicCards: {
    index: number;
    cardId: number;
    topic: string;
    label: string;
    card: NormalizedCard;
  }[];
  verticalPairs: AdjacentPair[];
  mirrors: MirrorPair[];
}

function buildAdjacentPair(
  i: number,
  j: number,
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): AdjacentPair {
  const cardA = cards[i];
  const cardB = cards[j];
  const fullA = cardsMap.get(cardA.id);
  const fullB = cardsMap.get(cardB.id);
  let traditionalMeaning: string | undefined;

  if (fullA && fullB) {
    const forward = fullA.combos?.find((c) => c.withCardId === fullB.id);
    const reverse = fullB.combos?.find((c) => c.withCardId === fullA.id);
    const meaning = [forward?.meaning, reverse?.meaning].filter(Boolean).join(" - ");
    if (meaning) traditionalMeaning = meaning;
  }

  return { indexA: i, indexB: j, cardA, cardB, traditionalMeaning };
}

function buildLinearAdjacentPairs(
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): AdjacentPair[] {
  const pairs: AdjacentPair[] = [];
  for (let i = 0; i < cards.length - 1; i++) {
    pairs.push(buildAdjacentPair(i, i + 1, cards, cardsMap));
  }
  return pairs;
}

const SENTENCE_3_POSITIONS: LinearSentencePosition[] = [
  { index: 0, role: "Opening card", function: "subject / starting point" },
  { index: 1, role: "Central card", function: "modifier / action / turning point" },
  { index: 2, role: "Closing card", function: "result / answer" },
];

const SENTENCE_5_POSITIONS: LinearSentencePosition[] = [
  { index: 0, role: "First card", function: "subject / the matter" },
  { index: 1, role: "Second card", function: "action / what crosses" },
  { index: 2, role: "Third card", function: "focus / development" },
  { index: 3, role: "Fourth card", function: "foundation / underlying" },
  { index: 4, role: "Fifth card", function: "outcome / answer" },
];

function buildLinearSentenceLayout(
  cards: NormalizedCard[],
): LinearSentenceLayout {
  const positions = cards.length === 5 ? SENTENCE_5_POSITIONS : SENTENCE_3_POSITIONS;
  return { type: "linear-sentence", positions };
}

function buildPetitTableauLayout(
  cards: NormalizedCard[],
): PetitTableauLayout {
  const grid: GridCell[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < 3; c++) {
      const index = r * 3 + c;
      row.push({ index, card: cards[index] });
    }
    grid.push(row);
  }

  return {
    type: "petit-tableau",
    grid,
    center: grid[1][1],
    rows: {
      top: grid[0],
      middle: grid[1],
      bottom: grid[2],
    },
    columns: {
      left: [grid[0][0], grid[1][0], grid[2][0]],
      center: [grid[0][1], grid[1][1], grid[2][1]],
      right: [grid[0][2], grid[1][2], grid[2][2]],
    },
    diagonals: {
      main: [grid[0][0], grid[1][1], grid[2][2]],
      other: [grid[0][2], grid[1][1], grid[2][0]],
    },
  };
}

const ALL_CARD_NAMES = [
  "Rider", "Clover", "Ship", "House", "Tree",
  "Clouds", "Snake", "Coffin", "Bouquet", "Scythe",
  "Whip", "Birds", "Child", "Fox", "Bear",
  "Stars", "Stork", "Dog", "Tower", "Garden",
  "Mountain", "Crossroads", "Mice", "Heart", "Ring",
  "Book", "Letter", "Man", "Woman", "Lily",
  "Sun", "Moon", "Key", "Fish", "Anchor",
  "Cross",
];

function buildGrandTableauLayout(
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): GrandTableauLayout {
  const grid: GridCell[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < 9; c++) {
      const index = r * 9 + c;
      row.push({ index, card: cards[index] });
    }
    grid.push(row);
  }

  const houses: HousePlacement[] = cards.map((card, index) => ({
    position: index,
    houseCardId: index + 1,
    houseName: ALL_CARD_NAMES[index],
    occupyingCard: card,
  }));

  const womanCards = cards.filter((c) => c.id === 28);
  const manCards = cards.filter((c) => c.id === 29);

  const significators: { woman?: SignificatorInfo; man?: SignificatorInfo } = {};
  if (womanCards.length > 0) {
    const idx = cards.findIndex((c) => c.id === 28);
    significators.woman = { index: idx, card: cards[idx] };
  }
  if (manCards.length > 0) {
    const idx = cards.findIndex((c) => c.id === 29);
    significators.man = { index: idx, card: cards[idx] };
  }

  const corners = GRAND_TABLEAU_CORNERS.map((i) => ({ index: i, card: cards[i] }));
  const centerFour = GRAND_TABLEAU_CENTER_CARDS.map((i) => ({ index: i, card: cards[i] }));
  const cardsOfFate = GRAND_TABLEAU_CARDS_OF_FATE.map((i) => ({ index: i, card: cards[i] }));

  const topicCards = cards
    .map((card, index) => {
      const topic = GRAND_TABLEAU_TOPIC_CARDS[card.id];
      if (!topic) return null;
      return { index, cardId: card.id, topic: topic.type, label: topic.label, card };
    })
    .filter(Boolean) as GrandTableauLayout["topicCards"];

  const verticalPairs: AdjacentPair[] = [];
  for (let c = 0; c < 9; c++) {
    for (let r = 0; r < 3; r++) {
      const top = r * 9 + c;
      const bottom = (r + 1) * 9 + c;
      verticalPairs.push(buildAdjacentPair(top, bottom, cards, cardsMap));
    }
  }

  const mirrors: MirrorPair[] = [];
  const sigIndices = [...(significators.woman ? [significators.woman.index] : []), ...(significators.man ? [significators.man.index] : [])];
  for (const sigIdx of sigIndices) {
    const sigRow = Math.floor(sigIdx / 9);
    const sigCol = sigIdx % 9;
    for (let d = 1; d <= Math.max(sigCol, 8 - sigCol); d++) {
      const left = sigCol - d;
      const right = sigCol + d;
      if (left >= 0 && right <= 8) {
        const idxA = sigRow * 9 + left;
        const idxB = sigRow * 9 + right;
        mirrors.push({
          indexA: idxA,
          indexB: idxB,
          cardA: cards[idxA],
          cardB: cards[idxB],
        });
      }
    }
  }

  return {
    type: "grand-tableau",
    grid,
    rows: grid,
    houses,
    significators,
    corners,
    centerFour,
    cardsOfFate,
    topicCards,
    verticalPairs,
    mirrors,
  };
}

export function buildReadingContext(
  spreadId: SpreadId,
  question: string,
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): ReadingContext {
  const adjacentPairs = buildLinearAdjacentPairs(cards, cardsMap);

  let layout: ReadingLayout;
  const layoutType = getLayoutType(spreadId);

  switch (layoutType) {
    case "single":
      layout = { type: "single" };
      break;
    case "linear-sentence":
      layout = buildLinearSentenceLayout(cards);
      break;
    case "petit-tableau":
      layout = buildPetitTableauLayout(cards);
      break;
    case "grand-tableau":
      layout = buildGrandTableauLayout(cards, cardsMap);
      break;
    default:
      layout = { type: "single" };
  }

  return { spreadId, question, cards, adjacentPairs, layout };
}
