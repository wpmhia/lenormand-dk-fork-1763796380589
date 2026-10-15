import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type {
  ReadingContext,
  GrandTableauLayout,
  LinearSentenceLayout,
  PetitTableauLayout,
} from "@/lib/reading-context";

/**
 * The server supplies the current question, drawn cards, deterministic spread facts, and
 * concise source-compared card meanings. The model performs the contextual synthesis; the
 * server does not select an outcome or send unreviewed pair prose. The response contract
 * lives in the user prompt beside the evidence. The system prompt only locks the output
 * language; it does not add an interpretation method or card meanings.
 */
export const SIMPLE_LENORMAND_SYSTEM_PROMPT = "Respond naturally in the language of the user's question. Keep canonical English card names in patterns[].cards.";

/**
 * Output budget per spread. Thinking tokens count against this limit, so each value is the
 * JSON answer size plus a fixed reasoning reserve. The JSON share is unchanged.
 */
const REASONING_RESERVE_TOKENS = 4_000;

export function getTokenBudget(cardCount: number): number {
  let jsonBudget: number;
  if (cardCount <= 1) jsonBudget = 800;
  else if (cardCount <= 3) jsonBudget = 1_100;
  else if (cardCount <= 5) jsonBudget = 1_400;
  else if (cardCount <= 9) jsonBudget = 2_000;
  else jsonBudget = 2_600;
  return jsonBudget + REASONING_RESERVE_TOKENS;
}

export interface AIReadingResponse {
  reading: string;
  source?: string;
}

function sanitizeInput(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x20\x7F-\x9F]+/g, " ")
    .trim();
}

/**
 * Formats a card for the AI prompt.
 *
 * NOTE: `strength` is intentionally NOT included. It is an internal classification
 * metadata field, not a metaphysical intensity. A Coffin does not become "neutral"
 * and a Cross does not become "weak" because of a database field. Strength metadata
 * is still kept on the Card type for UI / learning purposes, but it must not leak
 * into synthesis prompts, or the model will fabricate prose like
 * "the weak energy of the opening cards" out of nothing.
 *
 * Man and Woman are written plainly. A significator preference is only an optional
 * reading focus; it does not identify a person or relationship.
 */
function fmtCard(card: { name: string; keywords?: string[]; strength?: string }): string {
  return sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
}

/**
 * A card as it appears in the structural layer: canonical English name plus canonical
 * deck number, which is what makes the spread referenceable against the real deck.
 *
 * The deck number is printed only when it differs from the position the card occupies.
 * A freshly drawn tableau puts every card in its own position, and printing `1 1 Rider`
 * there would read as a typo rather than as data; a shuffled tableau still shows the
 * full mapping because the number then carries real information.
 */
function fmtCell(card: { id: number; name: string; keywords?: string[] }, position?: number): string {
  const name = fmtCard(card);
  return position !== undefined && position !== card.id ? `${name} [card ${card.id}]` : name;
}

/** Whether any drawn card sits at a position other than its own deck number. */
function hasDisplacedCards(context: ReadingContext): boolean {
  return context.cards.some((card, index) => card.id !== index + 1);
}

const DISPLACED_CARD_LEGEND = `Notation: "<name> [card N]" also gives the canonical deck number N where the drawn card occupies a position other than its own.`;

const GT_GRID_ROWS = 4;
const GT_GRID_COLUMNS = 9;
const PETIT_GRID = 3;


function cardsByPosition(context: ReadingContext): string {
  return context.cards.map((card, index) => `${index + 1} ${fmtCell(card, index + 1)}`).join(" | ");
}

function singleSpreadFacts(context: ReadingContext): string[] {
  return [
    `Single card draw (${context.cards.length} card): ${cardsByPosition(context)}`,
    "There is no grid, no line and no combination in this spread: the card is read on its own.",
  ];
}

function linearSpreadFacts(context: ReadingContext, layout: LinearSentenceLayout): string[] {
  const facts = [`Linear sentence spread (${context.cards.length} cards, read left to right):`];
  for (const position of context.cards.map((card, index) => ({ card, index }))) {
    const role = layout.positions.find((entry) => entry.index === position.index);
    const suffix = role ? ` (role defined by this spread: ${role.role})` : "";
    facts.push(`- position ${position.index + 1}: ${fmtCell(position.card, position.index + 1)}${suffix}`);
  }
  facts.push("Adjacency in this spread means consecutive positions. There is no other geometry.");
  facts.push("Reading method: read the line as one connected Lenormand sequence, left to right. The line as a whole carries the meaning. The central card is the focal point. Adjacent combinations and the complete line together determine the interpretation. No card, including the last, is fixed in advance as the conclusion.");
  return facts;
}

/**
 * The same grid laid out as visual rows.
 *
 * This is not interpretation and not a Lenormand rule: it is the identical deterministic
 * geometry in a form a language model reads more reliably. Reconstructing a 4x9 grid from
 * 36 coordinate lines while writing a long reading is exactly where a textual model slips;
 * the coordinates stay too, because the validator and any finer claim still need them.
 */
function gridRowFacts(cards: ReadingContext["cards"], rowCount: number, columnCount: number): string[] {
  const facts: string[] = [];
  for (let row = 0; row < rowCount; row++) {
    const cells = Array.from({ length: columnCount }, (_, column) => row * columnCount + column);
    facts.push(`Row ${row + 1}: ${cells.map((cell) => fmtCard(cards[cell])).join(" | ")}`);
  }
  return facts;
}

function gridColumnFacts(cards: ReadingContext["cards"], rowCount: number, columnCount: number): string[] {
  const facts: string[] = [];
  for (let column = 0; column < columnCount; column++) {
    const cells = Array.from({ length: rowCount }, (_, row) => row * columnCount + column);
    facts.push(`Column ${column + 1}: ${cells.map((cell) => fmtCard(cards[cell])).join(" | ")}`);
  }
  return facts;
}

function gridDiagonalFacts(cards: ReadingContext["cards"], size: number): string[] {
  const topLeftToBottomRight = Array.from({ length: size }, (_, index) => index * size + index);
  const topRightToBottomLeft = Array.from({ length: size }, (_, index) => index * size + (size - index - 1));
  return [
    `Diagonal (top-left to bottom-right): ${topLeftToBottomRight.map((cell) => fmtCard(cards[cell])).join(" | ")}`,
    `Diagonal (top-right to bottom-left): ${topRightToBottomLeft.map((cell) => fmtCard(cards[cell])).join(" | ")}`,
  ];
}

function reviewedCardMeaningFacts(cards: ReadingContext["cards"]): string[] {
  const withCore = cards.filter((card) => card.coreMeaning);
  if (withCore.length === 0) return [];

  const facts = [
    "Core card meaning references (symbolic reference, not proof of events):",
    ...withCore.map((card) => `- ${fmtCard(card)}: ${card.coreMeaning}`),
  ];
  const secondary = cards.flatMap((card) =>
    (card.secondaryMeanings ?? []).map((meaning) => `- ${fmtCard(card)} — context-dependent secondary sense: ${meaning}`),
  );
  if (secondary.length > 0) {
    facts.push("Secondary interpretations are tradition-dependent and require support from this question and spread:");
    facts.push(...secondary);
  }
  return facts;
}

function petitSpreadFacts(context: ReadingContext, layout: PetitTableauLayout): string[] {
  const facts = [
    `Petit Tableau, a 3x3 grid of ${context.cards.length} cards. Position 1 is row 1 column 1; numbering runs left to right, then top to bottom.`,
    ...gridRowFacts(context.cards, PETIT_GRID, PETIT_GRID),
    ...gridColumnFacts(context.cards, PETIT_GRID, PETIT_GRID),
    ...gridDiagonalFacts(context.cards, PETIT_GRID),
    "Position map (where each card sits in the grid):",
    ...context.cards.map((card, index) => {
      const row = Math.floor(index / PETIT_GRID) + 1;
      const column = (index % PETIT_GRID) + 1;
      return `- position ${index + 1} (row ${row}, col ${column}): ${fmtCard(card)}`;
    }),
    `Centre card: ${fmtCard(layout.center.card)}.`,
    ...petitCentreDirectionFacts(context.cards),
    "The centre is the focal influence. Use the rows, columns, diagonals and neighbours that bear on the question; do not impose chronology.",
  ];
  return facts;
}

/**
 * The eight directional neighbours of the Petit Tableau centre card, derived from the grid
 * offsets. Each direction names the card in that cell, so the model reads direction from a
 * fact instead of inferring it from a row or diagonal line. Nothing here depends on which
 * cards were drawn.
 */
function petitCentreDirectionFacts(cards: ReadingContext["cards"]): string[] {
  const centre = Math.floor(PETIT_GRID / 2);
  const facts: string[] = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      const card = cards[(centre + rowOffset) * PETIT_GRID + (centre + columnOffset)];
      if (card) facts.push(`- ${gridDirection(rowOffset, columnOffset)} of the centre: ${fmtCard(card)}`);
    }
  }
  return ["Directional neighbours of the centre card (the eight cells around it):", ...facts];
}

/**
 * Direction of a neighbour relative to the person card, from grid offsets (row, column).
 * Row -1 is above, +1 below; column -1 is left, +1 right.
 */
function gridDirection(rowOffset: number, columnOffset: number): string {
  const vertical = rowOffset < 0 ? "above" : rowOffset > 0 ? "below" : "";
  const horizontal = columnOffset < 0 ? "left" : columnOffset > 0 ? "right" : "";
  if (vertical && horizontal) return `${vertical}-${horizontal}`;
  return vertical || horizontal;
}

/**
 * Complete, deterministic spatial relations for every Grand Tableau card: its grid
 * coordinates and every immediate neighbour with its direction. The model reads these
 * facts instead of deriving positions, directions or adjacency itself.
 */
function grandTableauCardRelationFacts(cards: ReadingContext["cards"]): string[] {
  const facts = [
    "Spatial relations for every card (coordinates are row, column; neighbours are the complete list of immediate grid cells, horizontal, vertical and diagonal; no row wrapping; a card not listed is not adjacent):",
  ];
  cards.forEach((card, index) => {
    const row = Math.floor(index / GT_GRID_COLUMNS);
    const column = index % GT_GRID_COLUMNS;
    const neighbours: string[] = [];
    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
        if (rowOffset === 0 && columnOffset === 0) continue;
        const r = row + rowOffset;
        const c = column + columnOffset;
        if (r < 0 || r >= GT_GRID_ROWS || c < 0 || c >= GT_GRID_COLUMNS) continue;
        neighbours.push(`${fmtCard(cards[r * GT_GRID_COLUMNS + c])} (${gridDirection(rowOffset, columnOffset)})`);
      }
    }
    facts.push(`- ${fmtCard(card)}: row ${row + 1}, column ${column + 1}; neighbours: ${neighbours.length ? neighbours.join(", ") : "none"}.`);
  });
  return facts;
}

function grandTableauPersonNeighbourFacts(cards: ReadingContext["cards"]): string[] {
  const facts = ["Immediate neighbours (horizontal, vertical and diagonal grid cells; no row wrapping). Each list is complete; unlisted cards are not immediate neighbours:"];

  for (const person of [
    { id: 28, name: "Man" },
    { id: 29, name: "Woman" },
  ]) {
    const index = cards.findIndex((card) => card.id === person.id);
    if (index < 0) continue;

    const row = Math.floor(index / GT_GRID_COLUMNS);
    const column = index % GT_GRID_COLUMNS;
    const neighbours: string[] = [];

    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
        if (rowOffset === 0 && columnOffset === 0) continue;

        const neighbourRow = row + rowOffset;
        const neighbourColumn = column + columnOffset;
        if (
          neighbourRow < 0 || neighbourRow >= GT_GRID_ROWS
          || neighbourColumn < 0 || neighbourColumn >= GT_GRID_COLUMNS
        ) continue;

        const neighbour = cards[neighbourRow * GT_GRID_COLUMNS + neighbourColumn];
        if (neighbour) neighbours.push(`${fmtCard(neighbour)} (${gridDirection(rowOffset, columnOffset)})`);
      }
    }

    facts.push(`- ${person.name}: row ${row + 1}, column ${column + 1}; immediate neighbours: ${neighbours.length ? neighbours.join(", ") : "none"}.`);

    const twoColumnsAway = [-2, 2].flatMap((offset) => {
      const separatedColumn = column + offset;
      if (separatedColumn < 0 || separatedColumn >= GT_GRID_COLUMNS) return [];
      const separated = cards[row * GT_GRID_COLUMNS + separatedColumn];
      return separated ? [`${fmtCard(separated)} (${offset < 0 ? "two columns left" : "two columns right"})`] : [];
    });
    if (twoColumnsAway.length > 0) {
      facts.push(`- Non-neighbours exactly two columns from ${person.name} in the same row: ${twoColumnsAway.join(", ")}.`);
    }
  }

  const manIndex = cards.findIndex((card) => card.id === 28);
  const womanIndex = cards.findIndex((card) => card.id === 29);
  if (manIndex >= 0 && womanIndex >= 0) {
    const rowDistance = Math.abs(Math.floor(manIndex / GT_GRID_COLUMNS) - Math.floor(womanIndex / GT_GRID_COLUMNS));
    const columnDistance = Math.abs((manIndex % GT_GRID_COLUMNS) - (womanIndex % GT_GRID_COLUMNS));
    const adjacent = rowDistance <= 1 && columnDistance <= 1;
    facts.push(`- Man and Woman: ${rowDistance} row(s) and ${columnDistance} column(s) apart${adjacent ? " (immediate neighbours)" : " (not immediate neighbours)"}.`);
  }

  return facts;
}

/**
 * The optional reading-focus statement, derived only from the selected preference and
 * cards actually present. It makes no assertion about who a person card represents.
 */
export function significatorFocusFacts(
  preference: "woman" | "man" | "both",
  presentLabels: string[],
): string[] {
  const selectedFocus = preference === "man" ? "Man" : preference === "woman" ? "Woman" : null;

  if (selectedFocus && presentLabels.includes(selectedFocus)) {
    return [`- Reading focus: ${selectedFocus}.`];
  }
  return [];
}

function grandTableauSpreadFacts(context: ReadingContext, layout: GrandTableauLayout): string[] {
  const facts = [
    `Grand Tableau, a 4x9 grid of ${context.cards.length} cards. Position 1 is row 1 column 1; numbering runs left to right, then top to bottom.`,
    ...gridRowFacts(context.cards, GT_GRID_ROWS, GT_GRID_COLUMNS),
    `Central cells (a 4x9 grid has four, not one, centre cells): positions 14, 15, 23, 24 — ${[13, 14, 22, 23].map((index) => fmtCard(context.cards[index])).join(" | ")}.`,
    "Position map (every position with its drawn card and the house that card occupies):",
    ...layout.houses.map((house, index) => {
      const card = house.occupyingCard;
      const row = Math.floor(index / GT_GRID_COLUMNS) + 1;
      const column = (index % GT_GRID_COLUMNS) + 1;
      return `- position ${index + 1} (row ${row}, col ${column}): ${fmtCard(card)} — ${house.houseName} house`;
    }),
  ];

  facts.push("");
  facts.push(...grandTableauCardRelationFacts(context.cards));
  facts.push(...grandTableauPersonNeighbourFacts(context.cards));
  facts.push("Immediate adjacency and occupying another card's house are separate relationships; neither implies the other.");

  facts.push("");
  facts.push("House rule: every position has exactly one card. A card at position N occupies the house of the card with deck number N, not its own card's house. Adjacent cards do not change each other's house. To answer a house question, check the occupant at that position. A house relation is not a spatial one: a card that occupies another card's house is not thereby next to, above or below that card; use the grid position and neighbour lists for spatial claims.");
  facts.push("");
  facts.push("Synthesis: focus on the cards and lines that bear on the question (person cards and their neighbours, the four central cells, the corners). The grid has no fate row and no single outcome position.");
  return facts;
}

/**
 * Deterministic geometry and source-compared core meaning references for every spread.
 *
 * The layer supplies the complete spread and only factual geometry. The model interprets
 * the sourced card meanings in context and is not asked to recompute positions.
 */
export function buildSpreadFacts(context: ReadingContext): string {
  const layout = context.layout;
  const body = ((): string => {
    switch (layout.type) {
      case "single":
        return singleSpreadFacts(context).join("\n");
      case "linear-sentence":
        return linearSpreadFacts(context, layout).join("\n");
      case "petit-tableau":
        return petitSpreadFacts(context, layout).join("\n");
      case "grand-tableau":
        return grandTableauSpreadFacts(context, layout).join("\n");
    }
  })();
  const presentPeople = context.cards.flatMap((card) =>
    card.id === 28 ? ["Man"] : card.id === 29 ? ["Woman"] : [],
  );
  const focus = significatorFocusFacts(context.significatorPreference, presentPeople);
  const meanings = reviewedCardMeaningFacts(context.cards);
  const completeBody = [body, ...focus, "", ...meanings].join("\n");
  return hasDisplacedCards(context) ? `${DISPLACED_CARD_LEGEND}\n${completeBody}` : completeBody;
}

/**
 * The output request. One four-field contract for every spread. A smaller spread is not a
 * different shape; the model decides how much each spread needs to say.
 */
const OUTPUT_CONTRACT = `You are an experienced classical Lenormand reader. Interpret the drawn cards in answer to the question: read each card by its classical meaning, in its position and in combination with the cards around it, and give one coherent conclusion. Use only the cards drawn in this spread. Use the spatial facts above for any positional statement and make no spatial claim they do not support.

Output:
- "answer": the direct conclusion, in one or two sentences.
- "reading": a coherent interpretation in plain prose.
- "patterns": combinations that add something to the reading, with canonical English card names in "cards".
- "timing": null unless the spread gives a classical timeframe.
- Respond in the language of the user's question.

Return only one JSON object with exactly these fields:
{
  "answer": string,
  "reading": string,
  "patterns": [{ "cards": string[], "meaning": string }],
  "timing": string | null
}
Do not rename, add or remove fields. Do not use Markdown fences.`;

/**
 * Question header. Identical for every spread.
 *
 * The raw current question goes to the model unparsed; it is the only user-authored
 * interpretation input.
 */
function simplePromptHeader(context: ReadingContext): string {
  return `User question:\n${sanitizeQuestion(context.question)}`;
}

/**
 * The production reading prompt: question, complete spread, no server-side cluster
 * selection. The structural facts are the authoritative map of where every card is; the
 * model is the only thing that interprets them.
 */
export function buildSimpleReadingPrompt(context: ReadingContext): string {
  return `${simplePromptHeader(context)}

Structural facts (deterministic; complete for this spread):
${buildSpreadFacts(context)}

${OUTPUT_CONTRACT}`;
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}
