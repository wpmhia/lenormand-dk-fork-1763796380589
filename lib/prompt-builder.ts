import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type { ReadingContext, AdjacentPair, PetitTableauLayout, GrandTableauLayout } from "@/lib/reading-context";
import { getDefinition } from "@/lib/spread-definitions";
import { buildTimingEvidencePrompt } from "@/lib/timing";
import { buildPredictionContext, formatPredictionEvidenceBlock } from "@/lib/prediction-context";
import { buildLenormandEvidencePack } from "@/lib/lenormand-evidence";
import { getGrandTableauPromptedHouseIds } from "@/lib/lenormand-evidence";

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

const PERSON_CARD_PROMPT_NOTE = `- Man and Woman are person-card candidates, not automatically identified people. Use a concrete identity or role only when the deterministic Person/entity bindings or the question explicitly establish it. Never infer husband, wife, boyfriend, girlfriend, father, mother, partner, or any other exact relationship from an unbound card. An unbound card must remain unbound.`;

function fmtPersonCard(card: { name: string; strength?: string }): string {
  const name = sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
  return `${name} (specific person/significator)`;
}

export function buildSystemPrompt(cardCount?: number): string {
  const isSingleCard = cardCount === 1;

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
- Evidence-envelope discipline. The deterministic evidence pack is the complete semantic envelope for this reading. Card meanings are question-scoped licensed meanings, pair meanings are the only supplied combination claims, polarity is metadata rather than an instruction for the final answer, and an observation window is not independent card timing. Synthesize fluently from this envelope; do not expand a meaning into a more specific entity, event, cause, prerequisite, duration, or outcome.
- Semantic scope rule. Modifiers belong only to the concept they modify in the supplied evidence. A temporary opportunity means the opportunity/window is temporary; it does not establish that the resulting relationship, improvement, job, move, or other outcome is temporary. Do not transfer duration, permanence, severity, certainty, or causality from one evidence concept to another unless the evidence explicitly supports it. Scythe means a sharp decision or sudden separation, not automatically a definitive ending. Cross means a heavy outcome, not automatically that a relationship ends. Child means a new beginning in the love domain, not automatically a younger person.
- Choice/outcome rule. A choice card establishes that a decision, fork, or alternative exists. It does not establish the outcome, quality, or destination of each option unless supplied evidence explicitly qualifies those options. Do not infer that neither path, both paths, or no option leads to stability, success, commitment, failure, separation, or another specific outcome merely from Paths.
- Causality and agency rule. Do not infer an unchosen action from the existence of a solution, the outcome of an unresolved choice, a causal influence between unrelated cards, or certainty/severity beyond the supplied evidence.
- Adjacency rule. Adjacent cards are co-present evidence, not automatically cause-and-effect. Use coexistence, qualification, or influence language unless the supplied pair meaning or spread structure explicitly establishes causality.
- Entity-binding rule. Man and Woman are unbound unless the question or an explicit significator selection binds one of them. An unbound person card must remain unbound; do not turn it into the querent's partner, spouse, lover, "the man/woman in your life", another person, or a gendered pronoun. Power, authority, strength, or Bear does not instantiate a boss, parent, rival, or third person without explicit entity evidence. Never replace the question's established subject with a person card.
- Hard subject invariant. Preserve every explicit question subject throughout Interpretation, Cards, Prediction, and repair. A card may add information but may not rename, gender-switch, replace, or silently substitute the person/entity being asked about. If the question asks whether Mahican stays, answer about Mahican; do not make Man or "he" the grammatical subject.
- Predicate invariant. Preserve the exact event or outcome predicate in the question. Sex is not interchangeable with intimacy, attraction, closeness, or contact; contact is not reconciliation; discussion is not a job offer; travel is not relocation. If the exact predicate is unsupported, state that it is not established rather than broadening it.
- No invented sequence rule. Do not introduce because-of, first/then, before/after, necessary-condition, duration, persistence, or severity claims unless the spread evidence explicitly encodes them. Use coexistence, influence, themes, or uncertainty when ordering or causality is not grounded.
- Specific-event rule. Do not expand Ring's agreement, commitment, or relationship-bond sense into a planned meeting, appointment, or scheduled encounter unless the evidence explicitly supplies a meeting or encounter. A temporary opportunity plus an agreement supports an opening or bond, not a calendar event by itself.
- Grand Tableau interaction rule. Do not claim that one card modifies, weakens, strengthens, blocks, clarifies, obscures, surrounds, or otherwise acts upon another card unless the supplied evidence explicitly contains a positional or combination relationship between those cards. A card appearing elsewhere in the tableau is not sufficient evidence that it modifies another card.
- Polarity rule. Do not infer a positive or negative outcome from an ambiguous or multi-valent card unless the supplied evidence resolves that polarity. A sharp decision, sudden change, cut, choice, distance, or uncertainty does not by itself establish YES or NO. If the evidence establishes a turning point but not its direction, preserve that uncertainty. Do not translate "sudden" into "unlikely to happen quickly".
- Timing-window rule. Absence of timing evidence inside the user's requested window is not negative evidence for that window. If the card evidence supports a development but timing is unclear, say that the development is supported while the cards do not establish whether it occurs within the requested window. Do not write "unlikely within 7 days", "not this week", or "only in the coming weeks" unless explicit timing evidence establishes exclusion or delay beyond that window.

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

Formatting rules:
- Use exactly the required headings. Do not rename, add, or omit headings.
- Do not write text before the first heading.
- Use one-level bullet lists only.
- Bold card pairs and labels with ** **.
- No tables, HTML, nested bullets, emojis, or raw JSON.
- If timing is not clearly supported, write: Likely timing: Not clearly shown by these cards.`;
}

const PREDICTION_FIELDS_INSTRUCTION = `## Prediction
Give one concise forward-looking synthesis answering what is most likely to happen next in the user's specific situation. Lead with the practical answer to the question, not a generic card narrative. Do not repeat the Interpretation or re-explain individual card meanings. Include timing only when supported by the Timing evidence above.
The structured prediction object must include exactly these fields: development, evidenceIds, timing, watchFor, and practicalAction. The prediction evidenceIds field must contain only IDs from the deterministic evidence pack. For sentence spreads, it must include both the closing card ID and the closing pair ID. The development must be supported by those cited IDs; do not forecast what happens after the final drawn card.
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
 * into synthesis prompts, or Mistral will fabricate prose like
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
    `Center card: ${fmtCard(layout.center.card)} - heart of the tableau`,
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
  result += `\n\n${buildLenormandEvidencePack(context)}\nSynthesis must use this evidence pack as the authoritative semantic basis. Do not add meanings that are not present in it.`;

  if (context.layout.type !== "single") {
    const predictionBlock = formatPredictionEvidenceBlock(buildPredictionContext(context));
    result += `\n\n${predictionBlock}`;
  }

  result += `\n\n${buildTimingEvidencePrompt(context.timingEvidence)}`;

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

  return appendEvidence(prompt, context);
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}
