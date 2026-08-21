import { ReadingContext } from "@/lib/reading-context";
import { NormalizedCard } from "@/lib/reading-contract";
import { getCanonicalLenormandPairMeaning } from "@/lib/pair-meaning";
import { buildReadingTrace } from "@/lib/reading-trace";

const CARD_SENSES: Record<number, Partial<Record<ReadingContext["questionDomain"], string>> & { general: string }> = {
  1: { general: "news, arrival, or movement" },
  2: { general: "a small opportunity or temporary benefit" },
  3: { general: "distance, travel, or a departure" },
  4: { general: "home, residence, or family setting", relocation: "the home or place of residence" },
  5: { general: "health, growth, or a long-term condition" },
  6: { general: "uncertainty, confusion, or poor visibility" },
  7: { general: "a complication, indirect route, or caution" },
  8: { general: "closure, ending, or a stopped process" },
  9: { general: "an invitation, pleasant development, or attraction" },
  10: { general: "a sharp decision, cut, or sudden separation" },
  11: { general: "repeated conflict, pressure, or argument" },
  12: { general: "discussion, nervous activity, or exchanged messages" },
  13: { general: "a new beginning or something young", relocation: "a fresh start", love: "a new beginning" },
  14: { general: "caution, work, or something not entirely straightforward", career: "work or employment requiring caution", relocation: "work or an arrangement that may not be entirely straightforward" },
  22: { general: "a choice between paths", relocation: "a decision about which direction or destination to take" },
  23: { general: "erosion, worry, or gradual loss", relocation: "pressure or erosion affecting the current living arrangement" },
  24: { general: "desire, attachment, or what is dearly wanted", relocation: "strong desire or attachment connected with the move" },
  26: { general: "what is unknown, concealed, or not yet disclosed", relocation: "an unresolved practical factor in the move" },
  28: { general: "a man or a person represented by the Man card" },
  29: { general: "a woman or a person represented by the Woman card" },
  30: { general: "maturity, patience, or established intimacy" },
  31: { general: "success, clarity, or a favorable result" },
  32: { general: "recognition, feelings, or a changing public mood" },
  33: { general: "a solution, access, or decisive answer" },
  34: { general: "money, resources, or material flow" },
  35: { general: "stability, security, or an established base", relocation: "the established home base or practical security" },
  36: { general: "a burden, difficult obligation, or heavy outcome" },
};

function cardSense(card: NormalizedCard, domain: ReadingContext["questionDomain"]): string {
  const senses = CARD_SENSES[card.id];
  return senses?.[domain] || senses?.general || card.name;
}

export function buildLenormandEvidencePack(context: ReadingContext): string {
  const trace = buildReadingTrace(context);
  const lines = [
    "Deterministic Lenormand evidence pack:",
    `Question domain: ${context.questionDomain}`,
    `Question frame: ${context.questionFrame}`,
    `Cards by position: ${context.cards.map((card, index) => `${index + 1} ${card.name}`).join(" — ")}`,
    `Hierarchy: strongest ${trace.hierarchy.strongest}; secondary ${trace.hierarchy.secondary}`,
    `Timing evidence supported: ${trace.timing.supported ? "yes" : "no"}`,
    "Card senses selected for this question:",
    ...context.cards.map((card, index) => `- Position ${index + 1} ${card.name}: ${cardSense(card, context.questionDomain)}`),
  ];

  const pairs = context.adjacentPairs
    .filter((pair) => context.layout.type !== "linear-sentence" || pair.indexB === pair.indexA + 1)
    .sort((a, b) => b.weight - a.weight);
  if (pairs.length > 0) {
    lines.push("Question-relevant adjacent pairs:");
    for (const pair of pairs) {
      const meaning = getCanonicalLenormandPairMeaning(pair.cardA.id, pair.cardB.id);
      lines.push(`- Positions ${pair.indexA + 1}+${pair.indexB + 1} ${pair.cardA.name} + ${pair.cardB.name}: ${meaning || "relationship present; no canonical pair meaning supplied"}`);
    }
  }

  return lines.join("\n");
}
