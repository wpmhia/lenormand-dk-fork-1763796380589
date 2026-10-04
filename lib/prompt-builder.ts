import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type {
  ReadingContext,
  GrandTableauLayout,
  LinearSentenceLayout,
  PetitTableauLayout,
  SignificatorInfo,
} from "@/lib/reading-context";

/**
 * Model-first reading contract.
 *
 * The LLM is the Lenormand interpreter. This layer is responsible for exactly one
 * thing: handing it the complete, deterministic truth about where the cards are.
 * It must never pre-interpret. Card dictionaries (CARD_SENSES), reviewed pair
 * meanings and weighted pair rankings are deliberately absent from the production
 * prompt: shipping them steers the model into a server-chosen reading before it has
 * looked at the spread as a whole, which is the failure mode this architecture exists
 * to remove. Those dictionaries remain in lib/ for the fallback reader and the
 * educational UI.
 */
export const SIMPLE_LENORMAND_SYSTEM_PROMPT = `You are an expert traditional Lenormand reader.

Interpret the complete supplied spread in relation to the user's exact question.

Use traditional Lenormand reading methods appropriate to the supplied spread: card combinations, defined positions, lines, surrounding cards, and where applicable houses and verified spatial relationships. You know the traditional Lenormand deck; no card dictionary is supplied to you, and none is needed.

Consider the spread as a whole before reaching a conclusion. Weigh supporting and conflicting indications rather than reducing the reading to one isolated positive or negative card. A large spread is not a licence to ignore most of it.

The structural data supplied by the server is authoritative. Do not invent cards, positions, spatial relationships, people, events, or facts. Two cards that merely both appear somewhere in the spread are not a combination: assert adjacency, mirroring, a row, a column, a diagonal, house occupancy or a position only where the supplied coordinates support it.

Position roles that the spread itself defines are facts and may be used. Interpretive hierarchy that the spread does not define may not be invented. In a 5-card line, the fifth card is not an outcome card merely because it is last.

Never infer who a person card represents. If a person card is unbound, treat it explicitly as unidentified: it is not a spouse, partner, named person or pronoun.

Be concrete, nuanced and predictive where the spread supports prediction. Do not force certainty when the spread is genuinely mixed.

Answer in the language of the user's question, using exactly one language throughout. If ambiguous, use English.

Translate structure into natural language: never expose internal position numbers, card indices, pair identifiers or geometry labels in user-facing prose.

Return only the required JSON.`;

export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 1) return 1_200;
  if (cardCount <= 3) return 1_600;
  if (cardCount <= 5) return 2_000;
  if (cardCount <= 9) return 2_800;
  return 3_600;
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
  return facts;
}

/**
 * One row per card: position, card, and its coordinates.
 *
 * Deliberately exhaustive about *where* cards are and silent about *how they relate*.
 * Every relation a reader can use — adjacency, rows, columns, diagonals, knight's moves,
 * mirrors, distances — is derivable from these coordinates, and the validator recomputes
 * them on demand to check whatever the model actually claims. Enumerating the relations
 * here instead cost thousands of characters and pre-decided which ones looked relevant.
 */
function coordinateFacts(cards: ReadingContext["cards"], rowCount: number, columnCount: number, houseNameAt?: (index: number) => string): string[] {
  return cards.map((card, index) => {
    const row = Math.floor(index / columnCount) + 1;
    const column = (index % columnCount) + 1;
    const house = houseNameAt ? `, ${houseNameAt(index)} house` : "";
    return `- ${index + 1}: ${fmtCell(card, index + 1)}, row ${row}, col ${column}${house}`;
  });
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
    ...coordinateFacts(context.cards, PETIT_GRID, PETIT_GRID),
    `Geometric centre: position ${layout.center.index + 1} (row 2, col 2).`,
    "This grid defines no closing position and no outcome position; weigh the spread yourself.",
  ];
  return facts;
}

function grandTableauSpreadFacts(context: ReadingContext, layout: GrandTableauLayout): string[] {
  const facts = [
    `Grand Tableau, a 4x9 grid of ${context.cards.length} cards. Position 1 is row 1 column 1; numbering runs left to right, then top to bottom.`,
    ...gridRowFacts(context.cards, GT_GRID_ROWS, GT_GRID_COLUMNS),
    ...coordinateFacts(context.cards, GT_GRID_ROWS, GT_GRID_COLUMNS, (index) => layout.houses[index]?.houseName ?? "unknown"),
  ];

  // Only person cards that were actually drawn are named. A significator that is not in
  // the spread is not described as "not in this spread": it is simply left out, so the
  // model is never prompted to reason about a card it cannot see.
  const significatorRows: { label: string; cardId: 28 | 29; info: SignificatorInfo }[] = [
    { label: "Man", cardId: 28, info: layout.significators.man },
    { label: "Woman", cardId: 29, info: layout.significators.woman },
  ].filter((row): row is { label: string; cardId: 28 | 29; info: SignificatorInfo } => row.info !== undefined);

  if (significatorRows.length > 0) {
    facts.push("");
    facts.push("Significators:");
    for (const { label, cardId, info } of significatorRows) {
      const row = Math.floor(info.index / GT_GRID_COLUMNS) + 1;
      const column = (info.index % GT_GRID_COLUMNS) + 1;
      const houseName = layout.houses[info.index]?.houseName ?? "unknown";
      const binding = context.personBindings.find((item) => item.cardId === cardId);
      facts.push(`- ${label}: position ${info.index + 1}, row ${row}, col ${column}, ${houseName} house; ${binding ? `bound by ${binding.source}` : "unbound"}`);
    }
    if (layout.significatorPreference === "both" && significatorRows.length === 2) {
      facts.push("- Both significators are in this spread; read each one's own surroundings, and weigh their relation to each other from the coordinates above.");
    } else {
      facts.push(`- Significator focus: ${layout.significatorPreference === "man" ? "Man" : "Woman"}. The other person card is still present as an ordinary card.`);
    }
  }

  facts.push("");
  facts.push("The grid defines no fate row, no closing position and no single outcome position; weigh the spread yourself.");
  return facts;
}

/**
 * Deterministic structural facts for the spread, for every spread type.
 *
 * This layer supplies only what a model cannot compute reliably: card order, position
 * roles the spread itself defines, grid coordinates and house occupancy. It supplies no
 * relation lists, no focus, no ranked pairs and no outcome evidence — deriving what
 * matters, and which relations hold, is the model's job and the validator's check.
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
const OUTPUT_CONTRACT = `Return only one JSON object with exactly these fields:
{
  "answer": string,
  "reading": string,
  "patterns": [{ "cards": string[], "relation": string, "meaning": string }],
  "timing": string | null
}
- answer answers the question directly in one or two sentences.
- reading is the reading itself as flowing prose. Give the spread the room it needs; a large spread may need several paragraphs.
- patterns lists the combinations and spatial patterns you actually used. "cards" is an array of canonical card names, one name per element, for example ["Clouds", "Coffin"]. Never put a combined string in one element. "relation" declares how those cards are related, and must be exactly one of:
    "combination" (combined in meaning; makes no geometric claim)
    "sequence"    (consecutive positions in a line)
    "adjacent"    (side-by-side neighbours)
    "row", "column", "diagonal"
    "knight"      (exactly two cards a knight's move apart)
    "house"       (related through Grand Tableau houses)
    "surrounding" (the other cards sit one step from the first named card)
  Use "combination" whenever you are not asserting a spatial relation. The server checks any non-"combination" relation against the coordinates and will reject a claim the layout does not support.
- "meaning" states the reading of that pattern.
- timing is null when the spread does not ground a timing.
- Do not rename, add, or remove fields. Do not use Markdown fences.`;

/**
 * The person bindings for the cards that are actually present.
 *
 * A person card that was not drawn is not mentioned at all. Listing "Man: unbound" for a
 * spread that does not contain Man invites the model to reason about a card it cannot see,
 * which is exactly the fabrication the invented-card gate then rejects. The block is
 * omitted entirely when neither person card is in the spread.
 */
function personBindings(context: ReadingContext): string {
  const present = new Set(context.cards.map((card) => card.id));
  const rows = ([28, 29] as const)
    .filter((cardId) => present.has(cardId))
    .map((cardId) => {
      const binding = context.personBindings.find((item) => item.cardId === cardId);
      const label = cardId === 28 ? "Man" : "Woman";
      return binding
        ? `- ${label}: bound by ${binding.source}; ${binding.evidence}`
        : `- ${label}: unbound`;
    });
  return rows.length === 0 ? "" : `\n\nPerson bindings:\n${rows.join("\n")}`;
}

/**
 * Question, situation and person bindings. Identical for every spread.
 *
 * The raw question goes to the model unparsed. Supplying a server-derived domain, subject,
 * predicate or semantic frame told the model what the question was about before it had
 * read it, and the model already has the question itself.
 */
function simplePromptHeader(context: ReadingContext): string {
  const situation = context.situationContext.trim()
    ? `\n\nKnown situation context (specificity guidance, not card evidence): ${context.situationContext}`
    : "";
  return `You are an experienced traditional Lenormand reader.\n\nUser question:\n${context.question}${personBindings(context)}${situation}`;
}

const SYNTHESIS_CONTRACT = `Synthesis contract:
- Read the complete spread yourself. The server has deliberately not chosen a focus, a main line, supporting evidence or an outcome pair for you, and has not ranked the cards. Weigh the spread with traditional Lenormand technique and decide which cards, combinations and spatial relationships answer this question.
- Geometry fidelity. The coordinates above are authoritative. Derive adjacency, rows, columns, diagonals, knight's moves, mirroring and distances from them yourself; the server does not precompute these for you. Never invent a position, a house or a spatial relationship that the coordinates do not support.
- Adjacency is not a causal chain. Adjacent cards qualify and combine with each other; that A sits next to B does not establish that A causes B, nor that B causes whatever follows it. Do not infer the absence of recovery, reconciliation, return or any other outcome merely because a particular positive card was not drawn.
- Calibrate certainty to the spread. Avoid absolute wording such as "final", "fated", "certain", "irreversible" or "no possibility of repair" unless the spread structure itself clearly supports that level of certainty.
- Position roles that the spread itself defines may be used; interpretive hierarchy the spread does not define may not be invented.
- Read a person card as an individual only where the person bindings above bind it. An unbound person card stays an unassigned person-card reference, never a partner, spouse or pronoun.
- Preserve the exact question subject and predicate. Do not replace a wellbeing, relocation, work or relationship question with another kind of question.
- Do not invent cards, people, facts, exact timing, dates, prerequisites or implementation details. Leave timing null when the spread does not ground it.
- Answer the user's exact question directly in the first sentence of the answer field.
- If the question naturally calls for a yes/no answer, give the clearest yes/no conclusion supported by the spread. If it asks how, why, what, which, or requests guidance, answer that question directly instead.
- Use one coherent synthesis, not a card inventory. Mention a card by name only when it materially advances the reading.`;

/**
 * The production reading prompt, identical in shape for every spread type:
 * question + complete spread + deterministic structural facts -> model.
 *
 * Every drawn card reaches the model. Nothing is pre-selected, ranked, dropped or
 * pre-interpreted: the server contributes geometry and nothing else.
 */
export function buildSimpleReadingPrompt(context: ReadingContext): string {
  return `${simplePromptHeader(context)}

Structural facts (deterministic; complete for this spread):
${buildSpreadFacts(context)}

${SYNTHESIS_CONTRACT}
${OUTPUT_CONTRACT}`;
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}