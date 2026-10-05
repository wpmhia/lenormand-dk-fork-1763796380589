import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type {
  ReadingContext,
  GrandTableauLayout,
  LinearSentenceLayout,
  PetitTableauLayout,
} from "@/lib/reading-context";

/**
 * The server supplies the question and the drawn cards. The model is the only thing
 * that interprets them. No additional rules on rhetoric, calibration, identity, or house
 * semantics: every extra rule steers the model toward a server-chosen reading before it
 * has looked at the spread. The contract lives in the user prompt so the model sees it
 * exactly once, alongside the structural facts.
 *
 * `SIMPLE_LENORMAND_SYSTEM_PROMPT` is kept as an empty string for backward compatibility
 * with callers; new code should pass an empty system prompt.
 */
export const SIMPLE_LENORMAND_SYSTEM_PROMPT = "";

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
 * Man and Woman are written plainly. An earlier version appended
 * "(specific person/significator)" to every occurrence, which pushed the model toward
 * reading a concrete individual even when nothing bound that card. The `Person bindings`
 * block is the only thing entitled to say whether a person card is bound.
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
  facts.push(...personBindingFacts(context));
  return facts;
}

function personBindingFacts(context: ReadingContext): string[] {
  const drawn = new Set(context.cards.map((card) => card.id));
  const binding = context.personBindings.find((item) => drawn.has(item.cardId));
  if (!binding) return [];
  const cardName = binding.cardId === 28 ? "Man" : binding.cardId === 29 ? "Woman" : String(binding.cardId);
  return [`- Person binding ${cardName}: bound by ${binding.source}; ${binding.evidence}`];
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

function petitSpreadFacts(context: ReadingContext, layout: PetitTableauLayout): string[] {
  const facts = [
    `Petit Tableau, a 3x3 grid of ${context.cards.length} cards. Position 1 is row 1 column 1; numbering runs left to right, then top to bottom.`,
    ...gridRowFacts(context.cards, PETIT_GRID, PETIT_GRID),
    `Centre card: ${fmtCard(layout.center.card)}.`,
    "This grid defines no closing position and no outcome position; weigh the spread yourself.",
  ];
  facts.push(...personBindingFacts(context));
  return facts;
}

/**
 * The significator-focus statement, derived only from the cards actually present.
 *
 * `both` is not a focus, and an explicitly selected card that is not in the spread must
 * not be reported as one — the previous preference fallback turned "both with only Man
 * present" into "focus: Woman", which named a card that was not there.
 */
export function significatorFocusFacts(
  preference: "woman" | "man" | "both",
  presentLabels: string[],
): string[] {
  const selectedFocus = preference === "man" ? "Man" : preference === "woman" ? "Woman" : null;

  if (preference === "both" && presentLabels.length === 2) {
    return ["- Both significators are in this spread; read each one's own surroundings, and weigh their relation to each other from the coordinates above."];
  }

  if (selectedFocus && presentLabels.includes(selectedFocus)) {
    const others = presentLabels.filter((label) => label !== selectedFocus);
    const otherClause = others.length > 0
      ? ` The other person card (${others.join(", ")}) is still present as an ordinary card.`
      : "";
    return [`- Significator focus: ${selectedFocus}.${otherClause}`];
  }

  return [`- Person card(s) present: ${presentLabels.join(", ")}. No other person card is in this spread.`];
}

function grandTableauSpreadFacts(context: ReadingContext, layout: GrandTableauLayout): string[] {
  const facts = [
    `Grand Tableau, a 4x9 grid of ${context.cards.length} cards. Position 1 is row 1 column 1; numbering runs left to right, then top to bottom.`,
    "Position map (every position with its drawn card and the house that card occupies):",
    ...layout.houses.map((house, index) => {
      const card = house.occupyingCard;
      const row = Math.floor(index / GT_GRID_COLUMNS) + 1;
      const column = (index % GT_GRID_COLUMNS) + 1;
      return `- position ${index + 1} (row ${row}, col ${column}): ${fmtCard(card)} — ${house.houseName} house`;
    }),
  ];

  // Explicit person-card binding. Only present when the request actually selected a
  // significator and that card was drawn.
  facts.push(...personBindingFacts(context));

  facts.push("");
  facts.push("House rule: every position has exactly one card. A card at position N occupies the house of the card with deck number N, not its own card's house. Adjacent cards do not change each other's house. To answer a house question, check the occupant at that position.");
  facts.push("");
  facts.push("Synthesis: weigh any drawn person cards and their neighbours, the centre of the 9x4 grid, and the corners. Read supporting and conflicting indications together. Do not pull in cards that do not materially address the question, and do not turn a single negative card into a final verdict without counter-evidence. The grid has no fate row, no closing position and no single outcome position; your synthesis is yours to make.");
  return facts;
}

/**
 * Deterministic structural facts for the spread, for every spread type.
 *
 * The layer supplies the complete spread and a small set of deterministic spatial
 * clusters. The model interprets them but is not asked to recompute geometry.
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
  return hasDisplacedCards(context) ? `${DISPLACED_CARD_LEGEND}\n${body}` : body;
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
const OUTPUT_CONTRACT = `Answer the exact question asked.
For yes/no questions, answer yes/no first.
Use only meanings and combinations supported by the drawn cards.
Do not infer from cards that were not drawn.
Do not complete a story beyond what the cards support.
Keep the explanation as short as the question allows.
Answer in the language of the user's question, using exactly one language.
If a person card is unbound, treat it explicitly as unidentified: it is not a spouse, partner, named person or pronoun.

Return only one JSON object with exactly these fields:
{
  "answer": string,
  "reading": string,
  "patterns": [{ "cards": string[], "meaning": string }],
  "timing": string | null
}
- answer answers the question directly in one or two sentences.
- reading is the explanation as prose. Interpret only what the drawn cards support; do not complete a story beyond the cards and do not use absent cards as evidence.
- patterns lists the card groups you actually interpreted. "cards" is an array of canonical English card names, one name per element. Never put a combined string in one element, and never translate these names into the user's language inside "cards".
- "meaning" states the interpretation of that group; it may be written in the user's language.
- timing is null when the spread does not ground a timing.
- Internal references: every name inside "patterns[].cards" is the canonical English card name. "answer" and "reading" are written in the language of the user's question, using exactly one language throughout, and never contain English card names where the user's language has its own word for the same card.
- Do not rename, add, or remove fields. Do not use Markdown fences.`;

/**
 * Question header. Identical for every spread.
 *
 * The raw question goes to the model unparsed. Any voluntary situation context follows the
 * same rule: it is supplied verbatim and is not evidence.
 */
function simplePromptHeader(context: ReadingContext): string {
  const situation = context.situationContext.trim()
    ? `\n\nKnown situation context (specificity guidance, not card evidence): ${context.situationContext}`
    : "";
  return `User question:\n${context.question}${situation}`;
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
