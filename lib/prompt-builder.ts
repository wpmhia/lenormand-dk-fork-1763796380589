import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type {
  ReadingContext,
  GrandTableauLayout,
  LinearSentenceLayout,
  PetitTableauLayout,
} from "@/lib/reading-context";
import { getQuestionScopedCardMeaning } from "@/lib/lenormand-evidence";
import { getCanonicalLenormandPairMeaning, getUsableLenormandPairMeaning } from "@/lib/pair-meaning";

export const SIMPLE_LENORMAND_SYSTEM_PROMPT = `You are an experienced traditional Lenormand reader. Read the exact user question and the deterministic structural facts supplied by the server. Decide for yourself which cards, combinations and spatial relationships matter, and synthesize one natural, nuanced answer.

Storytelling contract:
- The narrative is a synthesis, not a card inventory. Mention a card by name only when it materially advances the main narrative; a 9-card tableau normally needs only 3-6 card names in the prose, and a 36-card tableau 4-8.
- Every drawn card in the spread is supplied to you. The server has deliberately not chosen a focus, a main line or an outcome pair for you, and it has not ranked the cards. Weigh the spread yourself with traditional Lenormand technique.
- Use the supplied card senses as question-scoped guardrails, not as an exhaustive dictionary. Use established traditional Lenormand knowledge for card combinations when no reviewed meaning is supplied. Do not invent cards, spread positions, people, facts, or unrelated domains.
- Never assert a spatial relationship that the structural facts do not state. Two cards that merely both appear somewhere in the spread are not a combination; adjacency, mirroring, row, column, diagonal and house occupancy may only be used where the facts list them.
- Position roles that the spread itself defines (opening/central/closing in a sentence spread, house occupancy in a Grand Tableau, grid coordinates) are facts and may be used. Interpretive hierarchy that the spread does not define may not be invented.
- Person cards are bound only when the supplied person bindings say so. An unbound Man or Woman must not become a husband, wife, partner, named person, or pronoun.
- A person card is rendered as "Man (specific person/significator)" or "Woman (specific person/significator)". That label marks an unassigned person-card reference, not an identified individual.
- Entity-binding rule. Never infer husband, wife, boyfriend, girlfriend, father, mother, partner, or any other exact relationship from an unbound card. Power, authority, strength, or Bear does not instantiate a boss, parent, rival, or third person without explicit entity evidence. Never replace the question's established subject with a person card.
- Never expose numeric positions, card indices, evidence IDs, pair IDs, weights, or internal geometry labels in user-facing prose. Translate structure into natural language.
- Preserve the question's predicate as the subject of the answer. A qualifying card may add context, but must not replace a wellbeing, relocation, work, or other question with a different relationship or event question.
- Preserve the exact question predicate, subject, and qualifiers. Do not invent cards, people, facts, exact timing, or causal conditions.
- Answer the user's exact question directly in the first sentence.
- If the question naturally calls for a yes/no answer, give the clearest yes/no conclusion supported by the spread. If the question asks how, why, what, which, or requests guidance, answer that question directly instead.
- Do not discuss question types, classifications, confidence labels, schema fields, or whether the question is binary.
- Use exactly one language throughout all user-visible string values: the language of the user's question. If ambiguous, use English.

Return only valid JSON matching the requested schema.`;

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
  return `${indexA + 1}+${indexB + 1}: ${cardA ? fmtCard(cardA) : "empty"} + ${cardB ? fmtCard(cardB) : "empty"}`;
}

function cardsByPosition(context: ReadingContext): string {
  return context.cards.map((card, index) => `${index + 1} ${fmtCard(card)}`).join(" | ");
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
    facts.push(`- position ${position.index + 1}: ${fmtCard(card)} (role defined by this spread: ${position.role})`);
  }
  facts.push("Adjacent pairs in this spread (consecutive positions only):");
  for (const pair of geometricPairs(context)) facts.push(`- ${pairLine(context, pair.indexA, pair.indexB)}`);
  facts.push("There is no other geometry in this spread: adjacency means consecutive positions.");
  return facts;
}

function petitSpreadFacts(context: ReadingContext, layout: PetitTableauLayout): string[] {
  const cell = (row: number, col: number): string => {
    const found = layout.grid[row]?.[col];
    return found ? `${found.index + 1} ${fmtCard(found.card)}` : "empty";
  };
  const facts = [`Petit Tableau 3x3 grid (positions 1-9, row-major):`];
  facts.push(`Row 1: ${cell(0, 0)} | ${cell(0, 1)} | ${cell(0, 2)}`);
  facts.push(`Row 2: ${cell(1, 0)} | ${cell(1, 1)} | ${cell(1, 2)}`);
  facts.push(`Row 3: ${cell(2, 0)} | ${cell(2, 1)} | ${cell(2, 2)}`);
  facts.push(`Geometric centre: position ${layout.center.index + 1} (Row 2, Column 2) = ${fmtCard(layout.center.card)}`);
  facts.push(`Columns: left ${cell(0, 0)} | ${cell(1, 0)} | ${cell(2, 0)}`);
  facts.push(`  middle ${cell(0, 1)} | ${cell(1, 1)} | ${cell(2, 1)}`);
  facts.push(`  right ${cell(0, 2)} | ${cell(1, 2)} | ${cell(2, 2)}`);
  facts.push(`Diagonals: main ${cell(0, 0)} | ${cell(1, 1)} | ${cell(2, 2)}`);
  facts.push(`  other ${cell(0, 2)} | ${cell(1, 1)} | ${cell(2, 0)}`);
  const pairs = geometricPairs(context);
  facts.push(`Adjacent pairs in this grid, ${pairs.length} in total (every horizontal and vertical neighbour):`);
  for (const pair of pairs) facts.push(`- ${pairLine(context, pair.indexA, pair.indexB)}`);
  facts.push("This grid defines no closing position and no outcome position; weigh the spread yourself.");
  return facts;
}

function grandTableauSpreadFacts(context: ReadingContext, layout: GrandTableauLayout): string[] {
  const facts = [`Grand Tableau 4x9 grid (positions 1-36, left to right, top to bottom):`];
  for (let row = 0; row < GT_GRID_ROWS; row++) {
    facts.push(`Row ${row + 1}: ${layout.grid[row].map((entry) => `${entry.index + 1} ${fmtCard(entry.card)}`).join(" | ")}`);
  }

  facts.push("");
  facts.push("Significators:");
  for (const [label, cardId, significator] of [
    ["Man", 28, layout.significators.man],
    ["Woman", 29, layout.significators.woman],
  ] as const) {
    if (!significator) {
      facts.push(`- ${label}: not present in this spread`);
      continue;
    }
    const row = Math.floor(significator.index / GT_GRID_COLUMNS) + 1;
    const column = (significator.index % GT_GRID_COLUMNS) + 1;
    const houseName = layout.houses[significator.index]?.houseName ?? "unknown";
    const binding = context.personBindings.find((item) => item.cardId === cardId);
    facts.push(`- ${label}: position ${significator.index + 1}, Row ${row}, Column ${column}, sitting on the ${houseName} house; ${binding ? `bound by ${binding.source}` : "unbound"}`);
  }
  facts.push(`- Significator selection: ${layout.significatorPreference === "both" ? "both Man and Woman; read each one's own neighbourhood, and do not treat them as a pair with each other" : layout.significatorPreference === "man" ? "Man" : "Woman"}`);

  facts.push("");
  facts.push("Houses (position N belongs to the card in house order; the occupying card is what was drawn on it):");
  for (const house of layout.houses) {
    facts.push(`- position ${house.position}: ${house.houseName} house, occupied by ${fmtCard(house.occupyingCard)}`);
  }

  const adjacencies = geometricPairs(context);
  facts.push("");
  facts.push(`Verified spatial relations (complete):`);
  facts.push(`Adjacent pairs, ${adjacencies.length} in total (every horizontal and vertical neighbour):`);
  for (const pair of adjacencies) facts.push(`- ${pairLine(context, pair.indexA, pair.indexB)}`);
  if (layout.mirrors.length > 0) {
    facts.push(`Mirrored across a significator, ${layout.mirrors.length} in total:`);
    for (const mirror of layout.mirrors) {
      facts.push(`- ${mirror.indexA + 1}<->${mirror.indexB + 1}: ${fmtCard(mirror.cardA)} <-> ${fmtCard(mirror.cardB)}`);
    }
  }
  facts.push("This grid is 4 rows of 9. It defines no fate row, no closing position and no single outcome position; weigh the spread yourself.");
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
}

/** Reviewed combination meanings for every geometrically adjacent pair of this spread. */
function adjacentPairsOf(context: ReadingContext): string {
  return geometricPairs(context)
    .map(({ indexA, indexB }) => {
      const cardA = context.cards[indexA];
      const cardB = context.cards[indexB];
      if (!cardA || !cardB) return null;
      const meaning = getUsableLenormandPairMeaning(getCanonicalLenormandPairMeaning(cardA.id, cardB.id, context.semanticQuestion));
      return `- ${indexA + 1}+${indexB + 1} ${cardA.name} + ${cardB.name}: ${meaning || "no reviewed meaning; synthesize this combination using traditional Lenormand knowledge"}`;
    })
    .filter((line): line is string => line !== null)
    .join("\n");
}

const SIMPLE_ANSWER_JSON_CONTRACT = `Return only one JSON object with exactly these fields:
{
  "directAnswer": string,
  "interpretation": string,
  "cards": [{ "combination": string, "meaning": string }],
  "timing": string | null,
  "housesAndMirrors": [{ "house": string, "meaning": string }]
}
- directAnswer answers the question directly in one or two sentences.
- interpretation is the reading itself as flowing prose.
- cards and housesAndMirrors may be [] when you have nothing to add.
- timing is null when you cannot ground a timing.
- Do not rename, add, or remove fields. Do not use Markdown fences.`;

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
 * Every drawn card reaches the model. Nothing is pre-selected, ranked or dropped.
 */
export function buildSimpleReadingPrompt(context: ReadingContext): string {
  const cardSenses = context.cards
    .map((card, index) => `- position ${index + 1} ${fmtCard(card)}: ${getQuestionScopedCardMeaning(card, context.questionDomain) || "no reviewed question-scoped meaning supplied"}`)
    .join("\n");

  const pairs = adjacentPairsOf(context);

  return `${simplePromptHeader(context)}

Structural facts (deterministic; complete for this spread):
${buildSpreadFacts(context)}

Question-scoped card senses (every drawn card; single-card senses, not the reading):
${cardSenses}

Reviewed combination meanings for the adjacent pairs of this spread (not an exhaustive database):
${pairs || "This spread has no adjacent pairs. Use traditional Lenormand combination knowledge."}

${SYNTHESIS_CONTRACT}
${SIMPLE_ANSWER_JSON_CONTRACT}`;
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}