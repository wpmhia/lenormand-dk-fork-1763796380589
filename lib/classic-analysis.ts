import { CARD_CATALOG } from "@/lib/card-catalog";
import { getCardById } from "@/lib/data";
import { getGrandTableauAdjacentCards } from "@/lib/data";
import type { Card, ReadingCard } from "@/lib/types";
import type { SpreadId } from "@/lib/spread-definitions";
import {
  gridLinks,
  resolveLinks,
  selectMostRelevant,
  sequenceLinks,
  type ResolvedCombination,
  type UnknownCombination,
  type PairLink,
} from "@/lib/combination-engine";

/**
 * Deterministic classic analysis. No model call, no randomness, no invented events: it reports
 * the traditional meaning of each card, its place in the spread and the geometry that connects
 * the cards. Combination meanings are not included because the catalogue holds none that are
 * reviewed; the analysis says so rather than inventing them.
 */

export interface ClassicCardLine {
  position: number;
  /** Catalogue id of the drawn card, used to read its core meaning without matching names. */
  cardId: number;
  name: string;
  keywords: string[];
  meaning: string;
}

export interface ClassicAnalysis {
  spreadId: SpreadId;
  question: string;
  summary: string;
  cards: ClassicCardLine[];
  geometry: string[];
  /** Curated combinations that apply to this spread. Empty when none are curated. */
  combinations: ResolvedCombination[];
  /** Pairs the engine selected but cannot interpret, shown as card meanings only. */
  unknownCombinations: UnknownCombination[];
  note: string;
}

/** States exactly what this analysis covers: single card meanings and geometry, no combinations. */
const NOTE =
  "This classic analysis lists each card's traditional meaning, its position and the spread's geometry. It does not interpret card combinations and does not predict events.";

function cardMeaning(card: Card | undefined, fallbackId: number): { name: string; keywords: string[]; meaning: string } {
  if (!card) return { name: `Card ${fallbackId}`, keywords: [], meaning: "" };
  return {
    name: card.name,
    keywords: card.keywords ?? [],
    meaning: card.meaning?.general ?? card.uprightMeaning ?? "",
  };
}

/** The drawn cards in position order, with their catalogue meanings. */
function cardLines(cards: ReadingCard[], allCards: Card[]): ClassicCardLine[] {
  return cards.map((card, index) => {
    const data = cardMeaning(getCardById(allCards, card.id), card.id);
    return { position: index + 1, cardId: card.id, ...data };
  });
}

/** Rows, columns and diagonals of a square grid, as card names. */
function gridGeometry(cards: ReadingCard[], allCards: Card[], size: number): string[] {
  const name = (index: number) => cardMeaning(getCardById(allCards, cards[index].id), cards[index].id).name;
  const lines: string[] = [];
  for (let r = 0; r < size; r++) {
    lines.push(`Row ${r + 1}: ${Array.from({ length: size }, (_, c) => name(r * size + c)).join(" | ")}`);
  }
  for (let c = 0; c < size; c++) {
    lines.push(`Column ${c + 1}: ${Array.from({ length: size }, (_, r) => name(r * size + c)).join(" | ")}`);
  }
  lines.push(`Diagonal (top-left to bottom-right): ${Array.from({ length: size }, (_, i) => name(i * size + i)).join(" | ")}`);
  lines.push(`Diagonal (top-right to bottom-left): ${Array.from({ length: size }, (_, i) => name(i * size + (size - 1 - i))).join(" | ")}`);
  return lines;
}

/** The 3x3 centre card and its eight neighbours. */
function centreLine(cards: ReadingCard[], allCards: Card[]): string {
  const name = (index: number) => cardMeaning(getCardById(allCards, cards[index].id), cards[index].id).name;
  const neighbours = [0, 1, 2, 3, 5, 6, 7, 8].map(name).join(", ");
  return `Centre (row 2, column 2): ${name(4)}. Surrounding cards: ${neighbours}.`;
}

/** The 4x9 grid rows, read left to right, row by row. */
function grandTableauRows(cards: ReadingCard[], allCards: Card[]): string[] {
  const name = (index: number) => cardMeaning(getCardById(allCards, cards[index].id), cards[index].id).name;
  return Array.from({ length: 4 }, (_, r) => {
    const row = Array.from({ length: 9 }, (_, c) => name(r * 9 + c));
    return `Row ${r + 1}: ${row.join(" | ")}`;
  });
}

/** Grand Tableau geometry: the grid, the houses and the significators. */
function grandTableauGeometry(cards: ReadingCard[], allCards: Card[]): string[] {
  const lines = grandTableauRows(cards, allCards);
  const woman = cards.findIndex((c) => c.id === 29);
  const man = cards.findIndex((c) => c.id === 28);
  if (woman >= 0) lines.push(`Woman (significator) is at position ${woman + 1}.`);
  if (man >= 0) lines.push(`Man (significator) is at position ${man + 1}.`);
  return lines;
}

/** Direct neighbours on the 4x9 grid, read from the existing helper. */
function grandTableauNeighbours(cards: ReadingCard[], allCards: Card[]): string[] {
  return cards.map((card, index) => {
    const name = cardMeaning(getCardById(allCards, card.id), card.id).name;
    const neighbours = getGrandTableauAdjacentCards(cards, index).map((c) => cardMeaning(getCardById(allCards, c.id), c.id).name);
    return `${name} (position ${index + 1}): ${neighbours.join(", ") || "none"}`;
  });
}

/**
 * Builds the classic analysis for a drawn spread. Pure: the same inputs always give the same
 * output, and nothing here calls a model.
 */
/** The links the engine reads for a spread, most relevant first. Geometry is never inferred from names. */
function spreadLinks(spreadId: SpreadId, ids: number[]): PairLink[] {
  switch (ids.length) {
    case 1:
      return [];
    case 3:
    case 5:
      return sequenceLinks(ids);
    case 9:
      return selectMostRelevant(gridLinks(ids, 3, 3), [5], 12);
    case 36:
      return selectMostRelevant(gridLinks(ids, 4, 9), [28, 29], 16);
    default:
      return [];
  }
}

export function buildClassicAnalysis(
  spreadId: SpreadId,
  question: string,
  cards: ReadingCard[],
  allCards: Card[] = CARD_CATALOG,
): ClassicAnalysis {
  const lines = cardLines(cards, allCards);
  const count = cards.length;
  let geometry: string[] = [];

  switch (count) {
    case 1:
      geometry = ["Single card, read directly in relation to the question."];
      break;
    case 3:
    case 5:
      geometry = [`Line of ${count} cards, read left to right in the order drawn.`];
      break;
    case 9:
      geometry = [centreLine(cards, allCards), ...gridGeometry(cards, allCards, 3)];
      break;
    case 36:
      geometry = [...grandTableauGeometry(cards, allCards), ...grandTableauNeighbours(cards, allCards)];
      break;
    default:
      geometry = [];
  }

  const summary = count === 1
    ? `Single card: ${lines[0]?.name ?? ""}. Its traditional meaning is listed below.`
    : `${count} cards in the order drawn. Each card's traditional meaning and the spread's geometry are listed below.`;

  const ids = cards.map((card) => card.id);
  const names = new Map(ids.map((id) => [id, cardMeaning(getCardById(allCards, id), id).name]));
  const { resolved, unknown } = resolveLinks(spreadLinks(spreadId, ids), names);

  return {
    spreadId,
    question,
    summary,
    cards: lines,
    geometry,
    combinations: resolved,
    unknownCombinations: unknown,
    note: NOTE,
  };
}

/** The first traditional phrase of a card's core meaning, at most three keywords, no invented text. */
export function shortCardPhrase(general: string): string {
  return general
    .split(/[.;]/)[0]
    .split(/,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

/** "a, b and c" without any added meaning. */
function joinWords(words: string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export interface CardPreview {
  position: number;
  name: string;
  phrase: string;
}

/**
 * The results-page preview: each drawn card with a short traditional phrase from its catalogue
 * core meaning, plus a factual line naming the themes the cards carry. It only lists what the
 * catalogue states. It makes no prediction and no combination claim.
 */
export function buildCardPreview(analysis: ClassicAnalysis, allCards: Card[] = CARD_CATALOG): {
  cards: CardPreview[];
  themes: string;
} {
  const cards = analysis.cards.map((line) => {
    const data = getCardById(allCards, line.cardId);
    return {
      position: line.position,
      name: line.name,
      phrase: shortCardPhrase(data?.meaning?.general ?? ""),
    };
  });
  // The first keyword of every drawn card, so each card is represented once and none is cut off.
  // Person cards name a role, not a theme; the catalogue states that identity depends on the
  // question, so they are shown neutrally as "a person" rather than as a keyword phrase.
  const keywords = [...new Set(
    analysis.cards.map((line) => {
      const data = getCardById(allCards, line.cardId);
      if (data?.keywords?.[0] === "female person card" || data?.keywords?.[0] === "male person card") return "a person";
      return data?.keywords?.[0];
    }).filter((k): k is string => Boolean(k)),
  )];
  const themes = keywords.length
    ? `Your ${analysis.cards.length} cards carry themes of ${joinWords(keywords)}.`
    : "";
  return { cards, themes };
}
