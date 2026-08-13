import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type { ReadingContext, AdjacentPair, PetitTableauLayout, GrandTableauLayout } from "@/lib/reading-context";
import { getDefinition } from "@/lib/spread-definitions";
import { buildTimingEvidencePrompt } from "@/lib/timing";
import { buildPredictionContext, formatPredictionEvidenceBlock } from "@/lib/prediction-context";

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

const PERSON_CARD_PROMPT_NOTE = `- Man and Woman represent specific people/significators in the querent's life. Never infer husband, wife, boyfriend, girlfriend, father, mother, partner, or any other exact relationship unless the user's question explicitly establishes it. Refer to them as "the man / a man" or "the woman / a woman", or simply by card name.`;

function fmtPersonCard(card: { name: string; strength?: string }): string {
  const name = sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
  const strength = card.strength ? `; ${card.strength}` : "";
  return strength ? `${name} (specific person/significator${strength})` : `${name} (specific person/significator)`;
}

const BAD_COMBO_PHRASES = [
  "unique energy",
  "combined with",
  "kilimanjaro",
  "internet router",
  "positive energy",
  "positive change",
  "positive transformation",
  "positive surprise",
  "positive announcement",
  "positive recognition",
  "heated",
  "passion",
  "passionate opportunity",
  "passionate news",
  "passionate voyage",
  "passionate journey",
  "passionate conflict",
  "passionate decision",
  "passionate argument",
  "passionate advice",
  "passionate communication",
  "passionate chance",
  "lucky ",
  "fortunate ",
  "blessed ",
  "blessing",
  "lucky journey",
  "lucky health",
  "lucky conflict",
  "lucky recovery",
  "lucky commitment",
  "lucky solution",
  "lucky stability",
  "lucky love",
  "lucky authority",
  "lucky strength",
  "lucky gift",
  "lucky change",
  "lucky message",
  "lucky home",
  "lucky clarity",
  "lucky ending",
  "lucky escape",
  "lucky decision",
  "lucky friendship",
  "lucky communication",
  "lucky new beginning",
  "lucky work",
  "lucky wishes",
  "lucky social",
  "lucky overcoming",
  "lucky choice",
  "lucky knowledge",
  "lucky wisdom",
  "lucky success",
  "lucky intuition",
  "lucky abundance",
  "lucky faith",
  "fortunate journey",
  "fortunate travel",
  "fortunate home",
  "fortunate family",
  "fortunate health",
  "fortunate recovery",
  "fortunate clarity",
  "fortunate resolution",
  "fortunate escape",
  "fortunate ending",
  "fortunate closure",
  "fortunate surprise",
  "fortunate decision",
  "fortunate conflict",
  "fortunate communication",
  "fortunate gossip",
  "fortunate new beginning",
  "fortunate creativity",
  "fortunate work",
  "fortunate strategy",
  "fortunate strength",
  "fortunate protection",
  "fortunate wishes",
  "fortunate change",
  "fortunate movement",
  "fortunate friendship",
  "fortunate loyalty",
  "fortunate authority",
  "fortunate institution",
  "fortunate social",
  "fortunate community",
  "fortunate overcoming",
  "fortunate endurance",
  "fortunate choice",
  "fortunate recovery",
  "fortunate loss",
  "fortunate love",
  "fortunate relationship",
  "fortunate commitment",
  "fortunate marriage",
  "fortunate knowledge",
  "fortunate learning",
  "fortunate message",
  "fortunate wisdom",
  "fortunate maturity",
  "fortunate success",
  "fortunate happiness",
  "fortunate intuition",
  "fortunate solution",
  "fortunate opportunity",
  "fortunate abundance",
  "fortunate wealth",
  "fortunate stability",
  "fortunate security",
  "fortunate faith",
  "fortunate sacrifice",
];

function isUsableComboMeaning(meaning: string | undefined): boolean {
  if (!meaning) return false;
  const lower = meaning.toLowerCase();
  return !BAD_COMBO_PHRASES.some((pat) => lower.includes(pat));
}

export function buildSystemPrompt(cardCount?: number): string {
  const isSingleCard = cardCount === 1;

  return `You are a traditional Lenormand reader, not a Tarot reader.

Lenormand is concrete, practical, external, predictive, and combination-based. A card read in isolation means almost nothing — meaning comes from positions, combinations, lines, and houses.

Rules:
- No reversals, no Tarot/New Age language. Never use the following multi-word phrases or single tokens in their New Age sense: "archetype", "shadow work", "chakra", "soul-purpose", "the universe", "higher self", "vibration", "trust the process", "everything happens for a reason". Never use the following phrases at all: "spiritual journey", "healing journey", "soul journey", "personal transformation", "positive energy", "shadow self". Avoid the word "energy" standing alone (say "force", "weight", "influence" instead). You may still use ordinary Lenormand vocabulary such as "journey", "transformation", "intuition" when they describe a concrete, practical situation in the cards.
- Do not add cards that were not drawn.
- Use timing only when the cards clearly indicate it. The prompt below contains a "Timing evidence" section. Use only that. If it says "No timing evidence detected", write: Likely timing: Not clearly shown by these cards.
- For Man/Woman, treat as person/significator, not masculine/feminine energy.
- Write naturally. Do not use possessive phrases like "Moon's emotions" or "Bouquet's gift" — describe what happens between cards. Use "shows", "points to", "brings", "suggests", "develops as", "leads to".
- Bold only complete pair labels such as **Birds + Letter** or **Birds + Letter + Book**. Bold is not allowed inside other words (forbidden: uncove**Ring**, **Letter**s, dis**Patch**).
- Avoid fragmented prose like "Birds indicates... Letter suggests...". Synthesize combinations into a fluent interpretation of the situation.
${PERSON_CARD_PROMPT_NOTE}

${isSingleCard
  ? `Read this card alone. Do NOT pair it with any other card. Explain what it means for the querent's situation in one short paragraph.`
  : `Multi-card readings are read through combinations, lines, houses, and surrounding cards. Be concrete and specific. Name the relevant card pairs in the Key combinations section.`
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

Use exactly these four bold labels, in this order, with one or two sentences each:

**Most likely development:** one primary forecast that answers the user's question. Do not list alternatives. Do not repeat the Reading.
**Likely timing:** copy the timing from the Prediction synthesis evidence verbatim. Do not invent dates or ranges.
**Watch for:** one concrete external event or sign that would indicate the forecast is starting to unfold.
**Practical action:** one useful next step based on the reading. No generic self-help language.

Synthesize the Prediction ONLY from the Prediction synthesis evidence block. Do not introduce cards that are not in that evidence.`;

const PREDICTIVE_VOICE_LINEAR = `Answer the user's actual question directly.

## Reading
Write 3-5 natural sentences interpreting the complete line. Start with the answer. Explain the progression of the cards as one connected situation. Do not merely list card meanings.

## Key combinations
For each adjacent pair, write a bullet in this format:
- **Card A + Card B**: explain this combination specifically in relation to the user's question. Never copy the supplied reference wording verbatim — interpret it.

${PREDICTION_FIELDS_INSTRUCTION}

Voice: practical, predictive, direct. Write like a real reading, not a card-meaning explanation.`;

const PREDICTIVE_VOICE_PETIT = `Answer the user's actual question directly. The Petit Tableau is a 3x3 grid; treat the center card as the heart and the middle line as the main narrative, with rows/columns/diagonals supporting it.

## Reading
Write 3-5 natural sentences interpreting the tableau. Start with the answer. Describe how the center card and the middle line develop the question. Do not merely list card meanings.

## Key combinations
For each relevant pair the prompt lists under "Adjacent combinations", write a bullet in this format:
- **Card A + Card B**: explain this combination specifically in relation to the user's question. Never copy the supplied reference wording verbatim — interpret it.

${PREDICTION_FIELDS_INSTRUCTION}

Voice: practical, predictive, direct. Write like a real reading, not a card-meaning explanation.`;

const PREDICTIVE_VOICE_GT = `Answer the user's actual question directly. The Grand Tableau is a 4x9 grid read around the significator; treat the significator's neighbourhood as the most actionable area, the topic houses (Heart, House, Fish, Tree, Ship, Fox, Bear, Anchor) as life-theme anchors, and the Cards of Fate / corners as long-term signals.

## Grand Tableau overview
Write a paragraph that names the significator, summarises the four rows, the center four, and the Cards of Fate, and gives the first overall direction of the answer.

## Around the significator
For each card directly adjacent to the significator listed under "Adjacent combinations", write a bullet in this format:
- **Significator + Card**: explain how this combination modifies the querent's situation right now.

## Houses and mirrors
For each topic-house placement listed above, write a bullet in this format:
- **House of X**: explain what the card sitting on that house means for that life area.

${PREDICTION_FIELDS_INSTRUCTION}

Voice: practical, predictive, direct. Write like a real reading, not a card-meaning explanation.`;

const SPREAD_PROMPTS: Record<string, (question: string, cards: string) => string> = {
  "single-card": (q, c) => `${q}\nCard: ${c}\n\nRead this card alone. Explain what it means practically.`,
  "daily-card": (_, c) => `Daily card: ${c} - read this card alone. What happens today? One sentence, practical and direct.`,
  "sentence-3": (q, c) => `${q}\nCards: ${c}\n\nPairs: 1+2, 2+3. Read as one Lenormand sentence. List both adjacent pairs in the Key combinations section, explaining the meaning of each.

Output (exactly these sections):

## Reading

## Key combinations

## Prediction

${PREDICTIVE_VOICE_LINEAR}`,
  "sentence-5": (q, c) => `${q}\nCards: ${c}\n\nPairs: 1+2, 2+3, 3+4, 4+5. Read as one Lenormand line. List all four adjacent pairs in the Key combinations section, explaining the meaning of each pair.

Output (exactly these sections):

## Reading

## Key combinations

## Prediction

${PREDICTIVE_VOICE_LINEAR}`,
  "comprehensive": (q, c) => `${q}\nCards (3x3 Petit Tableau): ${c}\n\nRead as a Petit Tableau. Use center, middle line, rows, columns, diagonals, and adjacent combinations.

Output (exactly these sections):

## Reading

## Key combinations

## Prediction

${PREDICTIVE_VOICE_PETIT}`,
  "grand-tableau": (q, c) => `${q}\n36 cards (4x9 grid): ${c}\n\nRead using Grand Tableau method. Focus on significator, surrounding pairs, directional zones, mirroring, corners, houses.

Output (exactly these sections):

## Grand Tableau overview

## Around the significator

## Houses and mirrors

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

function fmtCard(card: { name: string; keywords?: string[]; strength?: string }): string {
  if (PERSON_CARD_NAMES.has(card.name)) {
    return fmtPersonCard(card);
  }
  const name = sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
  const keywords = card.keywords?.slice(0, 2).join(", ");
  const strength = card.strength ? `; ${card.strength}` : "";
  const suffix = `${keywords || ""}${strength}`;
  return suffix ? `${name} (${suffix})` : name;
}

export { fmtCard, PERSON_CARD_NAMES };

function fmtAdjacentPairs(pairs: AdjacentPair[]): string {
  if (pairs.length === 0) return "";
  return (
    "\nAdjacent combinations:\n" +
    pairs
      .filter((p) => isUsableComboMeaning(p.traditionalMeaning))
      .map((p) => {
        const left = fmtCard(p.cardA);
        const right = fmtCard(p.cardB);
        const meaning = p.traditionalMeaning ? `: ${p.traditionalMeaning}` : "";
        return `- ${left} + ${right}${meaning}`;
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
    "## Reading",
    "",
    "## Key combinations",
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

  const importantHouseIds = new Set<number>();
  const importantTopics = ["heart", "love", "money", "health", "work", "home"];
  for (const tc of layout.topicCards) {
    if (importantTopics.includes(tc.topic)) {
      importantHouseIds.add(tc.cardId);
    }
  }
  if (layout.primarySignificator) {
    importantHouseIds.add(layout.primarySignificator.card.id);
  }
  if (layout.significators.woman) importantHouseIds.add(29);
  if (layout.significators.man) importantHouseIds.add(28);

  const sigHouseIdx = layout.primarySignificator?.index ?? -1;
  if (sigHouseIdx >= 0) {
    importantHouseIds.add(sigHouseIdx + 1);
  }

  parts.push("");
  parts.push("Houses (key placements):");
  for (let i = 0; i < Math.min(layout.houses.length, 36); i++) {
    const h = layout.houses[i];
    const isImportant = importantHouseIds.has(h.houseCardId) || importantHouseIds.has(h.occupyingCard.id) || h.occupyingCard.id === h.houseCardId;
    if (!isImportant) continue;
    parts.push(`Position ${h.position} (House of ${h.houseName}) -> ${fmtCard(h.occupyingCard)}`);
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
    `Cards of Fate (bottom row): ${layout.cardsOfFate.map((c) => fmtCard(c.card)).join(", ")}`,
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
        .filter((vp) => isUsableComboMeaning(vp.traditionalMeaning))
        .map((vp) => {
          const m = vp.traditionalMeaning ? `: ${vp.traditionalMeaning}` : "";
          return `- ${fmtCard(vp.cardA)} + ${fmtCard(vp.cardB)}${m}`;
        });
      parts.push(...vpText);
    }
  }

  parts.push(
    "",
    "Output (exactly these sections):",
    "",
    "## Grand Tableau overview",
    "",
    "## Around the significator",
    "",
    "## Houses and mirrors",
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

  const weighted = [...context.adjacentPairs].sort((a, b) => b.weight - a.weight);
  const topPairs = weighted.slice(0, 10).filter((p) => p.weight >= 2);

  if (topPairs.length > 0) {
    const hints = topPairs
      .filter((p) => isUsableComboMeaning(p.traditionalMeaning))
      .map((p) => `- ${fmtCard(p.cardA)} + ${fmtCard(p.cardB)} (importance: ${p.weight}/10): ${p.traditionalMeaning}`);
    if (hints.length > 0) {
      result += `\n\nKey pair meanings (use as evidence, interpret in relation to the question — do not copy verbatim):\n${hints.join("\n")}`;
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
