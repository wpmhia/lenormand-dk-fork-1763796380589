import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { ReadingContext } from "@/lib/reading-context";
import { gridRelations, describeRelations } from "@/lib/grid-relations";

/**
 * The reading prompt. DeepSeek interprets the spread; this module supplies the question, the
 * drawn cards in order, their core meanings and the spread's grid. Positions are computed from
 * coordinates, never inferred from names; neighbour relations are left to the grid.
 */
export const SIMPLE_LENORMAND_SYSTEM_PROMPT = `You are an experienced traditional Lenormand card reader.

Interpret the user's exact question through the drawn cards, their classical meanings, combinations, order and spread geometry.

The meanings are the vocabulary; the combinations are the message. Weigh how cards modify each other above any single keyword list, and build the reading around the strongest supported combination.

Read the cards as a connected story and choose the most convincing interpretation. For yes/no questions, give the direction the cards favour, even when the message is mixed. If the cards genuinely point in different directions, explain that conflict rather than defaulting to neutrality.

For predictive questions, focus on the future development and likely outcome rather than primarily describing the present. Weigh supporting and conflicting card combinations before choosing the dominant direction. Make a clear prediction within the Lenormand reading, without presenting symbolic indications as verified facts.

Be specific, candid and willing to deliver positive or negative readings. Do not evade sensitive questions, repeat disclaimers, or replace divination with generic advice.

Ground the interpretation in the actual cards. Do not invent cards, events or specific identities. Treat the cards as symbolic indications, not verified facts.

Person roles: assign Man and Woman only when the question or the spread makes the role clear. Never assign a person to a card, or a pronoun to a person, that the question does not establish. If the role is unclear, describe the card's meaning without naming who it refers to.

Meanings come from the combinations, not from the question's worry. Choose each card's sense from its position, its neighbours and the question's actual subject. Do not pick a negative meaning because the question suggests fear, such as reading Snake, Fox or Book as infidelity or deceit unless the cards around them support that.

Weigh counter-cards together. A card that resists a negative development, such as Anchor or Mountain against temptation, is part of the reading and is not discarded. Do not produce a dramatic conclusion from a few symbols: when the evidence is weak or mixed, say so and state the limit of what the cards can show.

Timing: do not name specific periods such as months or weeks. If a time indication is useful, describe it as a symbolic estimate, never as a fact.

Answer first: the "answer" is a clear, direct response to the question, stated plainly, before the detailed reading develops it.

Write naturally in the user's language.`;

/** Output budget covering DeepSeek's reasoning tokens and the final JSON answer. */
export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 1) return 4096;
  if (cardCount <= 3) return 6144;
  if (cardCount <= 5) return 8192;
  if (cardCount <= 9) return 12288;
  return 16384;
}

export interface AIReadingResponse {
  reading: string;
  source?: string;
}

const GT_COLUMNS = 9;
const GT_ROWS = 4;
const PETIT_SIZE = 3;

function sanitize(input: string, maxLength: number): string {
  return input.slice(0, maxLength).replace(/[\x00-\x20\x7F-\x9F]+/g, " ").trim();
}

function sanitizeQuestion(question: string): string {
  return sanitize(question, MAX_QUESTION_LENGTH);
}

function cardName(card: { name: string }): string {
  return sanitize(card.name, MAX_CARD_NAME_LENGTH);
}

/** Drawn cards in order. A deck number is shown only when it differs from the position. */
function orderedCards(cards: ReadingContext["cards"]): string {
  return cards
    .map((card, index) => `${index + 1}. ${cardName(card)}${card.id !== index + 1 ? ` [card ${card.id}]` : ""}`)
    .join("\n");
}

function coreMeanings(cards: ReadingContext["cards"]): string {
  const lines = cards
    .filter((card) => card.coreMeaning)
    .map((card) => {
      const secondary = (card.secondaryMeanings ?? []).filter(Boolean);
      const extra = secondary.length ? ` Secondary (context-dependent): ${secondary.join(" ")}` : "";
      return `- ${cardName(card)}: ${card.coreMeaning}${extra}`;
    });
  return lines.length
    ? `Core meanings (use a secondary meaning only when the question and the surrounding cards support it):\n${lines.join("\n")}`
    : "";
}

/** The canonical house name for position N: the card whose deck number is N. */
export function houseName(index: number): string {
  return CARD_CATALOG.find((card) => card.id === index + 1)?.name ?? `Position ${index + 1}`;
}

/** One row of the grid as names separated by bars. */
function rowsOf(cards: ReadingContext["cards"], rows: number, columns: number): string[] {
  return Array.from({ length: rows }, (_, row) => {
    const names = Array.from({ length: columns }, (_, col) => cardName(cards[row * columns + col]));
    return `Row ${row + 1}: ${names.join(" | ")}`;
  });
}

/** The columns of a square grid, read top to bottom, computed from coordinates. */
function columnsOf(cards: ReadingContext["cards"], size: number): string[] {
  return Array.from({ length: size }, (_, col) => {
    const names = Array.from({ length: size }, (_, row) => cardName(cards[row * size + col]));
    return `Column ${col + 1}: ${names.join(" | ")}`;
  });
}

/** The two diagonals of a square grid: top-left to bottom-right, and top-right to bottom-left. */
function diagonalsOf(cards: ReadingContext["cards"], size: number): string[] {
  const main = Array.from({ length: size }, (_, i) => cardName(cards[i * size + i]));
  const anti = Array.from({ length: size }, (_, i) => cardName(cards[i * size + (size - 1 - i)]));
  return [`Diagonal (top-left to bottom-right): ${main.join(" | ")}`, `Diagonal (top-right to bottom-left): ${anti.join(" | ")}`];
}

/** The spread's structure, chosen by the number of drawn cards. */
function structure(cards: ReadingContext["cards"]): string {
  switch (cards.length) {
    case 1:
      return "Spread: a single card, read directly in relation to the question.";
    case 9:
      return [
        "Spread: 3x3 grid. Rows run top to bottom, columns left to right. The centre card (row 2, column 2) is the focal point: read the surrounding cards in relation to it.",
        ...rowsOf(cards, PETIT_SIZE, PETIT_SIZE),
        ...columnsOf(cards, PETIT_SIZE),
        ...diagonalsOf(cards, PETIT_SIZE),
        "Grid positions are not time order. The bottom-right card (row 3, column 3) is an ordinary card in the grid, not an automatic outcome.",
      ].join("\n");
    case 36: {
      const names = cards.map((card) => cardName(card));
      const relations = gridRelations(names, GT_ROWS, GT_COLUMNS);
      return [
        "Spread: 4x9 grid of 36 cards. Positions run left to right, then top to bottom. Row and column are given for every card.",
        "Spatial facts are supplied below. They are literal: use them exactly and never recalculate or infer any other position, neighbour or direction.",
        ...rowsOf(cards, GT_ROWS, GT_COLUMNS),
        "Direct relations (only these cells are adjacent; a card at the end of one row is not adjacent to the start of the next):",
        ...describeRelations(relations, (position) => names[position - 1]),
        "House facts (not spatial): the card in position N belongs to the house of the card with deck number N.",
        ...cards.map((card, index) => `${index + 1}: ${cardName(card)} — ${houseName(index)} house`),
        ...significatorLines(cards),
      ].join("\n");
    }
    default: {
      const middle = Math.floor(cards.length / 2);
      const focal = cards.length % 2 === 1 ? ` The central card (position ${middle + 1}, ${cardName(cards[middle])}) is the focal point.` : "";
      return `Spread: ${cards.length} cards in a line, read left to right. Adjacent cards are neighbours; there is no other geometry.${focal}`;
    }
  }
}

export function significatorLines(cards: ReadingContext["cards"]): string[] {
  const woman = cards.findIndex((card) => card.id === 29);
  const man = cards.findIndex((card) => card.id === 28);
  return [
    ...(woman >= 0 ? [`Woman (significator) is at position ${woman + 1}.`] : []),
    ...(man >= 0 ? [`Man (significator) is at position ${man + 1}.`] : []),
  ];
}

/** The chosen significator as a reading focus, only when that card is actually drawn. */
function significatorFocus({ significatorPreference, cards }: ReadingContext): string {
  if (significatorPreference === "both") return "";
  const focusId = significatorPreference === "man" ? 28 : 29;
  if (!cards.some((card) => card.id === focusId)) return "";
  return `Reading focus: ${significatorPreference === "man" ? "Man" : "Woman"}.`;
}

/** The spread facts shared by the reading and the follow-up. */
export function buildSpreadFacts(context: ReadingContext): string {
  // The 3x3 Petit Tableau and the 4x9 Grand Tableau are supplied only as their grids. A numbered
  // list would repeat every card, and for the Petit Tableau would read as a sequence.
  const gridOnly = context.cards.length === 9 || context.cards.length === 36;
  const cardList = gridOnly ? "" : `Drawn cards, in order:\n${orderedCards(context.cards)}`;
  return [
    cardList,
    coreMeanings(context.cards),
    structure(context.cards),
    significatorFocus(context),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The reading prompt: question, shared spread facts, then the JSON shape. */
export function buildSimpleReadingPrompt(context: ReadingContext): string {
  return [
    `User question:\n${sanitizeQuestion(context.question)}`,
    buildSpreadFacts(context),
    `Interpret the supplied card geometry literally. Never recalculate or invent positions, neighbours, directions or card relationships. Distinguish direct horizontal, vertical and diagonal relations from house relations; a house is not a neighbour. Do not infer facing direction unless it is supplied. Weigh the strongest supporting and contradicting combinations before forming a conclusion, and do not ignore cards to support a preferred answer. Give a direct answer based on the overall balance of the spread, not on a single negative or positive card. Treat the reading as symbolic interpretation, not as evidence of what another person has done.`,
    `Build the reading around the single strongest relevant combination. Name a conflicting card only where it changes the outcome; do not list unrelated alternatives. Keep symbolic indications distinct from verified facts.`,
    `Return only one JSON object with exactly these fields, in this order: {"reading": string, "answer": string}. "reading" is the coherent interpretation in plain prose, worked out from the spread first; "answer" is the direct answer to the question in one or two sentences, drawn from that reading. Do not use Markdown fences.`,
  ].join("\n\n");
}
