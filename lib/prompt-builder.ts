import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import { outputTierFor } from "@/lib/simple-answer";
import { adjacentPairs, diagonalLines, gridRelation, knightPairs } from "@/lib/spread-geometry";
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

The structural data supplied by the server is authoritative. Do not invent cards, positions, spatial relationships, people, events, or facts. Two cards that merely both appear somewhere in the spread are not a combination: assert adjacency, mirroring, a row, a column, a diagonal, house occupancy or a position only where the structural facts list it.

Position roles that the spread itself defines are facts and may be used. Interpretive hierarchy that the spread does not define may not be invented.

Person cards represent a specific person only when the supplied bindings establish this. An unbound Man or Woman is an unassigned person-card reference and never becomes a spouse, partner, named person or pronoun.

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

const PERSON_CARD_NAMES = new Set(["Man", "Woman"]);

/**
 * Formats a card for the AI prompt.
 *
 * NOTE: `strength` is intentionally NOT included. It is an internal classification
 * metadata field, not a metaphysical intensity. A Coffin does not become "neutral"
 * and a Cross does not become "weak" because of a database field. Strength metadata
 * is still kept on the Card type for UI / learning purposes, but it must not leak
 * into synthesis prompts, or the model will fabricate prose like
 * "the weak energy of the opening cards" out of nothing.
 */
function fmtCard(card: { name: string; keywords?: string[]; strength?: string }): string {
  if (PERSON_CARD_NAMES.has(card.name)) return `${sanitizeInput(card.name, MAX_CARD_NAME_LENGTH)} (specific person/significator)`;
  return sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
}

export { fmtCard, PERSON_CARD_NAMES };

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

/**
 * Every geometrically adjacent position pair in the spread: horizontal and
 * vertical neighbours only, straight from the grid or line geometry.
 *
 * This deliberately does not use `context.adjacentPairs`, which is a weighted
 * top-20 shortlist. Selecting pairs by weight before the model reads the spread is
 * exactly the evidence selection this layer must not do.
 */
function geometricPairs(context: ReadingContext): { indexA: number; indexB: number }[] {
  const layout = context.layout;
  if (layout.type === "single") return [];

  if (layout.type === "linear-sentence") {
    return context.cards
      .map((_, index) => ({ indexA: index, indexB: index + 1 }))
      .filter((pair) => pair.indexB < context.cards.length);
  }

  const columns = layout.type === "petit-tableau" ? PETIT_GRID : GT_GRID_COLUMNS;
  const rows = layout.type === "petit-tableau" ? PETIT_GRID : GT_GRID_ROWS;
  const pairs: { indexA: number; indexB: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns - 1; col++) {
      pairs.push({ indexA: row * columns + col, indexB: row * columns + col + 1 });
    }
  }
  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows - 1; row++) {
      pairs.push({ indexA: row * columns + col, indexB: (row + 1) * columns + col });
    }
  }
  return pairs.filter((pair) => pair.indexB < context.cards.length);
}

function pairLine(context: ReadingContext, indexA: number, indexB: number): string {
  const cardA = context.cards[indexA];
  const cardB = context.cards[indexB];
  return `${indexA + 1}+${indexB + 1}: ${cardA ? fmtCell(cardA, indexA + 1) : "empty"} + ${cardB ? fmtCell(cardB, indexB + 1) : "empty"}`;
}

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
  const facts = [
    `Linear sentence spread (${context.cards.length} cards, left to right): ${cardsByPosition(context)}`,
  ];
  for (const position of layout.positions) {
    const card = context.cards[position.index];
    if (!card) continue;
    facts.push(`- position ${position.index + 1}: ${fmtCell(card, position.index + 1)} (role defined by this spread: ${position.role})`);
  }
  facts.push("Adjacent pairs in this spread (consecutive positions only):");
  for (const pair of geometricPairs(context)) facts.push(`- ${pairLine(context, pair.indexA, pair.indexB)}`);
  facts.push("There is no other geometry in this spread: adjacency means consecutive positions.");
  return facts;
}

function petitSpreadFacts(context: ReadingContext, layout: PetitTableauLayout): string[] {
  const cell = (row: number, col: number): string => {
    const found = layout.grid[row]?.[col];
    return found ? `${found.index + 1} ${fmtCell(found.card, found.index + 1)}` : "empty";
  };
  const facts = [`Petit Tableau 3x3 grid (positions 1-9, row-major):`];
  facts.push(`Row 1: ${cell(0, 0)} | ${cell(0, 1)} | ${cell(0, 2)}`);
  facts.push(`Row 2: ${cell(1, 0)} | ${cell(1, 1)} | ${cell(1, 2)}`);
  facts.push(`Row 3: ${cell(2, 0)} | ${cell(2, 1)} | ${cell(2, 2)}`);
  facts.push(`Geometric centre: position ${layout.center.index + 1} (Row 2, Column 2) = ${fmtCell(layout.center.card, layout.center.index + 1)}`);
  facts.push(...columnFacts(context, PETIT_GRID, PETIT_GRID));
  facts.push(...geometryFacts(context, PETIT_GRID, PETIT_GRID));
  facts.push("This grid defines no closing position and no outcome position; weigh the spread yourself.");
  return facts;
}

function grandTableauSpreadFacts(context: ReadingContext, layout: GrandTableauLayout): string[] {
  const facts = [`Grand Tableau 4x9 grid (positions 1-36, left to right, top to bottom):`];
  for (let row = 0; row < GT_GRID_ROWS; row++) {
    facts.push(`Row ${row + 1}: ${layout.grid[row].map((entry) => `${entry.index + 1} ${fmtCell(entry.card, entry.index + 1)}`).join(" | ")}`);
  }

  facts.push("");
  facts.push("Significators:");
  const significatorRows: { label: string; cardId: 28 | 29; info: SignificatorInfo | undefined }[] = [
    { label: "Man", cardId: 28, info: layout.significators.man },
    { label: "Woman", cardId: 29, info: layout.significators.woman },
  ];
  for (const { label, cardId, info } of significatorRows) {
    if (!info) {
      facts.push(`- ${label}: not in this spread`);
      continue;
    }
    const row = Math.floor(info.index / GT_GRID_COLUMNS) + 1;
    const column = (info.index % GT_GRID_COLUMNS) + 1;
    const houseName = layout.houses[info.index]?.houseName ?? "unknown";
    const binding = context.personBindings.find((item) => item.cardId === cardId);
    facts.push(`- ${label}: position ${info.index + 1}, Row ${row}, Column ${column}, sitting on the ${houseName} house; ${binding ? `bound by ${binding.source}` : "unbound"}`);
  }
  const man = layout.significators.man;
  const woman = layout.significators.woman;
  if (man && woman) {
    const relation = gridRelation(man.index, woman.index, GT_GRID_COLUMNS);
    facts.push(`- Man to Woman: ${relation.label} (Man Row ${Math.floor(man.index / GT_GRID_COLUMNS) + 1} Column ${(man.index % GT_GRID_COLUMNS) + 1}, Woman Row ${Math.floor(woman.index / GT_GRID_COLUMNS) + 1} Column ${(woman.index % GT_GRID_COLUMNS) + 1}; ${Math.abs(relation.rowDelta)} row(s) and ${Math.abs(relation.columnDelta)} column(s) apart)`);
  }
  if (layout.significatorPreference === "both") {
    facts.push("- Both significators are in this spread. Read each one's own surroundings, and weigh any spatial relation between them that is listed above.");
  } else {
    facts.push(`- Significator focus: ${layout.significatorPreference === "man" ? "Man" : "Woman"}. The other person card is still present in the grid above as an ordinary card.`);
  }

  facts.push("");
  facts.push("Houses (position N belongs to the card in house order; the occupying card is what was drawn on it):");
  for (const house of layout.houses) {
    facts.push(`- position ${house.position}: ${house.houseName} house, occupied by ${fmtCell(house.occupyingCard, house.position)}`);
  }

  facts.push("");
  facts.push(`Verified spatial relations (complete for this ${GT_GRID_ROWS}x${GT_GRID_COLUMNS} grid):`);
  facts.push(...columnFacts(context, GT_GRID_ROWS, GT_GRID_COLUMNS));
  facts.push(...geometryFacts(context, GT_GRID_ROWS, GT_GRID_COLUMNS));

  if (layout.mirrors.length > 0) {
    facts.push(`Mirrored across a significator, ${layout.mirrors.length} in total:`);
    for (const mirror of layout.mirrors) {
      facts.push(`- ${mirror.indexA + 1}<->${mirror.indexB + 1}: ${fmtCell(mirror.cardA, mirror.indexA + 1)} <-> ${fmtCell(mirror.cardB, mirror.indexB + 1)}`);
    }
  }
  facts.push("This grid is 4 rows of 9. It defines no fate row, no closing position and no single outcome position; weigh the spread yourself.");
  return facts;
}

/** Column-major view of a grid, so a reader can traverse a column without reassembling pairs. */
function columnFacts(context: ReadingContext, rowCount: number, columnCount: number): string[] {
  const facts: string[] = [`Columns (top to bottom), ${columnCount} in total:`];
  for (let column = 0; column < columnCount; column++) {
    const cells = Array.from({ length: rowCount }, (_, row) => row * columnCount + column);
    facts.push(`- column ${column + 1}: ${cells.map((cell) => fmtCell(context.cards[cell], cell + 1)).join(" + ")}`);
  }
  return facts;
}

/**
 * Every positional relation the grid defines, with nothing added and nothing left out.
 *
 * Reporting only orthogonal neighbours used to hide diagonals, knight's moves and the
 * distance between two significators from the model, which are all facts a reader checks
 * and none of which the server is entitled to interpret.
 */
function geometryFacts(context: ReadingContext, rowCount: number, columnCount: number): string[] {
  const neighbours = adjacentPairs(rowCount, columnCount);
  const diagonals = diagonalLines(rowCount, columnCount);
  const knights = knightPairs(rowCount, columnCount);
  const facts: string[] = [];

  facts.push(`Adjacent pairs, ${neighbours.length} in total (every horizontal and vertical neighbour):`);
  for (const { a, b } of neighbours) {
    if (b < context.cards.length) facts.push(`- ${a + 1}+${b + 1}: ${fmtCell(context.cards[a], a + 1)} + ${fmtCell(context.cards[b], b + 1)}`);
  }

  facts.push(`Diagonal lines, ${diagonals.length} in total (each line read left to right):`);
  for (const line of diagonals) {
    const slope = line.slope === 1 ? "down-right" : "down-left";
    facts.push(`- diagonal ${slope}: ${line.cells.map((cell) => fmtCell(context.cards[cell], cell + 1)).join(" + ")}`);
  }

  facts.push(`Knight's moves, ${knights.length} in total:`);
  for (const { a, b } of knights) {
    facts.push(`- knight: ${a + 1}<->${b + 1}: ${fmtCell(context.cards[a], a + 1)} <-> ${fmtCell(context.cards[b], b + 1)}`);
  }

  return facts;
}

/**
 * Deterministic structural facts for the spread, for every spread type.
 *
 * This layer supplies only what a model cannot compute reliably: card order,
 * position roles the spread itself defines, grid coordinates, house occupancy and
 * mathematically verified spatial relationships. It deliberately supplies no
 * focus, no ranked pairs, no development line and no outcome evidence — choosing
 * what matters is the model's job, not the server's.
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
 * Output contract. Capacity scales with the spread.
 *
 * A five-card line is asked for a direct answer, a reading, its patterns and a timing,
 * and nothing else. A five-card line has one story; asking the model to also fill
 * positiveFactors, challenges, development and houses makes it restate that story four
 * more times and average itself into something blander. Larger spreads are offered the
 * extra fields they can actually fill.
 */
function outputContractFor(cardCount: number): string {
  const tier = outputTierFor(cardCount);

  const lines = [
    "Return only one JSON object with exactly these fields:",
    "{",
    '  "directAnswer": string,',
    '  "interpretation": string,',
    '  "keyPatterns": [{ "cards": string, "meaning": string }],',
  ];

  if (tier === "compact") {
    lines.push('  "timing": string | null');
  } else {
    lines.push('  "positiveFactors": string[],');
    lines.push('  "challenges": string[],');
    if (tier === "full") {
      lines.push('  "development": string | null,');
      lines.push('  "housesAndMirrors": [{ "house": string, "meaning": string }]');
    } else {
      lines.push('  "timing": string | null');
    }
  }
  lines.push("}");

  lines.push("- directAnswer answers the question directly in one or two sentences.");
  lines.push("- interpretation is the reading itself as flowing prose. Give the spread the room it needs.");
  lines.push('- keyPatterns lists only the structural patterns you actually used, naming the cards involved, for example "Clouds + Coffin: uncertainty sits next to closure".');
  lines.push("- timing is null when the spread does not ground a timing.");

  if (tier === "compact") {
    lines.push("- This is a short spread. Say the one thing it says well. Do not manufacture balance, and do not repeat the interpretation as a list.");
  } else {
    lines.push("- positiveFactors lists what in the spread supports the outcome; challenges lists what works against it. Weigh both; do not report one side only.");
    lines.push(tier === "full"
      ? "- development is the overall direction of travel of this spread, or null when the spread grounds none."
      : "- This is a 9-card grid. Weigh the rows, columns, diagonals and centre before concluding.");
  }

  lines.push("- Do not rename, add, or remove fields. Do not use Markdown fences.");
  return lines.join("\n");
}

/** Question frame, predicate, subjects and person bindings. Identical for every spread. */
function simplePromptHeader(context: ReadingContext): string {
  const semantic = context.semanticQuestion
    ? `Semantic question frame: mode=${context.semanticQuestion.mode}; domain=${context.semanticQuestion.domain}; subject=${context.semanticQuestion.subject || "not specified"}; counterparty=${context.semanticQuestion.counterparty || "not specified"}; predicate=${context.semanticQuestion.predicate}; timeframe=${context.semanticQuestion.timeframe ? `${context.semanticQuestion.timeframe.value} ${context.semanticQuestion.timeframe.unit}` : "none"}.`
    : `Question frame (${context.questionDomain}): ${context.questionFrame}`;
  const answerFocus = `Required answer focus: preserve the exact outcome or state requested by this question; do not replace it with a related question.\nQuestion predicate: ${context.semanticQuestion?.predicate || context.question}`;
  const situation = context.situationContext.trim()
    ? `\nKnown situation context (specificity guidance, not card evidence): ${context.situationContext}`
    : "";
  const subjects = `\nQuestion subjects: ${context.questionSubjects.length > 0 ? context.questionSubjects.join(", ") : "not explicitly named"}.`;
  const personBindings = `\nPerson bindings:\n${([28, 29] as const).map((cardId) => {
    const binding = context.personBindings.find((item) => item.cardId === cardId);
    const label = cardId === 28 ? "Man" : "Woman";
    return binding
      ? `- ${label}: bound by ${binding.source}; ${binding.evidence}`
      : `- ${label}: unbound`;
  }).join("\n")}`;
  return `You are an experienced traditional Lenormand reader.\n\nUser question:\n${context.question}\n\n${semantic}\n${answerFocus}${subjects}${personBindings}${situation}`;
}

const SYNTHESIS_CONTRACT = `Synthesis contract:
- Read the complete spread yourself. The server has deliberately not chosen a focus, a main line, supporting evidence or an outcome pair for you, and has not ranked the cards. Weigh the spread with traditional Lenormand technique and decide which cards, combinations and spatial relationships answer this question.
- Geometry fidelity. You may only assert a spatial relationship that appears in the structural facts above. Two cards that merely both appear somewhere in the spread are not a combination. Never invent adjacency, mirroring, a row, a column, a diagonal, house occupancy or a position.
- Adjacency is not a causal chain. Adjacent cards qualify and combine with each other; that A sits next to B does not establish that A causes B, nor that B causes whatever follows it. Do not infer the absence of recovery, reconciliation, return or any other outcome merely because a particular positive card was not drawn.
- Calibrate certainty to the spread. Avoid absolute wording such as "final", "fated", "certain", "irreversible" or "no possibility of repair" unless the spread structure itself clearly supports that level of certainty.
- Position roles that the spread itself defines may be used; interpretive hierarchy the spread does not define may not be invented.
- Read Man and Woman as person cards only where the person bindings above bind them. An unbound card stays an unassigned person-card reference, never a partner, spouse or pronoun.
- Preserve the exact question subject and predicate. Do not replace a wellbeing, relocation, work or relationship question with another kind of question.
- Do not invent cards, people, facts, exact timing, dates, prerequisites or implementation details. Leave timing null when the spread does not ground it.
- Answer the user's exact question directly in the first sentence of directAnswer.
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
${outputContractFor(context.cards.length)}`;
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}