import type { ReadingContext, AdjacentPair, GrandTableauLayout, PetitTableauLayout, LinearSentenceLayout } from "@/lib/reading-context";
import type { NormalizedCard } from "@/lib/reading-contract";
import { TIMING_CARDS } from "@/lib/timing";
import { GRAND_TABLEAU_TOPIC_CARDS } from "@/lib/spreads";
import { fmtCard } from "@/lib/prompt-builder";

export interface PredictionEvidenceLine {
  label: string;
  value: string;
}

export interface PredictionContext {
  outcomeCard: NormalizedCard | null;
  developmentCard: NormalizedCard | null;
  coreDriverCard: NormalizedCard | null;
  primaryPair: { a: NormalizedCard; b: NormalizedCard; meaning?: string } | null;
  supportingPair: { a: NormalizedCard; b: NormalizedCard; meaning?: string } | null;
  significatorEvidence: PredictionEvidenceLine[];
  houseEvidence: PredictionEvidenceLine[];
  topicEvidence: PredictionEvidenceLine[];
  timingEvidence: PredictionEvidenceLine[];
  notes: string[];
}

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
  const last = cards[cards.length - 1];
  const secondLast = cards[cards.length - 2];
  const middle = cards.length >= 5 ? cards[2] : null;

  const lastPair: AdjacentPair | undefined = pairs.find(
    (p) => Math.min(p.indexA, p.indexB) === cards.length - 2 && Math.max(p.indexA, p.indexB) === cards.length - 1,
  );
  const firstPair: AdjacentPair | undefined = pairs.find(
    (p) => Math.min(p.indexA, p.indexB) === 0 && Math.max(p.indexA, p.indexB) === 1,
  );

  const developmentCard = cards.length >= 2 ? secondLast : null;

  return {
    outcomeCard: last ?? null,
    developmentCard,
    coreDriverCard: middle,
    primaryPair: last && secondLast
      ? { a: secondLast, b: last, meaning: lastPair?.traditionalMeaning || pairMeaning(secondLast, last, pairs) }
      : null,
    supportingPair: cards.length >= 2
      ? { a: cards[0], b: cards[1], meaning: firstPair?.traditionalMeaning || pairMeaning(cards[0], cards[1], pairs) }
      : null,
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
    outcomeCard: outcome,
    developmentCard: development,
    coreDriverCard: center,
    primaryPair: primary
      ? { a: primary.cardA, b: primary.cardB, meaning: primary.traditionalMeaning || pairMeaning(primary.cardA, primary.cardB, pairs) }
      : null,
    supportingPair: supporting
      ? { a: supporting.cardA, b: supporting.cardB, meaning: supporting.traditionalMeaning || pairMeaning(supporting.cardA, supporting.cardB, pairs) }
      : null,
    significatorEvidence: [],
    houseEvidence: [],
    topicEvidence,
    timingEvidence: [],
    notes: [`Middle line (development path): ${middle.map((c) => fmt(c.card)).join(" → ")}`],
  };
}

function buildGrandPrediction(cards: NormalizedCard[], layout: GrandTableauLayout, pairs: AdjacentPair[]): PredictionContext {
  const sig = layout.primarySignificator;
  const outcome = sig ? layout.grid[Math.min(3, layout.grid.length - 1)][Math.min(8, layout.grid[Math.min(3, layout.grid.length - 1)].length - 1)]?.card : cards[cards.length - 1];
  const development = sig
    ? layout.grid[Math.floor(sig.index / 9)][Math.min(8, (sig.index % 9) + 1)]?.card
    : cards[cards.length - 1];

  const significantPairs = pairs
    .filter((p) => sig && (p.cardA.id === sig.card.id || p.cardB.id === sig.card.id))
    .sort((a, b) => b.weight - a.weight);

  const primary = significantPairs[0];
  const supporting = significantPairs[1] ?? [...pairs].sort((a, b) => b.weight - a.weight)[0];

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
      value: `position ${sig.index + 1}, row ${row}, column ${col}`,
    });
  }
  const cardsOfFate = layout.cardsOfFate.map((c) => fmt(c.card)).join(", ");
  if (cardsOfFate) sigLines.push({ label: "Cards of Fate (bottom row)", value: cardsOfFate });

  return {
    outcomeCard: outcome ?? null,
    developmentCard: development ?? null,
    coreDriverCard: sig?.card ?? null,
    primaryPair: primary
      ? { a: primary.cardA, b: primary.cardB, meaning: primary.traditionalMeaning || pairMeaning(primary.cardA, primary.cardB, pairs) }
      : null,
    supportingPair: supporting
      ? { a: supporting.cardA, b: supporting.cardB, meaning: supporting.traditionalMeaning || pairMeaning(supporting.cardA, supporting.cardB, pairs) }
      : null,
    significatorEvidence: sigLines,
    houseEvidence: houseLines,
    topicEvidence: layout.topicCards.slice(0, 4).map((tc) => ({
      label: `Topic: ${tc.topic}`,
      value: `${tc.label} at position ${tc.index + 1} — ${fmt(tc.card)}`,
    })),
    timingEvidence: [],
    notes: [],
  };
}

export function buildPredictionContext(context: ReadingContext): PredictionContext {
  const { cards, layout, adjacentPairs, timingEvidence } = context;

  const timingLines: PredictionEvidenceLine[] = [];
  if (timingEvidence.length === 0) {
    timingLines.push({ label: "Permitted timing", value: "Not clearly shown by these cards." });
  } else {
    for (const te of timingEvidence) {
      const def = TIMING_CARDS[te.cardId];
      if (def) timingLines.push({ label: def.name, value: def.output });
    }
  }

  let base: PredictionContext;
  if (layout.type === "petit-tableau") {
    base = buildPetitPrediction(cards, layout, adjacentPairs);
  } else if (layout.type === "grand-tableau") {
    base = buildGrandPrediction(cards, layout, adjacentPairs);
  } else if (layout.type === "linear-sentence") {
    base = buildLinearPrediction(cards, layout, adjacentPairs);
  } else {
    base = {
      outcomeCard: cards[cards.length - 1] ?? null,
      developmentCard: null,
      coreDriverCard: cards[0] ?? null,
      primaryPair: null,
      supportingPair: null,
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
  if (pe.outcomeCard) {
    lines.push(`- Primary outcome: ${fmt(pe.outcomeCard)} at the closing position`);
  }
  if (pe.developmentCard) {
    lines.push(`- Development path: ${fmt(pe.developmentCard)} (the card that drives the change)`);
  }
  if (pe.coreDriverCard) {
    lines.push(`- Core driver: ${fmt(pe.coreDriverCard)}`);
  }
  if (pe.primaryPair) {
    const meaning = pe.primaryPair.meaning ? ` → ${pe.primaryPair.meaning}` : "";
    lines.push(`- Strongest transition: ${fmt(pe.primaryPair.a)} + ${fmt(pe.primaryPair.b)}${meaning}`);
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
