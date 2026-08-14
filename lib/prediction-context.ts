import type { ReadingContext, AdjacentPair, GrandTableauLayout, PetitTableauLayout, LinearSentenceLayout } from "@/lib/reading-context";
import type { NormalizedCard } from "@/lib/reading-contract";
import { buildPredictionTimingLine } from "@/lib/timing";
import { GRAND_TABLEAU_TOPIC_CARDS } from "@/lib/spreads";
import { fmtCard } from "@/lib/prompt-builder";

export interface PredictionEvidenceLine {
  label: string;
  value: string;
}

export type PredictionLayoutType = "linear-sentence" | "petit-tableau" | "grand-tableau" | "single";

export interface PredictionContext {
  layoutType: PredictionLayoutType;
  outcomeCard: NormalizedCard | null;
  developmentCard: NormalizedCard | null;
  coreDriverCard: NormalizedCard | null;
  primaryPair: { a: NormalizedCard; b: NormalizedCard; meaning?: string } | null;
  supportingPair: { a: NormalizedCard; b: NormalizedCard; meaning?: string } | null;
  /**
   * Full ordered progression of adjacent pairs for linear spreads. Each pair's
   * meaning has already been passed through `getUsablePairMeaning` so the same
   * contamination blacklist as the prompt applies. For non-linear layouts this
   * stays empty (pairs are surfaced via the per-topic evidence lines).
   */
  allPairs: { a: NormalizedCard; b: NormalizedCard; meaning?: string; weight: number }[];
  significatorEvidence: PredictionEvidenceLine[];
  houseEvidence: PredictionEvidenceLine[];
  topicEvidence: PredictionEvidenceLine[];
  timingEvidence: PredictionEvidenceLine[];
  notes: string[];
}

const LAYOUT_HIERARCHY: Record<PredictionLayoutType, string> = {
  "linear-sentence":
    "Linear spread hierarchy: the closing card and the closing pair dominate the final forecast. Earlier cards show how the situation develops toward that outcome; they do not override a difficult final card, and a difficult final card does not erase earlier positives.",
  "petit-tableau":
    "Petit Tableau hierarchy: the center card is the heart; the middle line carries the main narrative. Rows, columns, and diagonals qualify the read but do not override center + middle line.",
  "grand-tableau":
    "Grand Tableau hierarchy: the significator and its surrounding pairs are the most actionable area. Topic houses (Heart, House, Fish, Tree, Ship, Fox, Bear, Anchor) anchor the long-term life themes. The Cards of Fate and corners carry long-term signals but do not override significator + house evidence.",
  "single":
    "Single-card hierarchy: the drawn card alone is the full reading.",
};

function fmt(n: NormalizedCard | null | undefined): string {
  if (!n) return "(none)";
  return fmtCard(n);
}

function pairMeaning(a: NormalizedCard, b: NormalizedCard, pairs: AdjacentPair[]): string | undefined {
  for (const p of pairs) {
    if ((p.cardA.id === a.id && p.cardB.id === b.id) ||
        (p.cardA.id === b.id && p.cardB.id === a.id)) {
      if (p.traditionalMeaning && !/blessed|fortunate|lucky|positive energy|passionate/i.test(p.traditionalMeaning)) {
        return p.traditionalMeaning;
      }
    }
  }
  return undefined;
}

function buildLinearPrediction(cards: NormalizedCard[], layout: LinearSentenceLayout, pairs: AdjacentPair[]): PredictionContext {
  const last = cards.length >= 1 ? cards[cards.length - 1] : null;
  const secondLast = cards.length >= 2 ? cards[cards.length - 2] : null;
  // Central card exists only when there are 5 or more cards in the line. For shorter
  // lines this stays null — no silent substitution of the closing card.
  const middle = cards.length >= 5 ? cards[2] : null;

  const lastPair: AdjacentPair | undefined = pairs.find(
    (p) => Math.min(p.indexA, p.indexB) === cards.length - 2 && Math.max(p.indexA, p.indexB) === cards.length - 1,
  );
  const firstPair: AdjacentPair | undefined = pairs.find(
    (p) => Math.min(p.indexA, p.indexB) === 0 && Math.max(p.indexA, p.indexB) === 1,
  );

  // Full ordered progression of every adjacent pair in the line. The closing pair is
  // also surfaced via primaryPair so the formatter can highlight it; otherwise every
  // pair has the same shape. Meaning goes through getUsablePairMeaning so the
  // contamination blacklist applies uniformly.
  const orderedPairs = [...pairs]
    .filter((p) => Math.min(p.indexA, p.indexB) >= 0 && Math.max(p.indexA, p.indexB) < cards.length)
    .sort((a, b) => {
      const aLo = Math.min(a.indexA, a.indexB);
      const bLo = Math.min(b.indexA, b.indexB);
      return bLo - aLo; // higher position first (= closer to closing)
    });
  const allPairs = orderedPairs.map((p) => ({
    a: p.cardA,
    b: p.cardB,
    meaning: p.traditionalMeaning,
    weight: p.weight,
  }));

  const developmentCard = cards.length >= 2 ? secondLast : null;

  return {
    layoutType: "linear-sentence",
    outcomeCard: last ?? null,
    developmentCard,
    coreDriverCard: middle,
    primaryPair: last && secondLast
      ? { a: secondLast, b: last, meaning: lastPair?.traditionalMeaning || pairMeaning(secondLast, last, pairs) }
      : null,
    supportingPair: cards.length >= 2
      ? { a: cards[0], b: cards[1], meaning: firstPair?.traditionalMeaning || pairMeaning(cards[0], cards[1], pairs) }
      : null,
    allPairs,
    significatorEvidence: [],
    houseEvidence: [],
    topicEvidence: [],
    timingEvidence: [],
    notes: layout.positions.map((p) => `Position ${p.index + 1} (${p.role}): ${p.function}`),
  };
}

function buildPetitPrediction(cards: NormalizedCard[], layout: PetitTableauLayout, pairs: AdjacentPair[]): PredictionContext {
  const center = layout.center.card;
  const middle = layout.rows.middle;
  const outcome = middle[middle.length - 1]?.card ?? cards[cards.length - 1];
  const development = middle[0]?.card ?? cards[0];

  const weighted = [...pairs].sort((a, b) => b.weight - a.weight);
  const primary = weighted[0];
  const supporting = weighted[1];

  const topicEvidence: PredictionEvidenceLine[] = [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const topic = GRAND_TABLEAU_TOPIC_CARDS[c.id];
    if (topic) {
      topicEvidence.push({
        label: `Topic: ${topic.label}`,
        value: `${c.name} at position ${i + 1}`,
      });
    }
    if (topicEvidence.length >= 4) break;
  }

  return {
    layoutType: "petit-tableau",
    outcomeCard: outcome,
    developmentCard: development,
    coreDriverCard: center,
    primaryPair: primary
      ? { a: primary.cardA, b: primary.cardB, meaning: primary.traditionalMeaning || pairMeaning(primary.cardA, primary.cardB, pairs) }
      : null,
    supportingPair: supporting
      ? { a: supporting.cardA, b: supporting.cardB, meaning: supporting.traditionalMeaning || pairMeaning(supporting.cardA, supporting.cardB, pairs) }
      : null,
    allPairs: [],
    significatorEvidence: [],
    houseEvidence: [],
    topicEvidence,
    timingEvidence: [],
    notes: [`Middle line (development path): ${middle.map((c) => fmt(c.card)).join(" → ")}`],
  };
}

function buildGrandPrediction(cards: NormalizedCard[], layout: GrandTableauLayout, pairs: AdjacentPair[]): PredictionContext {
  const sig = layout.primarySignificator;
  const bottomRow = layout.grid[Math.min(3, layout.grid.length - 1)] ?? [];
  const cardsOfFateLast = bottomRow[Math.min(8, bottomRow.length - 1)]?.card ?? null;
  const cardsOfFateFirst = bottomRow[0]?.card ?? null;

  // Outcome = last Cards of Fate (position 36). Development = first Cards of Fate
  // (position 33). These are anchor positions, not the significator's neighbourhood.
  // If a Cards of Fate anchor is absent (e.g. truncated grid), the field stays null —
  // do NOT silently substitute another card. The Prediction evidence block will simply
  // not emit that line.
  const outcome = cardsOfFateLast;
  const development = cardsOfFateFirst;

  const significantPairs = sig
    ? pairs
        .filter((p) => p.cardA.id === sig.card.id || p.cardB.id === sig.card.id)
        .sort((a, b) => b.weight - a.weight)
    : [];
  const primary = significantPairs[0] ?? [...pairs].sort((a, b) => b.weight - a.weight)[0] ?? null;
  const supporting = significantPairs[1] ?? [...pairs].sort((a, b) => b.weight - a.weight)[1] ?? null;

  const houseLines: PredictionEvidenceLine[] = [];
  for (const house of layout.houses) {
    const isImportant =
      layout.topicCards.some((tc) => tc.cardId === house.houseCardId) ||
      (sig && house.occupyingCard.id === sig.card.id);
    if (!isImportant) continue;
    houseLines.push({
      label: `House of ${house.houseName} (position ${house.position})`,
      value: fmt(house.occupyingCard),
    });
    if (houseLines.length >= 4) break;
  }

  const sigLines: PredictionEvidenceLine[] = [];
  if (sig) {
    const row = Math.floor(sig.index / 9) + 1;
    const col = (sig.index % 9) + 1;
    sigLines.push({
      label: `Primary significator: ${sig.card.name}`,
      value: `position ${sig.index + 1}, row ${row}, column ${col} (source: ${layout.primarySignificatorSource ?? "explicit"})`,
    });
  }
  const cardsOfFate = layout.cardsOfFate.map((c) => fmt(c.card)).join(", ");
  if (cardsOfFate) sigLines.push({ label: "Cards of Fate (bottom row)", value: cardsOfFate });

  const notes: string[] = [];
  if (!sig) {
    notes.push(
      "No significator card (Man/Woman) was drawn in this spread. The hierarchy above still applies: topic houses anchor long-term life themes, but the most actionable axis is topic houses + strongest weighted pair, not a person's neighbourhood.",
    );
  }

  return {
    layoutType: "grand-tableau",
    outcomeCard: outcome,
    developmentCard: development,
    coreDriverCard: sig?.card ?? null,
    primaryPair: primary
      ? { a: primary.cardA, b: primary.cardB, meaning: primary.traditionalMeaning || pairMeaning(primary.cardA, primary.cardB, pairs) }
      : null,
    supportingPair: supporting
      ? { a: supporting.cardA, b: supporting.cardB, meaning: supporting.traditionalMeaning || pairMeaning(supporting.cardA, supporting.cardB, pairs) }
      : null,
    allPairs: [],
    significatorEvidence: sigLines,
    houseEvidence: houseLines,
    topicEvidence: layout.topicCards.slice(0, 4).map((tc) => ({
      label: `Topic: ${tc.topic}`,
      value: `${tc.label} at position ${tc.index + 1} — ${fmt(tc.card)}`,
    })),
    timingEvidence: [],
    notes,
  };
}

export function buildPredictionContext(context: ReadingContext): PredictionContext {
  const { cards, layout, adjacentPairs, timingEvidence } = context;

  // One canonical timing line generated by buildPredictionTimingLine(); not per-card
  // entries (those duplicated the same information and let Mistral pick the wrong
  // one as canonical).
  const timingLines: PredictionEvidenceLine[] = [
    { label: "Permitted timing", value: buildPredictionTimingLine(timingEvidence) },
  ];

  let base: PredictionContext;
  if (layout.type === "petit-tableau") {
    base = buildPetitPrediction(cards, layout, adjacentPairs);
  } else if (layout.type === "grand-tableau") {
    base = buildGrandPrediction(cards, layout, adjacentPairs);
  } else if (layout.type === "linear-sentence") {
    base = buildLinearPrediction(cards, layout, adjacentPairs);
  } else {
    base = {
      layoutType: "single",
      outcomeCard: cards[cards.length - 1] ?? null,
      developmentCard: null,
      coreDriverCard: cards[0] ?? null,
      primaryPair: null,
      supportingPair: null,
      allPairs: [],
      significatorEvidence: [],
      houseEvidence: [],
      topicEvidence: [],
      timingEvidence: [],
      notes: [],
    };
  }
  base.timingEvidence = timingLines;
  return base;
}

export function formatPredictionEvidenceBlock(pe: PredictionContext): string {
  const lines: string[] = ["Prediction synthesis evidence:"];
  lines.push(`- Hierarchy: ${LAYOUT_HIERARCHY[pe.layoutType]}`);
  if (pe.outcomeCard) {
    const label = pe.layoutType === "linear-sentence"
      ? "Primary outcome (closing card)"
      : pe.layoutType === "petit-tableau"
        ? "Directional outcome (right end of middle line)"
        : pe.layoutType === "grand-tableau"
          ? "Primary outcome (significator area / cards of fate)"
          : "Primary outcome";
    lines.push(`- ${label}: ${fmt(pe.outcomeCard)}`);
  }
  if (pe.developmentCard) {
    const label = pe.layoutType === "linear-sentence"
      ? "Development path (second-to-last card)"
      : pe.layoutType === "petit-tableau"
        ? "Development path (left end of middle line)"
        : "Development path";
    lines.push(`- ${label}: ${fmt(pe.developmentCard)}`);
  }
  if (pe.coreDriverCard) {
    const label = pe.layoutType === "linear-sentence"
      ? "Central situation (middle card)"
      : pe.layoutType === "petit-tableau"
        ? "Center card (heart of tableau)"
        : pe.layoutType === "grand-tableau"
          ? "Significator (anchor of the read)"
          : "Core driver";
    lines.push(`- ${label}: ${fmt(pe.coreDriverCard)}`);
  }
  if (pe.layoutType === "linear-sentence" && pe.allPairs.length > 0) {
    // Full ordered progression. The closing pair (the last in the line) carries
    // the strongest weight; earlier pairs show how the situation develops toward it.
    lines.push(`- Full ordered progression (${pe.allPairs.length} adjacent pairs):`);
    for (let i = 0; i < pe.allPairs.length; i++) {
      const p = pe.allPairs[i];
      const meaning = p.meaning ? ` → ${p.meaning}` : "";
      const pos = `positions ${Math.min(p.a.id, p.b.id) + 1}+${Math.max(p.a.id, p.b.id) + 1}`;
      const isClosing = i === pe.allPairs.length - 1;
      const marker = isClosing ? " [STRONGEST — closing pair]" : "";
      lines.push(`    - pair ${i + 1} (${pos})${marker}: ${fmt(p.a)} + ${fmt(p.b)}${meaning}`);
    }
  }
  if (pe.primaryPair) {
    const label = pe.layoutType === "linear-sentence"
      ? "Strongest transition (closing pair)"
      : pe.layoutType === "petit-tableau"
        ? "Strongest transition (top-weighted pair; middle line + center column)"
        : pe.layoutType === "grand-tableau"
          ? "Strongest transition (top-weighted pair involving the significator)"
          : "Strongest transition";
    const meaning = pe.primaryPair.meaning ? ` → ${pe.primaryPair.meaning}` : "";
    lines.push(`- ${label}: ${fmt(pe.primaryPair.a)} + ${fmt(pe.primaryPair.b)}${meaning}`);
  }
  if (pe.supportingPair) {
    const meaning = pe.supportingPair.meaning ? ` → ${pe.supportingPair.meaning}` : "";
    lines.push(`- Supporting transition: ${fmt(pe.supportingPair.a)} + ${fmt(pe.supportingPair.b)}${meaning}`);
  }
  for (const line of pe.significatorEvidence) {
    lines.push(`- ${line.label}: ${line.value}`);
  }
  for (const line of pe.houseEvidence) {
    lines.push(`- ${line.label}: ${line.value}`);
  }
  for (const line of pe.topicEvidence) {
    lines.push(`- ${line.label}: ${line.value}`);
  }
  for (const line of pe.timingEvidence) {
    lines.push(`- ${line.label}: ${line.value}`);
  }
  for (const note of pe.notes) {
    lines.push(`- ${note}`);
  }
  return lines.join("\n");
}
