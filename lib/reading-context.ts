import { Card } from "@/lib/types";
import { NormalizedCard, SpreadId } from "@/lib/reading-contract";
import { getLayoutType } from "@/lib/spread-definitions";
import {
  GRAND_TABLEAU_TOPIC_CARDS,
  GRAND_TABLEAU_CORNERS,
  GRAND_TABLEAU_CENTER_CARDS,
} from "@/lib/spreads";
import { TIMING_CARDS as SHARED_TIMING_CARDS } from "@/lib/timing";
import { getCanonicalLenormandPairMeaning } from "@/lib/pair-meaning";

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
  questionDomain: QuestionDomain;
  questionFrame: string;
  cards: NormalizedCard[];
  adjacentPairs: AdjacentPair[];
  layout: ReadingLayout;
  timingEvidence: TimingEvidence[];
  topicFocus: TopicFocus[];
}

export type QuestionDomain = "relocation" | "health" | "career" | "love" | "money" | "home" | "travel" | "general";

export interface QuestionFrame {
  domain: QuestionDomain;
  instruction: string;
}

export function getQuestionFrame(question: string): QuestionFrame {
  const q = question.toLowerCase();
  const explicitCareer = /\b(job|position|role|career|work|employment|interview|salary|promotion|employer)\b/i.test(q);
  const explicitHealth = /\b(illness|disease|pain|symptom|diagnosis|treatment|surgery|recovery|health|wellness|medical condition)\b/i.test(q);

  if (/\b(?:move|moving|relocat(?:e|ed|es|ing|ion)|migrat(?:e|ed|es|ing|ion)|immigrat(?:e|ed|es|ing|ion))\b/i.test(q)
    || /\b(?:move|return)\s+(?:back\s+)?to\s+[A-Z][\w-]+/i.test(question)
    || /\b(?:move|settle)\s+(?:back\s+)?(?:home|abroad|overseas)\b/i.test(q)) {
    return {
      domain: "relocation",
      instruction: "This is a relocation or return-home question. Answer whether the move, return, or change of residence is likely, using cards for desire, choice, practical movement, people involved, and unresolved conditions.",
    };
  }
  if (explicitHealth && !explicitCareer) {
    return { domain: "health", instruction: "This is a health question. Keep the interpretation concrete and situational: symptoms, treatment, recovery, diagnosis, or care." };
  }
  if (explicitCareer) {
    return { domain: "career", instruction: "This is a career or employment question. Interpret cards through work, roles, applications, decisions, and professional circumstances." };
  }
  if (/\b(love|relationship|partner|romance|marriage|dating|boyfriend|girlfriend)\b/i.test(q)) {
    return { domain: "love", instruction: "This is a relationship question. Interpret the line through the people, contact, commitment, and circumstances described by the question." };
  }
  if (/\b(money|finance|income|loan|debt|salary|wealth|budget)\b/i.test(q)) {
    return { domain: "money", instruction: "This is a money question. Interpret the line through finances, resources, payments, and practical material circumstances." };
  }
  if (/\b(home|house|apartment|property|renovation|roommate)\b/i.test(q)) {
    return { domain: "home", instruction: "This is a home question. Interpret the line through residence, family, property, and domestic circumstances." };
  }
  if (/\b(travel|trip|vacation|journey|flight|abroad|overseas)\b/i.test(q)) {
    return { domain: "travel", instruction: "This is a travel question. Interpret the line through movement, routes, visits, and practical travel circumstances." };
  }
  return { domain: "general", instruction: "Use the user's question as the semantic frame. Do not let a card's common domain replace the concrete situation being asked about." };
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
  primarySignificatorSource?: "explicit" | "referent" | "default";
  significatorPreference: "woman" | "man" | "both";
  corners: GridCell[];
  centerFour: GridCell[];
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
    traditionalMeaning = getCanonicalLenormandPairMeaning(fullA.id, fullB.id);
  }

  return { indexA: i, indexB: j, cardA, cardB, traditionalMeaning, weight };
}

function buildPetitTableauPairs(
  cards: NormalizedCard[],
  cardsMap: Map<number, Card>,
): AdjacentPair[] {
  // Middle line pairs and center-column pairs are the primary narrative axes (weight 5).
  // Diagonals are supporting axes (weight 3). Outer rows and outer columns are qualifier
  // pairs (weight 2). This weight table is what the prose hierarchy says.
  const gridPairs: { a: number; b: number; weight: number }[] = [
    { a: 0, b: 1, weight: 2 }, { a: 1, b: 2, weight: 2 },
    { a: 3, b: 4, weight: 5 }, { a: 4, b: 5, weight: 5 },
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

  const activeSignificators = layout.significatorPreference === "both"
    ? [layout.significators.man, layout.significators.woman]
    : [layout.primarySignificator];
  const sigIndices = new Set(
    activeSignificators
      .filter((s): s is SignificatorInfo => s !== undefined)
      .map((s) => s.index),
  );

  const sigRows = new Set<number>();
  const sigCols = new Set<number>();
  for (const si of sigIndices) {
    sigRows.add(Math.floor(si / 9));
    sigCols.add(si % 9);
  }

  const pairWeight = (i: number, j: number): number => {
    const inSigRow = sigRows.has(Math.floor(i / 9)) || sigRows.has(Math.floor(j / 9));
    const inSigCol = sigCols.has(i % 9) || sigCols.has(j % 9);
    const eitherIsSig = sigIndices.has(i) || sigIndices.has(j);
    const isAdjacentToSig = [...sigIndices].some((sigIndex) => {
      const sigRow = Math.floor(sigIndex / 9);
      const sigCol = sigIndex % 9;
      const iRow = Math.floor(i / 9);
      const iCol = i % 9;
      const jRow = Math.floor(j / 9);
      const jCol = j % 9;
      return (i === sigIndex && Math.max(Math.abs(jRow - sigRow), Math.abs(jCol - sigCol)) === 1)
        || (j === sigIndex && Math.max(Math.abs(iRow - sigRow), Math.abs(iCol - sigCol)) === 1);
    });
    const isSigPair = eitherIsSig;

    if (isAdjacentToSig) return 9;
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
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (nextRow >= 0 && nextRow < 4 && nextCol >= 0 && nextCol < 9) {
          add(sigIdx, nextRow * 9 + nextCol);
        }
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
    const weight = i === cards.length - 2
      ? 6
      : i === mid || i + 1 === mid
        ? 5
        : 3;
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

const TIMING_CARDS = SHARED_TIMING_CARDS;

const QUESTION_TOPICS: Record<string, { cardIds: number[]; topic: string }[]> = {
  love: [
    { cardIds: [24], topic: "Heart — emotional core" },
    { cardIds: [25], topic: "Ring — commitment / agreement" },
    { cardIds: [4], topic: "House — domestic situation" },
    { cardIds: [29, 28], topic: "Woman/Man — a person relevant to the question" },
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
  question: string = "",
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
  let primarySignificatorSource: "explicit" | "referent" | "default" | undefined;
  if (significatorPreference === "woman" && significators.woman) {
    primarySignificator = significators.woman;
    primarySignificatorSource = "explicit";
  } else if (significatorPreference === "man" && significators.man) {
    primarySignificator = significators.man;
    primarySignificatorSource = "explicit";
  } else if (significatorPreference === "both") {
    // "both" preference means the user wants the model to read from both Man and Woman
    // cards if both are present. To pick a primary when both are drawn we look at the
    // question's gender-specific referent language ("he", "him", "his", "husband",
    // "boyfriend"; "she", "her", "wife", "girlfriend"). We explicitly do NOT switch on
    // topic (job/love): inferring the significator's sex from a career topic is
    // methodologically indefensible — a question about Mahican's career must not anchor
    // the entire GT around the Man card simply because careers have historically been
    // male-coded.
    if (significators.woman && !significators.man) {
      primarySignificator = significators.woman;
      primarySignificatorSource = "default";
    } else if (significators.man && !significators.woman) {
      primarySignificator = significators.man;
      primarySignificatorSource = "default";
    } else if (significators.woman && significators.man) {
      const lowerQ = question.toLowerCase();
      const maleReferent = /\b(he|him|his|husband|boyfriend|fiance|gentleman|male)\b/.test(lowerQ);
      const femaleReferent = /\b(she|her|hers|wife|girlfriend|fiancee|lady|female)\b/.test(lowerQ);
      if (maleReferent && !femaleReferent) {
        primarySignificator = significators.man;
        primarySignificatorSource = "referent";
      } else if (femaleReferent && !maleReferent) {
        primarySignificator = significators.woman;
        primarySignificatorSource = "referent";
      } else {
        // With both selected and no person referent, keep both as relational
        // anchors instead of inventing a primary gendered querent.
        primarySignificator = undefined;
        primarySignificatorSource = undefined;
      }
    }
    // else: neither drawn — primarySignificator stays undefined; the prediction evidence
    // will explicitly note "no significator card in spread".
  } else if (significatorPreference === "woman" && significators.man && !significators.woman) {
    primarySignificator = significators.man;
    primarySignificatorSource = "default";
  } else if (significatorPreference === "man" && significators.woman && !significators.man) {
    primarySignificator = significators.woman;
    primarySignificatorSource = "default";
  }

  const corners = GRAND_TABLEAU_CORNERS.map((i) => ({ index: i, card: cards[i] }));
  const centerFour = GRAND_TABLEAU_CENTER_CARDS.map((i) => ({ index: i, card: cards[i] }));

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
    for (const [rowStep, colStep] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      for (let d = 1; d <= 8; d++) {
        const rowA = sigRow - rowStep * d;
        const colA = sigCol - colStep * d;
        const rowB = sigRow + rowStep * d;
        const colB = sigCol + colStep * d;
        if (rowA < 0 || rowA >= 4 || colA < 0 || colA >= 9 || rowB < 0 || rowB >= 4 || colB < 0 || colB >= 9) continue;
        const idxA = rowA * 9 + colA;
        const idxB = rowB * 9 + colB;
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
    primarySignificatorSource,
    significatorPreference,
    corners,
    centerFour,
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
      layout = buildGrandTableauLayout(cards, cardsMap, significatorPreference, question);
      adjacentPairs = buildGrandTableauPairs(cards, cardsMap, layout);
      break;
    default:
      adjacentPairs = [];
      layout = { type: "single" };
  }

  const timingEvidence: TimingEvidence[] = [];
  if (layoutType !== "grand-tableau") {
    for (const tc of Object.values(TIMING_CARDS)) {
      const found = cards.find((c) => c.id === tc.id);
      if (found) {
        timingEvidence.push({ cardId: tc.id, cardName: found.name, range: tc.range });
      }
    }
  }

  const questionFrame = getQuestionFrame(question);
  const topicFocus: TopicFocus[] = [];
  const lowerQ = question.toLowerCase();
  const explicitCareer = /\b(job|position|role|career|work|employment|interview|salary|promotion|employer)\b/i.test(lowerQ);
  const explicitHealth = /\b(illness|disease|pain|symptom|diagnosis|treatment|surgery|recovery|health|wellness|medical condition)\b/i.test(lowerQ);
  const hasHealthQuestion = explicitHealth && !explicitCareer;
  const topicEntries = Object.entries(QUESTION_TOPICS).sort(([a], [b]) => {
    if (hasHealthQuestion && a === "health") return -1;
    if (hasHealthQuestion && b === "health") return 1;
    return 0;
  });
  if (layoutType !== "linear-sentence") for (const [category, topics] of topicEntries) {
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

  return {
    spreadId,
    question,
    questionDomain: questionFrame.domain,
    questionFrame: questionFrame.instruction,
    cards,
    adjacentPairs,
    layout,
    timingEvidence,
    topicFocus,
  };
}

function matchQuestionTopic(question: string, category: string): boolean {
  const wordBoundary = (kw: string) => new RegExp(`\\b${kw}\\b`, "i");
  const matches = (kws: string[]) => kws.some((kw) => wordBoundary(kw).test(question));
  switch (category) {
    case "love":
      return matches([
        "love", "relationship", "partner", "romance", "marriage", "married", "marry",
        "dating", "boyfriend", "girlfriend", "heart", "commitment", "committed",
      ]);
    case "job":
      return matches([
        // General employment (full word families so 'employed', 'employment' match too)
        "job", "jobs", "work", "working", "works", "career", "careers",
        "employ", "employed", "employment", "employer", "employers",
        "boss", "interview", "interviews", "colleague", "colleagues", "workplace",
        "promotion", "promoted", "promote", "firing", "fired", "fire",
        "layoff", "resign", "resigned", "salary",
        // Professional / qualified contexts that the old matcher missed entirely
        "profession", "professional", "position", "role", "post",
        "qualification", "qualified", "qualify", "credentials",
        "license", "licence", "licensed",
        "medical", "doctor", "nurse", "nursing", "physician", "clinical",
        "hospital", "specialty", "specialist",
        "law", "legal", "attorney", "lawyer",
        "teaching", "academic", "professor",
        "practice", "practicing", "practise",
      ]);
    case "money":
      return matches([
        "money", "finance", "financial", "income",
        "invest", "investing", "investment", "investor",
        "loan", "loans", "debt", "debts",
        "wealth", "wealthy", "budget", "budgets", "afford", "pay", "paid",
      ]);
    case "health":
      return matches([
        "health", "healthy", "illness", "ill", "sick", "sickness",
        "disease", "diseases", "pain", "heal", "healing",
        "recover", "recovery", "doctor", "doctors",
        "hospital", "wellness", "surgery", "surgical",
      ]);
    case "home":
      return matches([
        "home", "house", "apartment", "move", "moving",
        "renovation", "roommate", "property",
      ]);
    case "travel":
      return matches([
        "travel", "traveling", "trip", "vacation", "journey",
        "flight", "visit", "visiting", "holiday", "abroad", "overseas",
      ]);
    default:
      return false;
  }
}
