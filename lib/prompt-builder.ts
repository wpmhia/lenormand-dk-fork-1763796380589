import { MAX_QUESTION_LENGTH, MAX_CARD_NAME_LENGTH } from "./constants";
import type { ReadingContext, AdjacentPair, PetitTableauLayout, GrandTableauLayout } from "@/lib/reading-context";

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

  return `You are a traditional Lenormand reader, not a Tarot reader.

Lenormand is concrete, practical, external, predictive, and combination-based.
Do not use Tarot-style archetypes, spiritual lessons, shadow work, chakra language, soul-purpose language, "the universe", "higher self", or vague mystical symbolism.

${isSingleCard
  ? `Read this card alone. Do NOT pair it with any other card - this is a single-card reading.
The card has its own meaning; do not invent a second card to pair with it.`
  : `The core technique is COMBINATION READING: every card is read in combination with the card that follows it. Each card has a base meaning, but in multi-card readings the final meaning comes from combinations, lines, houses, and surrounding cards. Do not interpret cards as isolated symbolic messages. For example, "Rider + Clover" means lucky news, while "Rider + Heart" means a romantic message.

Read in pairs: Card 1 + Card 2, then Card 2 + Card 3, etc.`
}

CORE LENORMAND PRINCIPLES:
- Cards are always upright - there are no reversals
- STRONG cards amplify; NEUTRAL cards describe the situation factually
- Multi-card readings are read through combinations, not standalone card meanings
- In grids, read rows, columns, diagonals, and the center card
- In Grand Tableau, use houses, significator position, proximity, mirroring, corners, and topic cards
- The goal is a direct, actionable answer to the querent's question

Write clear, down-to-earth prose in paragraphs. No lists or bullet points.
${!isSingleCard ? "- Name each card pair: \"Card A + Card B\"" : "- Name the card directly"}
- Mention the traditional meaning when relevant
- If the reading involves timing, mention likely timing (days, weeks, months)
- Be concrete, specific, and practical
- End with a clear answer to the question`;
}

const SPREAD_PROMPTS: Record<string, (question: string, cards: string) => string> = {
  "single-card": (q, c) => `${q}\nCard: ${c}\n\nThis is a SINGLE card reading. Do NOT pair it with any other card - read this card alone. Explain what it means in practical, concrete terms. Be specific about what action to take.`,
  "daily-card": (_, c) => `Daily card: ${c}. This is a SINGLE card reading - do NOT pair it with any other card. Read this card alone. What happens today? One sentence, practical and direct.`,
  "sentence-3": (q, c) => `${q}\nCards: ${c}\n\nRead as one Lenormand sentence. Use PAIR READING as the primary method:
- Pair 1 (Card 1 + Card 2)
- Pair 2 (Card 2 + Card 3)
- Full line (Card 1 + Card 2 + Card 3)

The combinations carry the meaning; card positions only help the sentence flow.
Name each pair: "The Rider plus the Clover means..." Explain how adjacent cards modify each other. End with a clear answer.`,
  "sentence-5": (q, c) => `${q}\nCards: ${c}\n\nRead as a 5-card Lenormand line. Use PAIR READING as the primary method:
- Pair 1 (Card 1 + Card 2)
- Pair 2 (Card 2 + Card 3)
- Pair 3 (Card 3 + Card 4)
- Pair 4 (Card 4 + Card 5)
- Full line (Card 1 through Card 5)

Adjacent combinations carry the meaning; do not give five separate card interpretations.
Name each pair. Explain how adjacent cards modify each other's meaning. Synthesize into flowing prose. End with the answer.`,
  "comprehensive": (q, c) => `${q}\nCards (3x3 Petit Tableau): ${c}\n\nRead this as a Lenormand Petit Tableau, not a Tarot spread.

Method:
1. Start with Card 5, the center card, as the heart of the matter.
2. Read the middle row (cards 4-5-6) as the main Lenormand line.
3. Read the upper row (cards 1-2-3) as a supporting line.
4. Read the lower row (cards 7-8-9) as an underlying line.
5. Read the three columns as vertical lines.
6. Read both diagonals through the center card.
7. Prioritize adjacent combinations over standalone card meanings.

Do not assign past/present/future meanings to the rows.
Do not interpret one card at a time as isolated advice.
Name the strongest card combinations and end with a direct answer.`,
  "grand-tableau": (q, c) => `${q}\n36 cards (4x9 grid): ${c}\n\nRead using authentic Lenormand Grand Tableau method:
1. Find the MAN (29) or WOMAN (28) card - this is the Significator (the querent).
2. HOUSE SYSTEM: Each position in the 4x9 grid is a "house" named after the 36 cards in order:
   Position 0 = House of Rider, Position 1 = House of Clover, ..., Position 35 = House of Cross.
   A card in a house reads as "Card X in the House of Y" - meaning is colored by the house topic.
   e.g., Snake in the House of Rider means deception around news or messages.
3. Read in PAIRS: every card modifies the card that follows it. Focus especially on pairs surrounding the Significator.
4. DIRECTIONAL ZONES relative to the Significator:
   - Left of Significator = Past influences
   - Right of Significator = Future developments
   - Above Significator = Visible / known influences
   - Below Significator = Hidden / underlying influences
5. MIRRORING: Read cards that mirror across the Significator (same row, opposite column) as contrasting pairs.
6. The bottom row (positions 27-35) = Cards of Fate - major life themes.
7. Corner cards = the foundation or overall context. Center four cards = the heart of the matter.

Write in paragraphs. Describe the card pairs around the Significator. Name at least 4-5 specific card pairs and how they interact. Include what the house placement adds. End with the answer.`,
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

function fmtCard(card: { name: string; keywords?: string[] }): string {
  const name = sanitizeInput(card.name, MAX_CARD_NAME_LENGTH);
  const keywords = card.keywords?.slice(0, 2).join(", ");
  return keywords ? `${name} (${keywords})` : name;
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
    "Read this as a Lenormand Petit Tableau, not a Tarot spread.",
    "",
    "Do not assign past/present/future meanings to the rows.",
    "",
    "Method:",
    "1. Start with the center card as the heart of the matter.",
    "2. Read the middle row as the main Lenormand line.",
    "3. Read the upper row as a supporting line.",
    "4. Read the lower row as an underlying line.",
    "5. Read the three columns as vertical lines.",
    "6. Read both diagonals through the center card.",
    "7. Prioritize adjacent combinations over standalone card meanings.",
    "8. Name the strongest card combinations and end with a direct answer.",
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

  parts.push("");
  parts.push("Houses:");
  for (let i = 0; i < Math.min(layout.houses.length, 36); i++) {
    const h = layout.houses[i];
    parts.push(`Position ${h.position} (House of ${h.houseName}) → ${fmtCard(h.occupyingCard)}`);
  }

  parts.push("");
  parts.push("Significators:");
  if (layout.significators.woman) {
    const w = layout.significators.woman;
    const row = Math.floor(w.index / 9) + 1;
    const col = (w.index % 9) + 1;
    parts.push(`Woman (Card 28): position ${w.index}, Row ${row}, Column ${col} - ${fmtCard(w.card)}`);
  } else {
    parts.push("Woman (Card 28): not present in this spread");
  }
  if (layout.significators.man) {
    const m = layout.significators.man;
    const row = Math.floor(m.index / 9) + 1;
    const col = (m.index % 9) + 1;
    parts.push(`Man (Card 29): position ${m.index}, Row ${row}, Column ${col} - ${fmtCard(m.card)}`);
  } else {
    parts.push("Man (Card 29): not present in this spread");
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

  parts.push(
    "",
    "Read using authentic Lenormand Grand Tableau method.",
    "1. Identify the significator (Woman/Man). Every card relates to the significator's position.",
    "2. HOUSE SYSTEM: A card in a house reads as \"Card X in the House of Y\" - meaning is colored by the house topic.",
    "3. Read in adjacent pairs from left to right in each row.",
    "4. DIRECTIONAL ZONES relative to the significator:",
    "   - Left of significator = Past influences",
    "   - Right of significator = Future developments",
    "   - Above significator = Visible / known influences",
    "   - Below significator = Hidden / underlying influences",
    "5. Read mirror pairs across the significator (same row, mirrored columns) as contrasting pairs.",
    "6. The bottom row = Cards of Fate - major life themes.",
    "7. Corner cards = foundation or overall context. Center four = heart of the matter.",
    "",
    "Write in paragraphs. Name specific card combinations with their house context. End with a clear answer.",
  );

  return parts.join("\n");
}

export function buildPromptFromContext(context: ReadingContext): string {
  const { spreadId, question, adjacentPairs, layout } = context;

  if (layout.type === "petit-tableau") {
    return formatPetitTableau(question, layout, adjacentPairs);
  }
  if (layout.type === "grand-tableau") {
    return formatGrandTableau(question, layout, adjacentPairs);
  }

  const q = sanitizeInput(question, MAX_QUESTION_LENGTH) || "What do these cards reveal?";
  const qContext = `Question: "${q}"`;
  const cardList = context.cards.map(fmtCard).join(", ");

  let prompt = SPREAD_PROMPTS[spreadId]
    ? SPREAD_PROMPTS[spreadId](qContext, cardList)
    : `${qContext}\nCards: ${cardList}`;

  if (adjacentPairs.length > 0) {
    const hints = adjacentPairs
      .filter((p) => p.traditionalMeaning)
      .map((p) => `- ${fmtCard(p.cardA)} + ${fmtCard(p.cardB)}: ${p.traditionalMeaning}`);
    if (hints.length > 0) {
      prompt += `\n\nTraditional pair meanings for adjacent cards:\n${hints.join("\n")}`;
    }
  }

  return prompt;
}

export function sanitizeQuestion(question: string): string {
  return sanitizeInput(question, MAX_QUESTION_LENGTH);
}

export function sanitizeCardName(name: string): string {
  return sanitizeInput(name, MAX_CARD_NAME_LENGTH);
}
