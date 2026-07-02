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
  weight: number;
}

export type ReadingLayout =
  | SingleCardLayout
  | LinearSentenceLayout
  | PetitTableauLayout
  | GrandTableauLayout;

export interface TimingEvidence {
  cardId: number;
  cardName: string;
  range: string;
}

export interface TopicFocus {
  topic: string;
  cardId: number;
  cardName: string;
  index: number;
}

export interface ReadingContext {
  spreadId: SpreadId;
  question: string;
  cards: NormalizedCard[];
  adjacentPairs: AdjacentPair[];
  layout: ReadingLayout;
  timingEvidence: TimingEvidence[];
  topicFocus: TopicFocus[];
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
  primarySignificator?: SignificatorInfo;
  significatorPreference: "woman" | "man" | "both";
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
  weight: number = 1,
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

  return { indexA: i, indexB: j, cardA, cardB, traditionalMeaning, weight };
}

function buildPetitTableauPairs(
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): AdjacentPair[] {
  const gridPairs: { a: number; b: number; weight: number }[] = [
    { a: 0, b: 1, weight: 2 }, { a: 1, b: 2, weight: 2 },
    { a: 3, b: 4, weight: 4 }, { a: 4, b: 5, weight: 4 },
    { a: 6, b: 7, weight: 2 }, { a: 7, b: 8, weight: 2 },
    { a: 0, b: 3, weight: 2 }, { a: 3, b: 6, weight: 2 },
    { a: 1, b: 4, weight: 5 }, { a: 4, b: 7, weight: 5 },
    { a: 2, b: 5, weight: 2 }, { a: 5, b: 8, weight: 2 },
    { a: 0, b: 4, weight: 3 }, { a: 4, b: 8, weight: 3 },
    { a: 2, b: 4, weight: 3 }, { a: 4, b: 6, weight: 3 },
  ];
  const seen = new Set<string>();
  const result: AdjacentPair[] = [];
  for (const { a: i, b: j, weight } of gridPairs) {
    const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(buildAdjacentPair(i, j, cards, cardsMap, weight));
  }
  return result;
}

function buildGrandTableauPairs(
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
  layout: GrandTableauLayout,
): AdjacentPair[] {
  const all: AdjacentPair[] = [];
  const seen = new Set<string>();

  const sigIndices = new Set([
    layout.primarySignificator?.index,
    layout.significators.man?.index,
    layout.significators.woman?.index,
  ].filter((s): s is number => s !== undefined));

  const sigRows = new Set<number>();
  const sigCols = new Set<number>();
  for (const si of sigIndices) {
    sigRows.add(Math.floor(si / 9));
    sigCols.add(si % 9);
  }

  const pairWeight = (i: number, j: number): number => {
    const inSigRow = sigRows.has(Math.floor(i / 9)) || sigRows.has(Math.floor(j / 9));
    const inSigCol = sigCols.has(i % 9) || sigCols.has(j % 9);
    const isNearSig = sigIndices.has(i) && Math.abs(i - j) < 9;
    const isSigPair = sigIndices.has(i) || sigIndices.has(j);

    if (isNearSig) return 9;
    if (isSigPair) return 7;
    if (inSigRow && inSigCol) return 6;
    if (inSigRow) return 5;
    if (inSigCol) return 4;
    return 2;
  };

  const add = (i: number, j: number) => {
    const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
    if (seen.has(key) || i === j) return;
    seen.add(key);
    all.push(buildAdjacentPair(i, j, cards, cardsMap, pairWeight(i, j)));
  };

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      add(r * 9 + c, r * 9 + c + 1);
    }
  }

  for (let c = 0; c < 9; c++) {
    for (let r = 0; r < 3; r++) {
      add(r * 9 + c, (r + 1) * 9 + c);
    }
  }

  for (const sigIdx of sigIndices) {
    const row = Math.floor(sigIdx / 9);
    const col = sigIdx % 9;
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dr === 0 && dc === 0) continue;
        const ni = (row + dr) * 9 + (col + dc);
        if (ni >= 0 && ni < 36) add(sigIdx, ni);
      }
    }
  }

  return all.sort((a, b) => b.weight - a.weight).slice(0, 20);
}

function buildLinearAdjacentPairs(
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): AdjacentPair[] {
  const pairs: AdjacentPair[] = [];
  const mid = Math.floor(cards.length / 2);
  for (let i = 0; i < cards.length - 1; i++) {
    const weight = i === mid || i + 1 === mid ? 5 : 3;
    pairs.push(buildAdjacentPair(i, i + 1, cards, cardsMap, weight));
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

const TIMING_CARDS: { id: number; range: string }[] = [
  { id: 12, range: "days (Birds = short-term)" },
  { id: 17, range: "weeks (Stork = change within weeks)" },
  { id: 5, range: "years (Tree = long-term)" },
  { id: 32, range: "phases (Moon = emotional cycles)" },
  { id: 2, range: "soon / lucky chance (Clover = unexpected quick timing)" },
  { id: 30, range: "mature timing (Lily = slow, patient timeline)" },
];

const QUESTION_TOPICS: Record<string, { cardIds: number[]; topic: string }[]> = {
  love: [
    { cardIds: [24], topic: "Heart — love" },
    { cardIds: [25], topic: "Ring — commitment" },
    { cardIds: [4], topic: "House — domestic life" },
    { cardIds: [29, 28], topic: "Woman/Man — partner" },
    { cardIds: [12], topic: "Birds — communication" },
  ],
  job: [
    { cardIds: [14], topic: "Fox — current job" },
    { cardIds: [15], topic: "Bear — boss/authority" },
    { cardIds: [35], topic: "Anchor — career stability" },
    { cardIds: [34], topic: "Fish — money" },
    { cardIds: [1], topic: "Rider — new opportunity" },
  ],
  money: [
    { cardIds: [34], topic: "Fish — money/finance" },
    { cardIds: [35], topic: "Anchor — stability" },
    { cardIds: [1], topic: "Rider — new income source" },
    { cardIds: [9], topic: "Bouquet — gift/windfall" },
  ],
  health: [
    { cardIds: [5], topic: "Tree — health" },
    { cardIds: [8], topic: "Coffin — recovery or illness" },
    { cardIds: [2], topic: "Clover — lucky recovery" },
    { cardIds: [30], topic: "Lily — long-term wellness" },
  ],
  home: [
    { cardIds: [4], topic: "House — home/family" },
    { cardIds: [17], topic: "Stork — moving" },
    { cardIds: [3], topic: "Ship — relocation" },
    { cardIds: [23], topic: "Mice — loss/damage" },
  ],
  travel: [
    { cardIds: [3], topic: "Ship — travel" },
    { cardIds: [1], topic: "Rider — journey" },
    { cardIds: [17], topic: "Stork — change of place" },
  ],
};

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
  significatorPreference: "woman" | "man" | "both" = "both",
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
    position: index + 1,
    houseCardId: index + 1,
    houseName: ALL_CARD_NAMES[index],
    occupyingCard: card,
  }));

  const significators: { woman?: SignificatorInfo; man?: SignificatorInfo } = {};
  const manIdx = cards.findIndex((c) => c.id === 28);
  if (manIdx !== -1) {
    significators.man = { index: manIdx, card: cards[manIdx] };
  }
  const womanIdx = cards.findIndex((c) => c.id === 29);
  if (womanIdx !== -1) {
    significators.woman = { index: womanIdx, card: cards[womanIdx] };
  }

  let primarySignificator: SignificatorInfo | undefined;
  if (significatorPreference === "woman" && significators.woman) {
    primarySignificator = significators.woman;
  } else if (significatorPreference === "man" && significators.man) {
    primarySignificator = significators.man;
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
    primarySignificator,
    significatorPreference,
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
  significatorPreference?: "woman" | "man" | "both",
): ReadingContext {
  let adjacentPairs: AdjacentPair[];
  let layout: ReadingLayout;
  const layoutType = getLayoutType(spreadId);

  switch (layoutType) {
    case "single":
      adjacentPairs = [];
      layout = { type: "single" };
      break;
    case "linear-sentence":
      adjacentPairs = buildLinearAdjacentPairs(cards, cardsMap);
      layout = buildLinearSentenceLayout(cards);
      break;
    case "petit-tableau":
      layout = buildPetitTableauLayout(cards);
      adjacentPairs = buildPetitTableauPairs(cards, cardsMap);
      break;
    case "grand-tableau":
      layout = buildGrandTableauLayout(cards, cardsMap, significatorPreference);
      adjacentPairs = buildGrandTableauPairs(cards, cardsMap, layout);
      break;
    default:
      adjacentPairs = [];
      layout = { type: "single" };
  }

  const timingEvidence: TimingEvidence[] = [];
  for (const tc of TIMING_CARDS) {
    const found = cards.find((c) => c.id === tc.id);
    if (found) {
      timingEvidence.push({ cardId: tc.id, cardName: found.name, range: tc.range });
    }
  }

  const topicFocus: TopicFocus[] = [];
  const lowerQ = question.toLowerCase();
  for (const [category, topics] of Object.entries(QUESTION_TOPICS)) {
    const match = matchQuestionTopic(lowerQ, category);
    if (match) {
      for (const t of topics) {
        const found = cards.find((c) => t.cardIds.includes(c.id));
        if (found) {
          const idx = cards.findIndex((c) => c.id === found.id);
          topicFocus.push({ topic: t.topic, cardId: found.id, cardName: found.name, index: idx >= 0 ? idx : 0 });
        }
      }
    }
    if (topicFocus.length > 0) break;
  }

  return { spreadId, question, cards, adjacentPairs, layout, timingEvidence, topicFocus };
}

function matchQuestionTopic(question: string, category: string): boolean {
  const patterns: Record<string, string[]> = {
    love: ["love", "relationship", "partner", "romance", "marri", "dating", "boyfriend", "girlfriend", "heart", "commit"],
    job: ["job", "work", "career", "employ", "boss", "interview", "promot", "fir", "resign", "salary", "colleague"],
    money: ["money", "finance", "income", "invest", "loan", "debt", "wealth", "budget", "afford", "pay"],
    health: ["health", "ill", "sick", "disease", "pain", "heal", "recover", "doctor", "hospital", "wellness", "surgery"],
    home: ["home", "house", "apartment", "move", "renovation", "roommate", "proper"],
    travel: ["travel", "trip", "vacation", "journey", "flight", "visit", "holiday", "abroad"],
  };
  return patterns[category]?.some((kw) => question.includes(kw)) ?? false;
}
