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
    range: "days",
    promptGuidance:
      "Birds are present. Likely timing: within days or very soon — communication, news, or short-cycle development.",
  },
  17: {
    id: 17,
    name: "Stork",
    range: "weeks",
    promptGuidance:
      "Stork is present. Likely timing: over the coming weeks — a change, transition, or relocation cycle is starting.",
  },
  32: {
    id: 32,
    name: "Moon",
    range: "months",
    promptGuidance:
      "Moon is present. Likely timing: around an upcoming lunar phase or emotional cycle — about a month, but tied to the querent's rhythm.",
  },
  5: {
    id: 5,
    name: "Tree",
    range: "years",
    promptGuidance:
      "Tree is present. Likely timing: develops slowly; think in months to years rather than weeks. Long-term, organic progress.",
  },
};

export function getTimingCard(id: number): TimingCardDefinition | undefined {
  return TIMING_CARDS[id];
}

export function isTimingCardId(id: number): boolean {
  return id in TIMING_CARDS;
}

export const TIMING_CARD_IDS: ReadonlySet<number> = new Set(Object.keys(TIMING_CARDS).map(Number));

export const NO_TIMING_INSTRUCTION =
  "No timing evidence detected. Do not infer a time range — write: Likely timing: Not clearly shown by these cards.";

export function buildTimingEvidencePrompt(timingEvidence: TimingEvidence[]): string {
  const recognised: TimingCardDefinition[] = [];
  for (const te of timingEvidence) {
    const def = getTimingCard(te.cardId);
    if (def) recognised.push(def);
  }

  if (recognised.length === 0) {
    return `Timing evidence:\n${NO_TIMING_INSTRUCTION}`;
  }

  const lines: string[] = ["Timing evidence:"];
  for (const def of recognised) {
    lines.push(`- ${def.name}: ${def.promptGuidance}`);
  }

  return lines.join("\n");
}
