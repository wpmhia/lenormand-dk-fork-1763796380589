import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { ReadingContext } from "@/lib/reading-context";

/**
 * The reading prompt. DeepSeek interprets the spread; this module supplies the question, the
 * drawn cards in order, their core meanings and the spread's grid. Positions and neighbours
 * are computed from coordinates, never inferred from names.
 */
export const SIMPLE_LENORMAND_SYSTEM_PROMPT = `You are an experienced traditional Lenormand reader.

Interpret the drawn cards using their classical meanings, positions, combinations, and the user's question.

Read the spread as a connected whole. Identify its central theme and give a clear, specific answer supported by the most relevant cards.

Allow the reading to be positive, negative, or mixed. Do not force optimism or pessimism. Do not mechanically list every pair or invent events, motives, or facts about real people.

Use the complete spread rather than treating one negative card or the final card as an automatic verdict.

Distinguish uncertainty from evidence of deception. Do not infer a third party's dishonesty, infidelity or hidden motives unless a clearly supporting combination of cards shows it. Classical negative meanings remain valid when the spread supports them.

Interpret card meanings symbolically and in the context of the question. Do not turn metaphorical meanings into literal contracts, accusations, obligations, or specific actions unless clearly supported by the cards and question.

Write naturally in the user's language, with a direct answer followed by a coherent interpretation.`;

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
  const lines = cards.filter((card) => card.coreMeaning).map((card) => `- ${cardName(card)}: ${card.coreMeaning}`);
  return lines.length ? `Core meanings:\n${lines.join("\n")}` : "";
}

/** The canonical house name for position N: the card whose deck number is N. */
function houseName(index: number): string {
  return CARD_CATALOG.find((card) => card.id === index + 1)?.name ?? `Position ${index + 1}`;
}

/** One row of the grid as names separated by bars. */
function rowsOf(cards: ReadingContext["cards"], rows: number, columns: number): string[] {
  return Array.from({ length: rows }, (_, row) => {
    const names = Array.from({ length: columns }, (_, col) => cardName(cards[row * columns + col]));
    return `Row ${row + 1}: ${names.join(" | ")}`;
  });
}

/**
 * Immediate neighbours of each grid cell, computed from coordinates. Only real cells count: no
 * row wrapping, and a card not listed is not adjacent. Kept to one line per card.
 */
function neighbourLines(cards: ReadingContext["cards"], rows: number, columns: number): string[] {
  const direction = (dr: number, dc: number) =>
    [dr < 0 ? "above" : dr > 0 ? "below" : "", dc < 0 ? "left" : dc > 0 ? "right" : ""].filter(Boolean).join("-");
  return cards.map((card, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const near: string[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if ((dr === 0 && dc === 0) || r < 0 || r >= rows || c < 0 || c >= columns) continue;
        near.push(`${cardName(cards[r * columns + c])} (${direction(dr, dc)})`);
      }
    }
    return `- ${cardName(card)} (row ${row + 1}, column ${col + 1}): ${near.join(", ") || "none"}`;
  });
}

/** The spread's structure, chosen by the number of drawn cards. */
function structure(cards: ReadingContext["cards"]): string {
  switch (cards.length) {
    case 1:
      return "Spread: a single card, read directly in relation to the question.";
    case 9:
      return [
        "Spread: 3x3 grid. Rows run top to bottom, columns left to right. The centre card (row 2, column 2) is the focal point.",
        ...rowsOf(cards, PETIT_SIZE, PETIT_SIZE),
        "Grid positions are not time order. The bottom-right card (row 3, column 3) is an ordinary card in the grid, not an automatic outcome.",
      ].join("\n");
    case 36:
      return [
        "Spread: 4x9 grid of 36 cards. Positions are numbered left to right, then top to bottom.",
        ...rowsOf(cards, GT_ROWS, GT_COLUMNS),
        "Houses (the card at position N occupies the house of the card with deck number N):",
        ...cards.map((card, index) => `${index + 1}: ${cardName(card)} — ${houseName(index)} house`),
        ...significatorLines(cards),
        "Immediate neighbours of each card (horizontal, vertical or diagonal; no row wrapping; a card not listed is not adjacent). A house relation is not a spatial one:",
        ...neighbourLines(cards, GT_ROWS, GT_COLUMNS),
      ].join("\n");
    default:
      return `Spread: ${cards.length} cards in a line, read left to right. Adjacent cards are neighbours; there is no other geometry.`;
  }
}

function significatorLines(cards: ReadingContext["cards"]): string[] {
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
  return [
    `Drawn cards, in order:\n${orderedCards(context.cards)}`,
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
    `Return only one JSON object with exactly these fields: {"answer": string, "reading": string}. "answer" is the direct answer in one or two sentences; "reading" is the coherent interpretation in plain prose. Do not use Markdown fences.`,
  ].join("\n\n");
}
