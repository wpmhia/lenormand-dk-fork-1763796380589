import { TimingEvidence } from "@/lib/reading-context";

export interface TimingCardDefinition {
  id: number;
  name: string;
  range: string;
  promptGuidance: string;
}

export const TIMING_CARDS: Record<number, TimingCardDefinition> = {
  12: {
    id: 12,
    name: "Birds",
    range: "days (very near term)",
    promptGuidance:
      "Birds are present. Likely timing: within days or very soon — communication, news, or short-cycle development.",
  },
  17: {
    id: 17,
    name: "Stork",
    range: "weeks (change within weeks)",
    promptGuidance:
      "Stork is present. Likely timing: over the coming weeks — a change, transition, or relocation cycle is starting.",
  },
  32: {
    id: 32,
    name: "Moon",
    range: "phases (emotional / cyclical timing)",
    promptGuidance:
      "Moon is present. Likely timing: around an upcoming lunar phase or emotional cycle — about a month, but tied to the querent's rhythm.",
  },
  5: {
    id: 5,
    name: "Tree",
    range: "years (long-term, slow growth)",
    promptGuidance:
      "Tree is present. Likely timing: develops slowly; think in months to years rather than weeks. Long-term, organic progress.",
  },
  2: {
    id: 2,
    name: "Clover",
    range: "soon (lucky chance, quick opportunity)",
    promptGuidance:
      "Clover is present as a soft timing signal: a small, lucky chance appearing soon. Do not anchor the whole reading to a precise date on this alone.",
  },
  30: {
    id: 30,
    name: "Lily",
    range: "mature (slow, patient timeline)",
    promptGuidance:
      "Lily is present as a soft timing signal: this matures slowly and patiently. Expect a calmer, longer arc rather than a quick result.",
  },
};

export function getTimingCard(id: number): TimingCardDefinition | undefined {
  return TIMING_CARDS[id];
}

export function isTimingCardId(id: number): boolean {
  return id in TIMING_CARDS;
}

export const PRIMARY_TIMING_CARD_IDS: ReadonlySet<number> = new Set([12, 17, 32, 5]);

export function isPrimaryTimingCardId(id: number): boolean {
  return PRIMARY_TIMING_CARD_IDS.has(id);
}

export const NO_TIMING_INSTRUCTION =
  "No timing evidence detected. Do not infer a time range — write: Likely timing: Not clearly shown by these cards.";

export function buildTimingEvidencePrompt(timingEvidence: TimingEvidence[]): string {
  if (timingEvidence.length === 0) {
    return `Timing evidence:\n${NO_TIMING_INSTRUCTION}`;
  }

  const primary = timingEvidence.filter((te) => isPrimaryTimingCardId(te.cardId));
  const soft = timingEvidence.filter((te) => !isPrimaryTimingCardId(te.cardId));

  const lines: string[] = ["Timing evidence (use exactly one — primary cards override soft signals):"];
  for (const te of primary) {
    const def = getTimingCard(te.cardId);
    if (def) lines.push(`- ${def.name}: ${def.promptGuidance}`);
  }
  if (primary.length === 0) {
    for (const te of soft) {
      const def = getTimingCard(te.cardId);
      if (def) lines.push(`- ${def.name}: ${def.promptGuidance}`);
    }
  } else if (soft.length > 0) {
    lines.push("Soft timing signals (do not override the primary timing above):");
    for (const te of soft) {
      const def = getTimingCard(te.cardId);
      if (def) lines.push(`- ${def.name}: ${def.promptGuidance}`);
    }
  }

  return lines.join("\n");
}
