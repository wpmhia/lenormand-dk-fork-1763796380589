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
export const SIMPLE_LENORMAND_SYSTEM_PROMPT = "The app is English-only: write every user-facing prose field in English, whatever language the question is in. Keep canonical English card names in patterns[].cards.";

export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 1) return 800;
  if (cardCount <= 3) return 1_100;
  if (cardCount <= 5) return 1_400;
  if (cardCount <= 9) return 2_000;
  return 2_600;
}

export interface AIReadingResponse {
  reading: string;
  source?: string;
}

function sanitizeInput(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/["]/g, '"')
    .replace(/\\/g, "\\\\")
    .replace(/\n|\r/g, " ");
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
    `Centre card: ${fmtCard(layout.center.card)}.`,
    "The centre is the focal influence. Use the rows, columns, diagonals and neighbours that bear on the question; do not impose chronology.",
  ];
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
        if (neighbour) neighbours.push(fmtCard(neighbour));
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
  facts.push(...grandTableauPersonNeighbourFacts(context.cards));
  facts.push("Immediate adjacency and occupying another card's house are separate relationships; neither implies the other.");

  facts.push("");
  facts.push("House rule: every position has exactly one card. A card at position N occupies the house of the card with deck number N, not its own card's house. Adjacent cards do not change each other's house. To answer a house question, check the occupant at that position.");
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
 * The output request. One contract for every spread: four fields, nothing conditional.
 *
 * A smaller spread is not a different shape, it is less of the same shape. Tying the
 * field set to the card count was itself a server-side judgement about how much a spread
 * had to say, which is the model's call.
 */
/**
 * The output request: a four-field contract, nothing conditional.
 */
const OUTPUT_CONTRACT = `Answer the question directly, using the strongest symbolic reading the spread supports.

Decisiveness:
- The "answer" is one or two sentences that state the conclusion. For a yes/no question, say clearly whether the tendency is positive, negative, or genuinely mixed (name the mix only when the cards really balance).
- Commit to the dominant reading. Do not list every possibility or argue with your own conclusion.
- State material uncertainty once, in a single sentence in the reading. Do not repeat hedges, and do not use uncertainty to avoid answering.

Facts and assumptions:
- Cards describe symbolic tendencies, not confirmed events, private motives or certain futures. Do not invent facts, names, places, dates or what a person did or felt.
- If the question presupposes something (for example an accusation or a claim), do not treat it as established. Lack of confirmation proves neither the opposite nor continued activity.
- Do not infer from cards that were not drawn.

Card meaning:
- Classical meanings come first. Use the core meanings as the basis of a contextual synthesis, not as definitions to concatenate.
- Use a secondary meaning only when the question and the surrounding cards support it. For example, Lily may signal sexuality in a sexual question; Fox may signal deception or indirect self-interest when the spread supports it, and never by itself. A single negative card is never proof of infidelity or any specific act.
- Do not assign Man or Woman to a named person, the querent, or a relationship role unless the user explicitly supplies that mapping. Interpret person cards as naturally as possible without inventing identities. A selected reading focus only directs attention to a card.
- For Grand Tableau adjacency claims about Man or Woman, use only cards in the supplied complete neighbour list. A same-row card two columns away is not adjacent.
- In a linear spread, keep the given left-to-right order.
- Describe a pairing as established doctrine only when a source-reviewed pair entry is supplied; otherwise call it contextual interpretation.

Output:
- "reading" is a coherent classical interpretation in plain prose, about 100 to 200 words for 3, 5 or 9 cards. Keep it concrete and concise. Do not restate the answer at length.
- "patterns" holds at most three of the most important combinations you actually used. Do not repeat the reading in them and do not generate every row, column or pair.
- "timing" is null unless the spread meaningfully grounds a timeframe.
- Card names inside "patterns[].cards" are the canonical English names, one per element.

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
  return `User question:\n${context.question}`;
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
