import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type { ReadingContext, AdjacentPair, PetitTableauLayout, GrandTableauLayout } from "@/lib/reading-context";
import { getDefinition } from "@/lib/spread-definitions";
import { buildTimingEvidencePrompt } from "@/lib/timing";
import { buildPredictionContext, formatPredictionEvidenceBlock } from "@/lib/prediction-context";
import { buildLenormandEvidencePack } from "@/lib/lenormand-evidence";
import { getQuestionScopedCardMeaning, getGrandTableauPromptedHouseIds } from "@/lib/lenormand-evidence";
import { getCanonicalLenormandPairMeaning } from "@/lib/pair-meaning";

export const SIMPLE_LENORMAND_SYSTEM_PROMPT = `You are an experienced traditional Lenormand reader. Read the exact user question and the deterministic narrative plan supplied by the server. Synthesize one natural, nuanced answer from that plan.

Storytelling contract:
- The narrative is a synthesis, not a card inventory. Mention a card by name only when it materially advances the main narrative; a 9-card tableau normally needs only 3-6 card names in the prose.
- For Petit Tableau, prioritize the center card, then the middle row from left to right, then the center column, then diagonals. Do not narrate the tableau in row-major card order.
- Treat the supplied main arc as the spine and supporting axes as qualification. Do not replace the spine with an isolated card or unrelated common meaning.
- Use the supplied card senses as question-scoped guardrails, not as an exhaustive dictionary. Use established traditional Lenormand knowledge for card combinations when no reviewed override is supplied. Do not invent cards, spread positions, people, facts, or unrelated domains.
- Person cards are bound only when the supplied person bindings say so. An unbound Man or Woman must not become a husband, wife, partner, named person, or pronoun.
- Never expose numeric positions, card indices, evidence IDs, pair IDs, weights, or internal geometry labels in user-facing prose. Translate structure into natural language.
- Development lines are ordered reading structure, not causal claims. The order does not establish that one event causes, requires, or must precede another.
- Preserve the question's predicate as the subject of the answer. A qualifying card may add context, but must not replace a wellbeing, relocation, work, or other question with a different relationship or event question.
- Preserve the exact question predicate, subject, and qualifiers. Do not invent cards, people, facts, exact timing, or causal conditions.
- Answer the exact predicate first with the strongest direction supported by the complete spread. Preserve uncertainty only when the spread genuinely does not resolve the answer.
- For predictive yes/no questions, make the direction explicit when the spread supports it: begin with a clear yes, no, or unresolved answer, then qualify it. Do not replace a resolved conclusion with vague language such as "the situation develops" or "there may be potential."
- Use exactly one language throughout all user-visible string values: the language of the user's question. If ambiguous, use English.

Return only valid JSON matching the requested schema.`;

export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 1) return 400;
  if (cardCount <= 3) return 800;
  if (cardCount <= 5) return 1200;
  if (cardCount <= 9) return 2000;
  if (cardCount <= 36) return 3000;
  return 500;
}

export interface AIReadingResponse {
  reading: string;
  source?: string;
}

interface CardInput {
  id: number;
  name: string;
  keywords?: string[];
}

interface ComboHint {
  cardA: string;
  cardB: string;
  meaning: string;
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

const PERSON_CARD_PROMPT_NOTE = `- Man and Woman are person-card candidates, not automatically identified people. Person identity is determined exclusively by deterministic Person/entity bindings. The model must never infer or create a Man/Woman binding from question wording, names, gender, pronouns, or presumed identity. Never infer husband, wife, boyfriend, girlfriend, father, mother, partner, or any other exact relationship from an unbound card. An unbound card must remain unbound.`;

function fmtPersonCard(card: { name: string; strength?: string }): string {
  const name = sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
  return `${name} (specific person/significator)`;
}

export function buildSystemPrompt(cardCount?: number, outputMode: "markdown" | "structured" = "markdown"): string {
  const isSingleCard = cardCount === 1;
  const outputInstructions = outputMode === "structured"
    ? `Structured output contract:
- Return only the object requested by the schema. Do not emit Markdown headings, bullets, prose outside fields, raw JSON fences, or formatting instructions from the reading voice.
- Treat the schema and deterministic evidence pack as authoritative. The server derives evidence provenance; do not invent or manage internal evidence IDs.`
    : `Formatting rules:
- Use exactly the required headings. Do not rename, add, or omit headings.
- Do not write text before the first heading.
- Use one-level bullet lists only.
- Bold card pairs and labels with ** **.
- No tables, HTML, nested bullets, emojis, or raw JSON.
- If timing is not clearly supported, write: Likely timing: Not clearly shown by these cards.`;

  return `You are a traditional Lenormand reader, not a Tarot reader.

Lenormand is concrete, practical, external, predictive, and combination-based. A card read in isolation means almost nothing — meaning comes from positions, combinations, lines, and houses. Each spread prompt below defines the positional and directional hierarchy you must obey for that specific spread.

Synthesis disciplines (apply to all spreads):

- Method discipline. Apply the reading method defined for this spread consistently. Do not override the spread's positional or directional hierarchy because another interpretation sounds more reassuring, more interesting, or more plausible.
- Lenormand discipline. Treat cards as words in a sentence and nodes in a tableau. Lead with card combinations and positional relationships; do not turn an isolated card into a Tarot-style archetype, psychological profile, or universal outcome.
- Question discipline. The user's question establishes the semantic domain. Interpret every card and combination as an answer to that question; a card's common domain must not replace it. Heart in a relocation question can show desire, attachment, or happiness connected with the move, not automatic romance. Child can show a new beginning or an actual child depending on context. Book means what is unknown, concealed, not yet disclosed, learned, or under study; do not turn Book into Letter/document/news unless surrounding cards establish communication.
- Question-anchored synthesis. The sequence is question → cards → answer. Every sentence in Interpretation, Cards, and Prediction must explain what the cards mean for the user's actual situation. Do not narrate an abstract symbolic story and attach the question afterward. Start with the real-world implication, then name the card pair as evidence. Never introduce another life domain because a card commonly carries that association: Heart does not create romance in a relocation question, Ring does not create marriage in an employment question, and Book does not create study or education in a moving question.
- Domain concretization rule. Fish means resources, flow, or available capacity unless the question explicitly establishes money or finance; do not invent financial constraints in a relationship question. House means home, residence, family setting, or stability; do not turn it into a physical meeting, shared future, or decision without supplied evidence. Bear means power, strength, or authority; do not turn it into a third party, power struggle, or required decision.
- Direct-answer specificity. When the question asks about an explicit event or outcome, the Prediction development must name that event or outcome directly. Do not replace a sexual-intimacy question with "a successful outcome", "a clear outcome", or "the situation develops"; state whether sexual intimacy is supported, unresolved, or not established. Keep timing separate in Likely timing.
- Evidence discipline. Preserve the direction, polarity, and severity of the cards. Don't soften a difficult combination into a reassuring one, and don't magnify a mild one into a crisis. If the evidence leans adverse, say so clearly while preserving appropriate uncertainty.
- Grounding discipline. Introduce concrete specifics (people, documents, events, organizations, places, costs, outcomes) only when they are established by the question/context or supported by the drawn cards. Do not add cards that were not drawn.
 - Evidence-envelope discipline. The deterministic evidence pack is the primary provenance reference for this reading. Pair meanings marked unknown are not reviewed doctrine, but the LLM may cautiously synthesize supplied individual card meanings and positions. Do not invent a more specific entity, event, cause, prerequisite, duration, or factual certainty than the evidence supports.
- Semantic scope rule. Modifiers belong only to the concept they modify in the supplied evidence. A temporary opportunity means the opportunity/window is temporary; it does not establish that the resulting relationship, improvement, job, move, or other outcome is temporary. Do not transfer duration, permanence, severity, certainty, or causality from one evidence concept to another unless the evidence explicitly supports it. Scythe means a sharp decision or sudden separation, not automatically a definitive ending. Cross means a heavy outcome, not automatically that a relationship ends. Child means a new beginning in the love domain, not automatically a younger person.
- Choice/outcome rule. A choice card establishes that a decision, fork, or alternative exists. It does not establish the outcome, quality, or destination of each option unless supplied evidence explicitly qualifies those options. Do not infer that neither path, both paths, or no option leads to stability, success, commitment, failure, separation, or another specific outcome merely from Paths.
- Causality and agency rule. Do not infer an unchosen action from the existence of a solution, the outcome of an unresolved choice, a causal influence between unrelated cards, or certainty/severity beyond the supplied evidence.
- Adjacency rule. Adjacent cards are co-present evidence, not automatically cause-and-effect. Use coexistence, qualification, or influence language unless the supplied pair meaning or spread structure explicitly establishes causality.
 - Entity-binding rule. Man and Woman are unbound unless deterministic Person/entity bindings explicitly bind one of them. The model must never infer or create a binding from question wording, names, gender, pronouns, or presumed identity. An unbound person card must remain unbound; do not turn it into the querent's partner, spouse, lover, "the man/woman in your life", another person, or a gendered pronoun. Power, authority, strength, or Bear does not instantiate a boss, parent, rival, or third person without explicit entity evidence. Never replace the question's established subject with a person card.
- Hard subject invariant. Preserve every explicit question subject throughout Interpretation, Cards, Prediction, and repair. A card may add information but may not rename, gender-switch, replace, or silently substitute the person/entity being asked about.
- Predicate invariant. Preserve the exact event or outcome predicate in the question. Sex is not interchangeable with intimacy, attraction, closeness, or contact; contact is not reconciliation; discussion is not a job offer; travel is not relocation. If the exact predicate is unsupported, state that it is not established rather than broadening it.
- Epistemic framing rule. Card evidence supports a forecast or inference, not independent verification of an external fact, hidden state, intention, or behavior. For those questions, remain decisive about what the cards indicate or strongly suggest, but do not state the real-world fact as independently established.
- No invented sequence rule. Do not introduce because-of, first/then, before/after, necessary-condition, duration, persistence, or severity claims unless the spread evidence explicitly encodes them. Use coexistence, influence, themes, or uncertainty when ordering or causality is not grounded.
- Specific-event rule. Do not expand Ring's agreement, commitment, or relationship-bond sense into a planned meeting, appointment, or scheduled encounter unless the evidence explicitly supplies a meeting or encounter. A temporary opportunity plus an agreement supports an opening or bond, not a calendar event by itself.
- Grand Tableau interaction rule. Do not claim that one card modifies, weakens, strengthens, blocks, clarifies, obscures, surrounds, or otherwise acts upon another card unless the supplied evidence explicitly contains a positional or combination relationship between those cards. A card appearing elsewhere in the tableau is not sufficient evidence that it modifies another card.
 - Polarity rule. Do not infer a positive or negative outcome from an ambiguous or multi-valent card unless the supplied evidence resolves that polarity. A sharp decision, sudden change, cut, choice, distance, or uncertainty does not by itself establish YES or NO. If the evidence establishes a turning point but not its direction, preserve that uncertainty. Do not translate "sudden" into "unlikely to happen quickly".
 - Timing-window rule. Absence of timing evidence inside the user's requested window is not negative evidence for that window. If the card evidence supports a development but timing is unclear, say that the development is supported while the cards do not establish whether it occurs within the requested window. Do not write "unlikely within 7 days", "not this week", or "only in the coming weeks" unless explicit timing evidence establishes exclusion or delay beyond that window.
 - Synthesis strength rule. Distinguish context, warning signs, and outcome evidence. Do not turn a warning sign into the predicted outcome. Do not turn uncertainty or mixed evidence into a negative answer. State the strongest conclusion supported by the spread hierarchy as a whole. When the evidence remains mixed or unresolved, preserve that uncertainty rather than forcing a yes/no conclusion.

Grounding details:

- Use timing only when the prompt supplies a "Timing evidence" section that supports it. If it says "No timing evidence detected", write: Likely timing: Not clearly shown by these cards.
- Stay with what the cards actually say; do not invent official, legal, financial, or institutional specifics that the cards or question do not establish.

Language:

- No reversals, no Tarot/New Age language. Never use the following multi-word phrases or single tokens in their New Age sense: "archetype", "shadow work", "chakra", "soul-purpose", "the universe", "higher self", "vibration", "trust the process", "everything happens for a reason". Never use the following phrases at all: "spiritual journey", "healing journey", "soul journey", "personal transformation", "positive energy", "shadow self". Avoid the word "energy" standing alone (say "force", "weight", "influence" instead). You may still use ordinary Lenormand vocabulary such as "journey", "transformation", "intuition" when they describe a concrete, practical situation in the cards.
- For Man/Woman, treat a bound card as the specified person/significator; treat an unbound card as an unassigned person-card reference, not as a real-world identity.
- Write naturally. Do not use possessive phrases like "Moon's emotions" or "Bouquet's gift" — describe what happens between cards. Use "shows", "points to", "accompanies", "suggests", "develops alongside", or "is consistent with"; do not use causal "leads to" unless the evidence explicitly supports it.
- Bold only complete pair labels such as **Birds + Letter** or **Birds + Letter + Book**. Bold is not allowed inside other words (forbidden: uncove**Ring**, **Letter**s, dis**Patch**).
- Avoid fragmented prose like "Birds indicates... Letter suggests...". Synthesize combinations into a fluent interpretation of the situation.

${PERSON_CARD_PROMPT_NOTE}

${isSingleCard
  ? `Read this card alone. Do NOT pair it with any other card. Explain what it means for the querent's situation in one short paragraph.`
  : `Multi-card readings are read through combinations, lines, houses, and surrounding cards. Be concrete and specific. Name the relevant card pairs in the Cards section.`}
}

${outputInstructions}`;
}

const PREDICTION_FIELDS_INSTRUCTION = `## Prediction
Give one concise forward-looking synthesis answering what is most likely to happen next in the user's specific situation. Lead with the practical answer to the question, not a generic card narrative. Do not repeat the Interpretation or re-explain individual card meanings. Include timing only when supported by the Timing evidence above.
The structured prediction object must include development, timing, watchFor, and practicalAction. Evidence provenance is normalized server-side; do not invent internal evidence IDs. The development must remain grounded in the supplied evidence; do not forecast what happens after the final drawn card.
Do not include any timeframe, duration, or words such as "soon" or "within" in Interpretation or Most likely development. Put timing exclusively in Likely timing.

Required labels (always include, in this order, with one sentence each):

**Most likely development:** one primary forecast that answers the user's question. Do not list alternatives.
**Likely timing:** copy the timing from the Prediction synthesis evidence verbatim. If the Timing evidence says "Not clearly shown by these cards", write "Not clearly shown by these cards." Do not invent dates or ranges.

Optional labels — include ONLY when the cards and question actually support a concrete claim. Do not invent specifics to fill these in. If you cannot defend a claim from the drawn cards and the question, omit the label entirely:

**Watch for:** include only if the cards identify a concrete external event or sign (a specific message, contract, encounter, document, etc.) that the cards establish is part of the forecast. Skip if no card establishes a concrete external sign.
**Practical action:** include only if a specific card establishes a concrete action the querent can take (e.g. Letter = write something; Key = open a discussion; Rider = act quickly). Skip if no card establishes a specific action. Do not give generic self-help.

Synthesize the Prediction ONLY from the Prediction synthesis evidence block (which already states this spread's hierarchy). Do not introduce cards that are not in that evidence. Evidence IDs are grounding metadata, not prose; do not print them in the reading text.`;

const INTERPRETATION_INSTRUCTION = `## Interpretation
Answer the user's question through the complete spread. Explain what the sequence of cards says about the specific situation asked about, including its direction, obstacles, people, decisions, or unresolved factors. Every paragraph must stay inside that subject. Do not begin with dictionary definitions or an abstract symbolic story and translate it to the question afterward. Do not give the final predicted outcome or timing here; the forward-looking forecast belongs in ## Prediction.`;

const CARDS_INSTRUCTION = `## Cards
Show the strongest card combinations and position evidence supporting the interpretation above. This is not a card-meaning glossary. Each bullet must answer: "What does this pair say about the user's question?" Start with the real-world implication, then name the pair as evidence:
- **Card A + Card B**: describe what this combination means for the user's actual situation. Never start with isolated dictionary definitions, and never copy the supplied reference wording verbatim — interpret it.

This section is evidence, not forecast. The forward-looking conclusion belongs in ## Prediction.`;

const LINEAR_HIERARCHY_NOTE = `For an outcome question, the closing card and the closing pair dominate the forecast. Cards 1 through the second-to-last show development and context. Earlier ambiguous cards must not negate or override stronger closing evidence unless explicit blocking evidence supports that claim. Do not turn an earlier distance, movement, uncertainty, choice, tension, or delay into an obstacle, prerequisite, or "cannot happen until" condition. Positive earlier cards do not override a difficult final card, and a difficult final card does not erase earlier positives; those cards may describe events or circumstances before or alongside the closing outcome.`;

const PETIT_HIERARCHY_NOTE = `For an outcome question, the center card is the heart of the tableau. The middle line and the center column together carry the primary narrative. Diagonals are supporting axes; outer rows and outer columns are qualifier pairs. The closing card of the middle line (the rightmost middle-line card) is the directional outcome, and the strongest pair shown in the Prediction synthesis evidence is the most actionable pair.`;

const GT_HIERARCHY_NOTE = `For an outcome question, the significator's surroundings are the most actionable area. Topic houses and proximity anchor long-term themes. In this documented 9x4 method, positions 33-36 are ordinary fourth-row positions, not a separate Fate row or universal outcome.`;

const PREDICTIVE_VOICE_LINEAR = `Answer the user's actual question directly. Write the reading as a three-part arc: Interpretation → Cards → Prediction.

${INTERPRETATION_INSTRUCTION}

${CARDS_INSTRUCTION}

${LINEAR_HIERARCHY_NOTE}

${PREDICTION_FIELDS_INSTRUCTION}

Voice: practical, predictive, direct. Write like a real reading, not a card-meaning explanation.`;

const PREDICTIVE_VOICE_PETIT = `Answer the user's actual question directly. The Petit Tableau is a 3x3 grid. Write the reading as a three-part arc: Interpretation → Cards → Prediction.

${INTERPRETATION_INSTRUCTION}

${CARDS_INSTRUCTION}

${PETIT_HIERARCHY_NOTE}

${PREDICTION_FIELDS_INSTRUCTION}

Voice: practical, predictive, direct. Write like a real reading, not a card-meaning explanation.`;

const PREDICTIVE_VOICE_GT = `Answer the user's actual question directly. The Grand Tableau is a 4x9 grid read around the significator. Write the reading as a four-part arc: Interpretation → Houses and mirrors → Cards → Prediction.

${INTERPRETATION_INSTRUCTION}

## Houses and mirrors
For each topic-house placement listed above, write a bullet in this format:
- **House of X**: explain what the card sitting on that house means for that life area.

${CARDS_INSTRUCTION}

${GT_HIERARCHY_NOTE}

${PREDICTION_FIELDS_INSTRUCTION}

Voice: practical, predictive, direct. Write like a real reading, not a card-meaning explanation.`;

const SPREAD_PROMPTS: Record<string, (question: string, cards: string) => string> = {
  "single-card": (q, c) => `${q}\nCard: ${c}\n\nRead this card alone. Explain what it means practically.

Output exactly one section:

## Interpretation`,
  "daily-card": (_, c) => `Daily card: ${c} - read this card alone. What happens today? One sentence, practical and direct.

Output exactly one section:

## Interpretation`,
  "sentence-3": (q, c) => `${q}\nCards: ${c}\n\nPairs: 1+2, 2+3. Read as one Lenormand sentence. List both adjacent pairs in the Cards section, explaining the meaning of each.

Output (exactly these sections):

## Interpretation

## Cards

## Prediction

${PREDICTIVE_VOICE_LINEAR}`,
  "sentence-5": (q, c) => `${q}\nCards: ${c}\n\nPairs: 1+2, 2+3, 3+4, 4+5. Read as one Lenormand line. List all four adjacent pairs in the Cards section, explaining the meaning of each pair.

Output (exactly these sections):

## Interpretation

## Cards

## Prediction

${PREDICTIVE_VOICE_LINEAR}`,
  "comprehensive": (q, c) => `${q}\nCards (3x3 Petit Tableau): ${c}\n\nRead as a Petit Tableau. Use center, middle line, rows, columns, diagonals, and adjacent combinations.

Output (exactly these sections):

## Interpretation

## Cards

## Prediction

${PREDICTIVE_VOICE_PETIT}`,
  "grand-tableau": (q, c) => `${q}\n36 cards (4x9 grid): ${c}\n\nRead using Grand Tableau method. Focus on significator, surrounding pairs, directional zones, mirroring, corners, houses.

Output (exactly these sections):

## Interpretation

## Houses and mirrors

## Cards

## Prediction

${PREDICTIVE_VOICE_GT}`,
};

/** @deprecated Use buildPromptFromContext instead. This legacy function generates prompts from flat card lists. */
export function buildPrompt(cards: CardInput[], spreadId: string, question: string, comboHints?: ComboHint[]): string {
  const sanitizedQ = sanitizeInput(question, MAX_QUESTION_LENGTH);
  const qContext = `Question: "${sanitizedQ || "What do these cards reveal?"}"`;
  const cardList = cards.map((c) => {
    const name = sanitizeInput(c.name, MAX_CARD_NAME_LENGTH);
    if (PERSON_CARD_NAMES.has(name)) {
      return `${name} (specific person/significator)`;
    }
    const keywords = c.keywords?.slice(0, 3).join(", ");
    return keywords ? `${name} (${keywords})` : name;
  }).join(", ");

  let prompt = SPREAD_PROMPTS[spreadId] ? SPREAD_PROMPTS[spreadId](qContext, cardList) : (() => {
    const count = cards.length;
    const fallbackId = count === 1 ? "single-card" : count === 3 ? "sentence-3" : count === 5 ? "sentence-5" : count === 9 ? "comprehensive" : count === 36 ? "grand-tableau" : null;
    return fallbackId ? SPREAD_PROMPTS[fallbackId](qContext, cardList) : `${qContext}\nCards: ${cardList}`;
  })();

  if (comboHints && comboHints.length > 0) {
    prompt += `\n\nTraditional pair meanings for adjacent cards:\n${comboHints.map(h => `- ${h.cardA} + ${h.cardB}: ${h.meaning}`).join("\n")}`;
  }

  return prompt;
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
 */
function fmtCard(card: { name: string; keywords?: string[]; strength?: string }): string {
  if (PERSON_CARD_NAMES.has(card.name)) {
    return fmtPersonCard(card);
  }
  const name = sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
  return name;
}

export { fmtCard, PERSON_CARD_NAMES };

function fmtAdjacentPairs(pairs: AdjacentPair[]): string {
  if (pairs.length === 0) return "";
  return (
    "\nAdjacent combinations:\n" +
    pairs
      .map((p) => {
        const left = fmtCard(p.cardA);
        const right = fmtCard(p.cardB);
        return `- ${left} + ${right}`;
      })
      .join("\n")
  );
}

export interface NarrativePlan {
  focus: string | null;
  development: string[];
  supporting: string[];
  outcomeEvidence: string[];
}

function cardNames(cards: { card: { name: string } }[]): string[] {
  return cards.map(({ card }) => fmtCard(card));
}

export function buildSingleNarrativePlan(context: ReadingContext): NarrativePlan {
  const card = context.cards[0];
  return {
    focus: card ? fmtCard(card) : null,
    development: [],
    supporting: [],
    outcomeEvidence: card ? [fmtCard(card)] : [],
  };
}

export function buildLinearNarrativePlan(context: ReadingContext): NarrativePlan {
  const cards = context.cards.map(fmtCard);
  const closing = cards.at(-1);
  const closingPair = cards.length >= 2 ? cards.slice(-2).join(" + ") : null;
  return {
    focus: cards[Math.floor(cards.length / 2)] || cards[0] || null,
    development: cards,
    supporting: context.adjacentPairs.slice(0, 2).map((pair) => `${fmtCard(pair.cardA)} + ${fmtCard(pair.cardB)}`),
    outcomeEvidence: [closingPair, closing].filter((value): value is string => Boolean(value)),
  };
}

export function buildPetitNarrativePlan(context: ReadingContext): NarrativePlan {
  if (context.layout.type !== "petit-tableau") throw new Error("Petit narrative planner requires a Petit Tableau layout");
  const layout = context.layout;
  const line = cardNames(layout.rows.middle);
  return {
    focus: fmtCard(layout.center.card),
    development: line,
    supporting: [
      cardNames(layout.columns.center).join(" | "),
      cardNames(layout.diagonals.main).join(" | "),
      cardNames(layout.diagonals.other).join(" | "),
    ],
    outcomeEvidence: line.at(-1) ? [line.at(-1)!] : [],
  };
}

export function buildGrandTableauNarrativePlan(context: ReadingContext): NarrativePlan {
  if (context.layout.type !== "grand-tableau") throw new Error("Grand Tableau narrative planner requires a Grand Tableau layout");
  const layout = context.layout;
  const focus = layout.primarySignificator?.card
    ?? layout.topicCards[0]?.card
    ?? null;
  const localPairs = context.adjacentPairs
    .filter((pair) => focus && (pair.cardA.id === focus.id || pair.cardB.id === focus.id))
    .slice(0, 4)
    .map((pair) => `${fmtCard(pair.cardA)} + ${fmtCard(pair.cardB)}`);
  const houses = layout.houses
    .filter((house) => layout.topicCards.some((topic) => topic.cardId === house.houseCardId))
    .slice(0, 4)
    .map((house) => `${house.houseName}: ${fmtCard(house.occupyingCard)}`);
  const strongest = context.adjacentPairs
    .slice()
    .sort((a, b) => b.weight - a.weight)[0];
  return {
    focus: focus ? fmtCard(focus) : null,
    development: localPairs,
    supporting: [...houses, ...layout.mirrors.slice(0, 4).map((pair) => `${fmtCard(pair.cardA)} ↔ ${fmtCard(pair.cardB)}`)],
    outcomeEvidence: strongest ? [`${fmtCard(strongest.cardA)} + ${fmtCard(strongest.cardB)}`] : [],
  };
}

export function buildNarrativePlan(context: ReadingContext): NarrativePlan {
  switch (context.layout.type) {
    case "single":
      return buildSingleNarrativePlan(context);
    case "linear-sentence":
      return buildLinearNarrativePlan(context);
    case "petit-tableau":
      return buildPetitNarrativePlan(context);
    case "grand-tableau":
      return buildGrandTableauNarrativePlan(context);
  }
}

function formatNarrativePlan(plan: NarrativePlan, layoutType: ReadingContext["layout"]["type"]): string {
  if (layoutType === "petit-tableau") {
    return [
      "Narrative plan (authoritative; write one coherent story from this spine):",
      `- Core / heart: ${plan.focus || "not established"}`,
      `- Main line (left to right; ordered, not causal): ${plan.development.join(" | ") || "not established"}`,
      `- Secondary axis (center column; supporting, not causal): ${plan.supporting[0] || "not established"}`,
      `- Supporting evidence (diagonals): ${plan.supporting.slice(1).join("; ") || "none"}`,
      `- Outcome direction: ${plan.outcomeEvidence.join("; ") || "not established"}`,
      "- Narrative priority: focus, development, outcome evidence, then supporting evidence only when it materially qualifies the story.",
      "- Do not narrate every drawn card or use numeric positions in the answer.",
    ].join("\n");
  }
  return [
    "Narrative plan (authoritative; write one coherent story from this spine):",
    `- Focus: ${plan.focus || "not established"}`,
    `- Development line (ordered, not causal): ${plan.development.join(" | ") || "not established"}`,
    `- Supporting evidence: ${plan.supporting.join("; ") || "none"}`,
    `- ${layoutType === "linear-sentence" ? "Outcome evidence (Closing pair / card)" : "Outcome evidence"}: ${plan.outcomeEvidence.join("; ") || "not established"}`,
    "- Narrative priority: focus, development, outcome evidence, then supporting evidence only when it materially qualifies the story.",
    "- Do not narrate every drawn card or use numeric positions in the answer.",
  ].join("\n");
}

function formatPetitTableau(
  question: string,
  layout: PetitTableauLayout,
  adjacentPairs: AdjacentPair[],
): string {
  const q = sanitizeInput(question, MAX_QUESTION_LENGTH) || "What do these cards reveal?";

  const gridLines = layout.rows.top
    .map((_, c) => {
      const upper = fmtCard(layout.rows.top[c].card);
      const middle = fmtCard(layout.rows.middle[c].card);
      const lower = fmtCard(layout.rows.bottom[c].card);
      const colName = c === 0 ? "Left" : c === 1 ? "Middle" : "Right";
      return `${colName}: ${upper} + ${middle} + ${lower}`;
    })
    .join("\n");

  const parts = [
    `Question: "${q}"`,
    "",
    "Petit Tableau 3x3 grid:",
    `Row 1 / Upper Line: ${layout.rows.top.map((c) => fmtCard(c.card)).join(" + ")}`,
    `Row 2 / Middle Line: ${layout.rows.middle.map((c) => fmtCard(c.card)).join(" + ")}`,
    `Row 3 / Lower Line: ${layout.rows.bottom.map((c) => fmtCard(c.card)).join(" + ")}`,
    "",
    `Center card (exact position row 2, column 2): ${fmtCard(layout.center.card)} - heart of the tableau. Do not describe any other card as the center/pivot.`,
    "",
    "Columns:",
    gridLines,
    "",
    "Diagonals:",
    `Main: ${layout.diagonals.main.map((c) => fmtCard(c.card)).join(" + ")}`,
    `Other: ${layout.diagonals.other.map((c) => fmtCard(c.card)).join(" + ")}`,
    "",
    fmtAdjacentPairs(adjacentPairs),
    "",
    "Output (exactly these sections):",
    "",
    "## Interpretation",
    "",
    "## Cards",
    "",
    "## Prediction",
    "",
    PREDICTIVE_VOICE_PETIT,
    "",
    "Do not rename, add, or omit headings. Do not write text before the first heading. Use one-level bullets only. No tables, HTML, nested bullets, emojis, or raw JSON.",
  ];

  return parts.join("\n");
}

function formatGrandTableau(
  question: string,
  layout: GrandTableauLayout,
  adjacentPairs: AdjacentPair[],
): string {
  const q = sanitizeInput(question, MAX_QUESTION_LENGTH) || "What do these cards reveal?";
  const parts: string[] = [];

  parts.push(`Question: "${q}"`);
  parts.push("");
  parts.push("Grand Tableau 4x9 grid:");

  for (let r = 0; r < 4; r++) {
    parts.push(`Row ${r + 1}: ${layout.grid[r].map((c) => fmtCard(c.card)).join(", ")}`);
  }

  const importantHouseIds = getGrandTableauPromptedHouseIds(layout);

  parts.push("");
  parts.push("Houses (key placements):");
  for (let i = 0; i < Math.min(layout.houses.length, 36); i++) {
    const h = layout.houses[i];
    const isImportant = importantHouseIds.has(h.houseCardId) || importantHouseIds.has(h.occupyingCard.id) || h.occupyingCard.id === h.houseCardId;
    if (!isImportant) continue;
    parts.push(`House evidence ID house-${h.houseCardId}: Position ${h.position} (House of ${h.houseName}) -> ${fmtCard(h.occupyingCard)}`);
  }

  parts.push("");
  parts.push("Significators:");
  const prefLabel =
    layout.significatorPreference === "woman" ? "Woman" :
    layout.significatorPreference === "man" ? "Man" : "Both / not specified";
  parts.push(`Selected significator: ${prefLabel}`);

  if (layout.primarySignificator) {
    const p = layout.primarySignificator;
    const row = Math.floor(p.index / 9) + 1;
    const col = (p.index % 9) + 1;
    parts.push(`Primary significator: ${fmtCard(p.card)} at position ${p.index + 1}, Row ${row}, Column ${col}. Read the Tableau primarily around this card.`);
  } else if (layout.significatorPreference !== "both") {
    parts.push("Selected significator not found in this spread; use both significator cards if present.");
  }

  if (layout.significators.woman) {
    const w = layout.significators.woman;
    const row = Math.floor(w.index / 9) + 1;
    const col = (w.index % 9) + 1;
    parts.push(`Woman (Card 29): position ${w.index + 1}, Row ${row}, Column ${col} - ${fmtCard(w.card)}`);
  } else {
    parts.push("Woman (Card 29): not present in this spread");
  }
  if (layout.significators.man) {
    const m = layout.significators.man;
    const row = Math.floor(m.index / 9) + 1;
    const col = (m.index % 9) + 1;
    parts.push(`Man (Card 28): position ${m.index + 1}, Row ${row}, Column ${col} - ${fmtCard(m.card)}`);
  } else {
    parts.push("Man (Card 28): not present in this spread");
  }

  parts.push("");
  parts.push(
    `Corners: ${layout.corners.map((c) => fmtCard(c.card)).join(", ")}`,
  );
  parts.push(
    `Center four: ${layout.centerFour.map((c) => fmtCard(c.card)).join(", ")}`,
  );
  parts.push(
    `Fourth row positions 33-36 are ordinary 9x4 tableau positions; they do not act as a separate fate row or universal outcome.`,
  );

  const adj = fmtAdjacentPairs(adjacentPairs);
  if (adj) parts.push("", adj);

  if (layout.mirrors.length > 0) {
    parts.push("");
    parts.push("Mirror pairs around significator:");
    for (const m of layout.mirrors.slice(0, 8)) {
      parts.push(`- ${fmtCard(m.cardA)} mirrored with ${fmtCard(m.cardB)}`);
    }
  }

  if (layout.verticalPairs.length > 0) {
    const sigIndices = [
      layout.significators.woman?.index,
      layout.significators.man?.index,
    ].filter((s): s is number => s !== undefined);
    const verticalAroundSig = layout.verticalPairs.filter((vp) =>
      sigIndices.length === 0 || sigIndices.includes(vp.indexA) || sigIndices.includes(vp.indexB),
    );
    if (verticalAroundSig.length > 0) {
      parts.push("");
      parts.push("Vertical pairs through significator column:");
      const vpText = verticalAroundSig
        .map((vp) => `- ${fmtCard(vp.cardA)} + ${fmtCard(vp.cardB)}`);
      parts.push(...vpText);
    }
  }

  parts.push(
    "",
    "Output (exactly these sections):",
    "",
    "## Interpretation",
    "",
    "## Houses and mirrors",
    "",
    "## Cards",
    "",
    "## Prediction",
    "",
    PREDICTIVE_VOICE_GT,
    "",
    "Do not rename, add, or omit headings. Do not write text before the first heading. Use one-level bullets only. No tables, HTML, nested bullets, emojis, or raw JSON.",
  );

  return parts.join("\n");
}

function appendEvidence(prompt: string, context: ReadingContext): string {
  let result = prompt;

  result += `\n\nQuestion frame (${context.questionDomain}): ${context.questionFrame}\nInterpret all card combinations within this frame. Do not switch domains because an isolated card has a familiar association.`;
  if (context.semanticQuestion) {
    result += `\nSemantic question frame (canonical): mode=${context.semanticQuestion.mode}; domain=${context.semanticQuestion.domain}; subject=${context.semanticQuestion.subject || "not specified"}; counterparty=${context.semanticQuestion.counterparty || "not specified"}; predicate=${context.semanticQuestion.predicate}; timeframe=${context.semanticQuestion.timeframe ? `${context.semanticQuestion.timeframe.value} ${context.semanticQuestion.timeframe.unit}` : "none"}. Treat this as the interpretation target, not as evidence for the outcome.`;
    if (context.semanticQuestion.mode !== "forecast") {
      result += `\n${context.semanticQuestion.mode} mode: answer the current/past state represented by the exact predicate and preserve subject/target direction. Use the conclusion contract; do not convert this into a future forecast or claim independent factual verification.`;
    }
  }
  if (context.situationContext.trim()) {
    result += `\nKnown situation context (grounds specificity, not card evidence): ${context.situationContext}\nUse these facts only to choose the relevant facet of the cards; do not treat them as proof of the forecast.`;
  }
  result += `\nQuestion subject: ${context.questionSubjects.length > 0 ? context.questionSubjects.join(", ") : "not explicitly named"}. Questioner reference: ${context.semanticQuestion?.counterparty === "questioner" ? "first-person questioner" : "not explicitly stated"}. Do not reinterpret sentence-initial verbs as people or entities.`;
  result += `\n\n${buildLenormandEvidencePack(context)}\nSynthesis must use this evidence pack as the authoritative structural and question-scoping basis. Reviewed pair meanings are overrides; where a pair is unreviewed, use traditional Lenormand combination knowledge without inventing extra facts.`;

  if (context.layout.type !== "single") {
    const predictionBlock = formatPredictionEvidenceBlock(buildPredictionContext(context));
    result += `\n\n${predictionBlock}`;
  }

  result += `\n\n${buildTimingEvidencePrompt(context.timingEvidence, context.question, context.semanticQuestion)}`;

  if (context.topicFocus.length > 0) {
    result += "\n\nTopic focus:";
    for (const tf of context.topicFocus.slice(0, 5)) {
      result += `\n- ${tf.topic} — Card ${tf.cardName} at position ${tf.index + 1}`;
    }
  }

  return result;
}

export function buildPromptFromContext(context: ReadingContext): string {
  const { spreadId, question, adjacentPairs, layout } = context;

  if (layout.type === "petit-tableau") {
    return appendEvidence(formatPetitTableau(question, layout, adjacentPairs), context);
  }
  if (layout.type === "grand-tableau") {
    return appendEvidence(formatGrandTableau(question, layout, adjacentPairs), context);
  }

  const q = sanitizeInput(question, MAX_QUESTION_LENGTH) || "What do these cards reveal?";
  const qContext = `Question: "${q}"`;
  const cardList = context.cards.map(fmtCard).join(", ");

  let prompt = SPREAD_PROMPTS[spreadId]
    ? SPREAD_PROMPTS[spreadId](qContext, cardList)
    : `${qContext}\nCards: ${cardList}`;

  const definition = getDefinition(spreadId);
  if (definition?.positions) {
    prompt += "\n\nPosition meanings:";
    for (const pos of definition.positions) {
      const card = context.cards[pos.index];
      if (card) {
        prompt += `\n- Position ${pos.index + 1} (${pos.label}): ${pos.meaning} -> This position holds ${fmtCard(card)}`;
      }
    }
    prompt += "\n\nRead each card primarily through its position meaning before combining with adjacent cards.";
  }

  const withEvidence = appendEvidence(prompt, context);
  if (context.semanticQuestion?.mode === "advice") {
    return `${withEvidence}\n\nADVICE OUTPUT CONTRACT (authoritative): Return mode=advice with practicalGuidance and guidanceEvidenceIds. Do not return prediction or timing fields. Answer how the questioner can act; keep card evidence and advice distinct.`;
  }
  if (context.semanticQuestion?.mode !== "forecast") {
    return `${withEvidence}\n\nCONCLUSION OUTPUT CONTRACT (authoritative): Return mode=${context.semanticQuestion?.mode} with conclusion.verdict and conclusion.statement. Evidence provenance is normalized server-side. Do not return prediction, Most likely development, Likely timing, Watch for, or Practical action. Assess the requested state/event only; preserve the semantic subject and target direction, and do not state independent factual verification.`;
  }
  return withEvidence;
}

/** Compact production reader prompt: code supplies spread facts, the model synthesizes. */
export function buildSimpleReadingPrompt(context: ReadingContext): string {
  const narrativePlan = buildNarrativePlan(context);
  const planText = [
    narrativePlan.focus || "",
    ...narrativePlan.development,
    ...narrativePlan.supporting,
    ...narrativePlan.outcomeEvidence,
  ].join(" | ");
  const scopedCards = context.cards
    .filter((card) => planText.includes(fmtCard(card)))
    .map((card) => `${fmtCard(card)} — ${getQuestionScopedCardMeaning(card, context.questionDomain) || "no reviewed question-scoped meaning supplied"}`)
    .join("\n");
  const petitNarrativePairs = new Set([
    "3-4", "4-5", // middle row
    "1-4", "4-7", // center column
    "1-5", "5-9", "3-5", "5-7", // diagonals
  ]);
  const relevantPairs = context.layout.type === "petit-tableau"
    ? context.adjacentPairs.filter((pair) => {
      const key = `${Math.min(pair.indexA, pair.indexB) + 1}-${Math.max(pair.indexA, pair.indexB) + 1}`;
      if (petitNarrativePairs.has(key)) return true;
      return Boolean(getCanonicalLenormandPairMeaning(pair.cardA.id, pair.cardB.id, context.semanticQuestion));
    })
    : context.adjacentPairs.filter((pair) => {
      const forward = `${fmtCard(pair.cardA)} + ${fmtCard(pair.cardB)}`;
      const reverse = `${fmtCard(pair.cardB)} + ${fmtCard(pair.cardA)}`;
      return planText.includes(forward) || planText.includes(reverse);
    });
  const pairs = relevantPairs.map((pair) => {
    const meaning = getCanonicalLenormandPairMeaning(pair.cardA.id, pair.cardB.id, context.semanticQuestion);
    return `- ${pair.cardA.name} + ${pair.cardB.name}${meaning ? `: reviewed override — ${meaning}` : ": no reviewed override; synthesize this combination using traditional Lenormand knowledge"}`;
  }).join("\n");
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
  const predictionEvidence = context.layout.type === "single"
    ? ""
    : `\n\n${formatPredictionEvidenceBlock(buildPredictionContext(context))}`;
  return `You are an experienced traditional Lenormand reader.\n\nUser question:\n${context.question}\n\n${semantic}\n${answerFocus}${subjects}${personBindings}${situation}\n\n${formatNarrativePlan(narrativePlan, context.layout.type)}${predictionEvidence}\n\nQuestion-scoped card guardrails for cards referenced in the plan:\n${scopedCards || "No card guardrails were selected."}\n\nRelevant pair overrides (not an exhaustive database):\n${pairs || "No reviewed overrides were selected. Use traditional Lenormand combination knowledge."}\n\nSynthesis contract:\n- Read combinations in the spread structure supplied above, using traditional Lenormand knowledge for unreviewed pairs.\n- For linear readings, the closing card and closing pair are the strongest forecast evidence; earlier pairs describe development and context.\n- Answer the exact predicate directly. For a predictive yes/no question, make yes, no, or unresolved explicit when the evidence supports that direction.\n- Use one coherent synthesis, not a card inventory. The development lines are ordered reading structure, not causality or timing.\n- Do not invent cards, people, facts, exact timing, prerequisites, or implementation details.\nReturn only the structured object requested by the response schema.`;
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}
