import { ReadingContext } from "@/lib/reading-context";
import { NormalizedCard } from "@/lib/reading-contract";

const CARD_SENSES: Record<number, Partial<Record<ReadingContext["questionDomain"], string>> & { general: string }> = {
  13: { general: "a new beginning or something young", relocation: "a fresh start", love: "a new beginning" },
  14: { general: "caution, work, or something not entirely straightforward", career: "work or employment requiring caution", relocation: "work or an arrangement that may not be entirely straightforward" },
  22: { general: "a choice between paths", relocation: "a decision about which direction or destination to take" },
  23: { general: "erosion, worry, or gradual loss", relocation: "pressure or erosion affecting the current living arrangement" },
  24: { general: "desire, attachment, or what is dearly wanted", relocation: "strong desire or attachment connected with the move" },
  26: { general: "what is unknown, concealed, or not yet disclosed", relocation: "an unresolved practical factor in the move" },
  28: { general: "a man or a person represented by the Man card" },
  29: { general: "a woman or a person represented by the Woman card" },
  35: { general: "stability, security, or an established base", relocation: "the established home base or practical security" },
};

const PAIR_SENSES: Record<string, string> = {
  "14:35": "work or employment tied to stability; security that may require caution",
  "23:35": "stability being eroded or worry affecting the established situation",
  "13:22": "a new beginning becoming a concrete choice between directions",
  "24:13": "a strongly desired fresh start",
  "26:28": "an unresolved or undisclosed factor around a man or decision-maker",
};

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}:${Math.max(a, b)}`;
}

function cardSense(card: NormalizedCard, domain: ReadingContext["questionDomain"]): string {
  const senses = CARD_SENSES[card.id];
  return senses?.[domain] || senses?.general || card.name;
}

export function buildLenormandEvidencePack(context: ReadingContext): string {
  const lines = [
    "Deterministic Lenormand evidence pack:",
    `Question domain: ${context.questionDomain}`,
    `Question frame: ${context.questionFrame}`,
    `Cards by position: ${context.cards.map((card, index) => `${index + 1} ${card.name}`).join(" — ")}`,
    "Card senses selected for this question:",
    ...context.cards.map((card, index) => `- Position ${index + 1} ${card.name}: ${cardSense(card, context.questionDomain)}`),
  ];

  const pairs = context.adjacentPairs
    .filter((pair) => pair.indexB === pair.indexA + 1)
    .sort((a, b) => b.weight - a.weight);
  if (pairs.length > 0) {
    lines.push("Question-relevant adjacent pairs:");
    for (const pair of pairs) {
      const meaning = PAIR_SENSES[pairKey(pair.cardA.id, pair.cardB.id)];
      lines.push(`- Positions ${pair.indexA + 1}+${pair.indexB + 1} ${pair.cardA.name} + ${pair.cardB.name}: ${meaning || "relationship present; no canonical pair meaning supplied"}`);
    }
  }

  return lines.join("\n");
}
