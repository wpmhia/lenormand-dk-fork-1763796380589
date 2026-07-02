import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type { ReadingContext, AdjacentPair, PetitTableauLayout, GrandTableauLayout } from "@/lib/reading-context";
import { getDefinition } from "@/lib/spread-definitions";

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

export function buildSystemPrompt(cardCount?: number): string {
  const isSingleCard = cardCount === 1;

  return `You are a traditional Lenormand reader, not a Tarot reader. Lenormand is concrete, practical, and read through card combinations - never through isolated symbols or Tarot archetypes.

STRICT RULES:
- Never use words like: energy, vibration, journey, transformation, the universe, higher self, trust the process, intuition, shadow work, chakra, soul-purpose, archetype, everything happens for a reason.
- Never add cards that were not drawn.
- Never use the words: energy, intuition, journey, transformation, archetype, soul, universe, even if they appear in the card data.
- For Man/Woman, treat as person/significator, not masculine/feminine energy.
- Never make up timing. Only mention timing if the cards clearly indicate it (e.g. Birds = days, Moon = weeks, Tree = years). Otherwise write "Not clearly shown by these cards."
- Every claim in the reading must reference a specific card by name. If a sentence could apply to any spread, rewrite it.

${isSingleCard
  ? `Read this card alone. Do NOT pair it with any other card. Explain what it means for the querent's situation in one short paragraph.`
  : `Every card's meaning comes from its position and its combination with adjacent cards. A card read alone means nothing. Reference each card by name and explain the combination.`
}

Formatting:
- Use ## for headings only. Do not rename or add headings.
- Write card pairs as plain text (example: Card A + Card B).
- No text before the first heading.
- No tables, HTML, emojis, or nested bullets.`;
}

const SPREAD_PROMPTS: Record<string, (question: string, cards: string) => string> = {
  "single-card": (q, c) => `${q}\nCard: ${c}\n\nRead this card alone. Explain what it means for the querent's situation in one short paragraph.`,
  "daily-card": (_, c) => `Daily card: ${c} - read this card alone. What happens today? One sentence, practical and direct.`,
  "sentence-3": (q, c) => `${q}\nCards: ${c}\n\nPositions: 1st (Opening) + 2nd (Core) + 3rd (Outcome). Pairs: 1+2, 2+3.
Read the three cards as one Lenormand sentence: the Opening sets the scene, the Core is the action or challenge, the Outcome is where it leads.

Output exactly these sections:

## Reading

## Combinations

## Action

Write ## Reading as exactly one sentence that tells the complete story from Opening through Outcome.
In ## Combinations, list each adjacent pair (e.g., Card A + Card B) and explain what the combination means.
In ## Action, give one practical action the querent can take based on the Outcome card. One sentence.
Do not include timing or fortune-telling. Only mention timing if a card clearly indicates it.`,
  "sentence-5": (q, c) => `${q}\nCards: ${c}\n\nPositions: 1st (Subject) + 2nd (Action) + 3rd (Focus) + 4th (Development) + 5th (Outcome). Pairs: 1+2, 2+3, 3+4, 4+5.
Read the five cards as one Lenormand narrative from Subject to Outcome.

Output exactly these sections:

## Reading

## Combinations

## Action

Write ## Reading as one paragraph that traces the story from Subject through Action and Focus to Development and Outcome.
In ## Combinations, list each adjacent pair in order.
In ## Action, give one practical action based on the Outcome card. One sentence.`,
  "comprehensive": (q, c) => `${q}\nCards (3x3 Petit Tableau): ${c}\n\nRead as a Petit Tableau grid. Center card is the heart. Read rows as sentences, columns as themes, diagonals as cross-currents.

Output exactly these sections:

## Reading

## Combinations

## Action

## Likely timing

Write ## Reading as a short paragraph on the overall picture, referencing the center card and row meanings.
In ## Combinations, list the most significant adjacent pairs.
In ## Action, give one concrete action based on the grid.
For ## Likely timing: only include if a time card appears in the spread (Birds=days, Moon=weeks, Tree=years). Otherwise write "Not clearly shown by these cards."`,
  "grand-tableau": (q, c) => `${q}\n36 cards (4x9 grid): ${c}\n\nRead using Grand Tableau method around the significator.

Output exactly these sections:

## Grand Tableau overview

## Around the significator

## Houses and mirrors

## Action

## Likely timing

Write ## Grand Tableau overview as one paragraph on the overall picture of the grid.
In ## Around the significator, describe the cards surrounding the significator and their combinations.
In ## Houses and mirrors, list the most significant house placements and mirror pairs.
In ## Action, give one practical action.
For ## Likely timing: only include if a time card appears in the spread. Otherwise write "Not clearly shown by these cards."`,
};

/** @deprecated Use buildPromptFromContext instead. This legacy function generates prompts from flat card lists. */
export function buildPrompt(cards: CardInput[], spreadId: string, question: string, comboHints?: ComboHint[]): string {
  const sanitizedQ = sanitizeInput(question, MAX_QUESTION_LENGTH);
  const qContext = `Question: "${sanitizedQ || "What do these cards reveal?"}"`;
  const cardList = cards.map((c) => {
    const name = sanitizeInput(c.name, MAX_CARD_NAME_LENGTH);
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

function fmtCard(card: { name: string; keywords?: string[]; timing?: string; strength?: string }): string {
  const name = sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
  const keywords = card.keywords?.slice(0, 2).join(", ");
  const timing = card.timing ? `; timing: ${card.timing}` : "";
  const strength = card.strength ? `; ${card.strength}` : "";
  const suffix = `${keywords || ""}${timing}${strength}`;
  return suffix ? `${name} (${suffix})` : name;
}

function fmtAdjacentPairs(pairs: AdjacentPair[]): string {
  if (pairs.length === 0) return "";
  return (
    "\nAdjacent combinations:\n" +
    pairs
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
    "Output exactly these sections:",
    "",
    "## Reading",
    "",
    "## Combinations",
    "",
    "## Action",
    "",
    "## Likely timing",
    "",
    "Write ## Reading as one paragraph on the overall picture. Reference the center card and row meanings.",
    "In ## Combinations, list the most significant adjacent pairs.",
    "In ## Action, give one concrete action based on the grid. One sentence.",
    "For ## Likely timing: only include if a time card appears in the spread (Birds=days, Moon=weeks, Tree=years). Otherwise write 'Not clearly shown by these cards.'",
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
  if (layout.significators.man) importantHouseIds.add(28);
  if (layout.significators.woman) importantHouseIds.add(29);

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
    parts.push(`Primary significator: ${fmtCard(p.card)} at position ${p.index}, Row ${row}, Column ${col}. Read the Tableau primarily around this card.`);
  } else if (layout.significatorPreference !== "both") {
    parts.push("Selected significator not found in this spread; use both significator cards if present.");
  }

  if (layout.significators.woman) {
    const w = layout.significators.woman;
    const row = Math.floor(w.index / 9) + 1;
    const col = (w.index % 9) + 1;
    parts.push(`Woman (Card ${w.card.id}): position ${w.index}, Row ${row}, Column ${col} - ${fmtCard(w.card)}`);
  } else {
    parts.push("Woman (Card 29): not present in this spread");
  }
  if (layout.significators.man) {
    const m = layout.significators.man;
    const row = Math.floor(m.index / 9) + 1;
    const col = (m.index % 9) + 1;
    parts.push(`Man (Card ${m.card.id}): position ${m.index}, Row ${row}, Column ${col} - ${fmtCard(m.card)}`);
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
        .map((vp) => {
          const m = vp.traditionalMeaning ? `: ${vp.traditionalMeaning}` : "";
          return `- ${fmtCard(vp.cardA)} + ${fmtCard(vp.cardB)}${m}`;
        });
      parts.push(...vpText);
    }
  }

  parts.push(
    "",
    "Output exactly these sections:",
    "",
    "## Grand Tableau overview",
    "",
    "## Around the significator",
    "",
    "## Houses and mirrors",
    "",
    "## Action",
    "",
    "## Likely timing",
    "",
    "Write ## Grand Tableau overview as one paragraph on the overall picture of the grid.",
    "In ## Around the significator, describe the cards surrounding the significator and their combinations.",
    "In ## Houses and mirrors, list the most significant house placements and mirror pairs.",
    "In ## Action, give one practical action. One sentence.",
    "For ## Likely timing: only include if a time card appears in the spread (e.g. Birds=days, Moon=weeks, Tree=years). Otherwise write 'Not clearly shown by these cards.'",
    "",
    "Do not rename, add, or omit headings. Do not write text before the first heading. Use one-level bullets only. No tables, HTML, nested bullets, emojis, or raw JSON.",
  );

  return parts.join("\n");
}

function appendEvidence(prompt: string, context: ReadingContext): string {
  let result = prompt;

  if (context.timingEvidence.length > 0) {
    result += "\n\nTiming evidence:";
    for (const te of context.timingEvidence) {
      result += `\n- ${te.cardName}: ${te.range}`;
    }
  } else {
    result += "\n\nNo timing evidence detected.";
  }

  if (context.topicFocus.length > 0) {
    result += "\n\nTopic focus:";
    for (const tf of context.topicFocus.slice(0, 5)) {
      result += `\n- ${tf.topic} — Card ${tf.cardName} at position ${tf.index + 1}`;
    }
  }

  const weighted = [...context.adjacentPairs].sort((a, b) => b.weight - a.weight);
  const topPairs = weighted.slice(0, 10).filter((p) => p.weight >= 2);

  if (topPairs.length > 0) {
    const BAD_COMBO_PATTERNS = ["unique energy", "combined with", "Kilimanjaro", "internet router"];
    const hints = topPairs
      .filter((p) => p.traditionalMeaning)
      .filter((p) => !BAD_COMBO_PATTERNS.some((pat) => p.traditionalMeaning!.toLowerCase().includes(pat)))
      .map((p) => `- ${fmtCard(p.cardA)} + ${fmtCard(p.cardB)} (importance: ${p.weight}/10): ${p.traditionalMeaning}`);
    if (hints.length > 0) {
      result += `\n\nKey pair meanings (ordered by importance):\n${hints.join("\n")}`;
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
