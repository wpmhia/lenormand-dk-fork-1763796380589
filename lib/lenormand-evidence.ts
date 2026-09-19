import { ReadingContext, GrandTableauLayout } from "@/lib/reading-context";
import { NormalizedCard } from "@/lib/reading-contract";
import { getCanonicalLenormandPairMeaning, getUsableLenormandPairMeaning } from "@/lib/pair-meaning";
import { buildReadingTrace } from "@/lib/reading-trace";

export function getPairEvidenceId(indexA: number, indexB: number): string {
  return `pair-${indexA + 1}-${indexB + 1}`;
}

export function getCardEvidenceId(index: number): string {
  return `card-${index + 1}`;
}

export function getGrandTableauPromptedHouseIds(layout: GrandTableauLayout): Set<number> {
  const ids = new Set<number>();
  const importantTopics = new Set(["heart", "love", "money", "health", "work", "home"]);
  for (const topic of layout.topicCards) {
    if (importantTopics.has(topic.topic)) ids.add(topic.cardId);
  }
  if (layout.primarySignificator) ids.add(layout.primarySignificator.card.id);
  if (layout.significators.woman) ids.add(29);
  if (layout.significators.man) ids.add(28);
  if (layout.primarySignificator) ids.add(layout.primarySignificator.index + 1);
  for (const house of layout.houses) {
    if (house.occupyingCard.id === house.houseCardId) ids.add(house.houseCardId);
  }
  return ids;
}

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
  15: { general: "power, strength, or authority" },
  16: { general: "clarity, guidance, hope, visibility, or inspiration" },
  17: { general: "change, transition, or gradual movement" },
  18: { general: "trust, loyalty, or reliable support" },
  19: { general: "distance, institutions, or solitude" },
  20: { general: "social setting, community, or public context" },
  21: { general: "obstacle, pressure, or a difficult boundary" },
  22: { general: "a choice between paths", relocation: "a decision about which direction or destination to take" },
  23: { general: "erosion, worry, or gradual loss", relocation: "pressure or erosion affecting the current living arrangement" },
  24: { general: "desire, attachment, or what is dearly wanted", relocation: "strong desire or attachment connected with the move" },
  25: { general: "commitment, agreement, or a relationship bond" },
  26: { general: "what is unknown, concealed, or not yet disclosed", relocation: "an unresolved practical factor in the move" },
  28: { general: "a man or a person represented by the Man card" },
  29: { general: "a woman or a person represented by the Woman card" },
  30: { general: "maturity, patience, or established intimacy" },
  31: { general: "success, clarity, or a favorable result" },
  32: { general: "recognition, feelings, or a changing public mood" },
  33: { general: "a solution, access, or decisive answer" },
  34: { general: "resources, flow, or available capacity", money: "money, resources, or material flow" },
  35: { general: "stability, security, or an established base", relocation: "the established home base or practical security" },
  36: { general: "a burden, difficult obligation, or heavy outcome" },
};

export type EvidencePolarity = "positive" | "negative" | "neutral" | "ambiguous";
export type EvidenceStatus = "reviewed" | "unreviewed";

export function getCoreCardMeaning(card: NormalizedCard): string | null {
  return CARD_SENSES[card.id]?.general || null;
}

export interface EvidenceEnvelope {
  question: { text: string; domain: ReadingContext["questionDomain"]; situationContext: string; observationWindow: string | null };
  cards: Array<{ evidenceId: string; position: number; name: string; status: EvidenceStatus; supportedMeanings: string[]; polarity: EvidencePolarity | null }>;
  positionEvidence: Array<{ position: number; role: string; relationshipToQuestion: string }>;
  pairs: Array<{ evidenceId: string; positions: [number, number]; cards: string[]; status: "reviewed" | "unreviewed"; supportedMeaning: string | null; relation: "combination" | "adjacent"; directional: false }>;
  timing: { observationWindow: string | null; supported: boolean; evidence: string[] };
}

function getObservationWindow(question: string): string | null {
  const match = question.match(/\b(?:within|during|over|in|binnen|komende|next)\b.{0,30}\b(?:days?|dagen?|weeks?|weken?|months?|maanden?|week|maand)\b/i);
  return match?.[0] || null;
}

function getCardEvidence(card: NormalizedCard, domain: ReadingContext["questionDomain"]): { status: EvidenceStatus; meaning: string | null } {
  const senses = CARD_SENSES[card.id];
  const meaning = senses?.[domain] || senses?.general;
  return { status: meaning ? "reviewed" : "unreviewed", meaning: meaning || null };
}

export function buildEvidenceEnvelope(context: ReadingContext): EvidenceEnvelope {
  const window = getObservationWindow(context.question);
  const pairs = context.adjacentPairs
    .filter((pair) => context.layout.type !== "linear-sentence" || pair.indexB === pair.indexA + 1)
    .sort((a, b) => b.weight - a.weight)
    .map((pair) => ({
      evidenceId: getPairEvidenceId(pair.indexA, pair.indexB),
      positions: [pair.indexA + 1, pair.indexB + 1] as [number, number],
      cards: [pair.cardA.name, pair.cardB.name],
      supportedMeaning: getUsableLenormandPairMeaning(getCanonicalLenormandPairMeaning(pair.cardA.id, pair.cardB.id, context.semanticQuestion)) || null,
      status: getUsableLenormandPairMeaning(getCanonicalLenormandPairMeaning(pair.cardA.id, pair.cardB.id, context.semanticQuestion)) ? "reviewed" as const : "unreviewed" as const,
      relation: "combination" as const,
      directional: false as const,
    }));

  return {
    question: { text: context.question, domain: context.questionDomain, situationContext: context.situationContext, observationWindow: window },
    cards: context.cards.map((card, index) => ({
      ...(() => {
        const evidence = getCardEvidence(card, context.questionDomain);
        return { status: evidence.status, supportedMeanings: evidence.meaning ? [evidence.meaning] : [] };
      })(),
      evidenceId: getCardEvidenceId(index),
      position: index + 1,
      name: card.name,
      // Predicate-level polarity is not supplied by the current evidence registry.
      polarity: null,
    })),
    positionEvidence: context.cards.map((_, index) => ({
      position: index + 1,
      role: context.layout.type === "linear-sentence"
        ? index === context.cards.length - 1 ? "closing" : index === 0 ? "opening" : "development"
        : "tableau-position",
      relationshipToQuestion: context.layout.type === "linear-sentence" && index === context.cards.length - 1
        ? "forecast priority by current engine methodology"
        : "context for the question",
    })),
    pairs,
    timing: {
      observationWindow: window,
      supported: context.timingEvidence.length > 0,
      evidence: context.timingEvidence.map((item) => item.range),
    },
  };
}

export function buildLenormandEvidencePack(context: ReadingContext): string {
  const trace = buildReadingTrace(context);
  const envelope = buildEvidenceEnvelope(context);
  const lines = [
    "Deterministic Lenormand evidence pack:",
    `Question domain: ${envelope.question.domain}`,
    `Question observation window: ${envelope.question.observationWindow || "none explicitly stated"}`,
    `Question frame: ${context.questionFrame}`,
    `Cards by position: ${context.cards.map((card, index) => `${getCardEvidenceId(index)} ${index + 1} ${card.name}`).join(" — ")}`,
    `Hierarchy: strongest ${trace.hierarchy.strongest}; secondary ${trace.hierarchy.secondary}`,
    `Timing evidence supported: ${trace.timing.supported ? "yes" : "no"}`,
    `Question subject(s) to preserve: ${context.questionSubjects.length > 0 ? context.questionSubjects.join(", ") : "not explicitly named"}`,
    `Questioner reference: ${context.semanticQuestion?.counterparty === "questioner" ? "first-person questioner" : "not explicitly stated"}`,
    `Person/entity bindings: ${context.personBindings.length > 0 ? context.personBindings.map((binding) => `${binding.cardId === 28 ? "Man" : "Woman"} bound by ${binding.source}`).join("; ") : "none; Man and Woman remain unbound"}`,
    "Card senses selected for this question:",
    ...envelope.cards.map((card) => `- ${card.evidenceId}: Position ${card.position} ${card.name}: ${card.status === "reviewed" ? card.supportedMeanings.join("; ") : "unknown/unreviewed card meaning"} (status: ${card.status}; polarity metadata only: ${card.polarity})`),
    ...envelope.positionEvidence.map((position) => `- position-${position.position}: role=${position.role}; ${position.relationshipToQuestion}`),
  ];

  const pairs = envelope.pairs;
  if (pairs.length > 0) {
    lines.push("Question-relevant adjacent pairs:");
    for (const pair of pairs) {
      lines.push(`- ${pair.evidenceId}: Positions ${pair.positions[0]}+${pair.positions[1]} ${pair.cards.join(" + ")}: ${pair.supportedMeaning || "unknown/unreviewed; relationship present but no canonical meaning supplied"} (status: ${pair.status}; relation: ${pair.relation}; directional: ${pair.directional})`);
    }
  }

  if (context.layout.type === "grand-tableau") {
    lines.push("Grand Tableau house evidence:");
    for (const house of context.layout.houses) {
      lines.push(`- house-${house.houseCardId}: House of ${house.houseName}, position ${house.position}, occupied by ${house.occupyingCard.name}`);
    }
    lines.push("Grand Tableau positional relations:");
    for (const pair of context.layout.verticalPairs) {
      lines.push(`- vertical adjacency: ${pair.cardA.name} + ${pair.cardB.name}`);
    }
    for (const mirror of context.layout.mirrors) {
      lines.push(`- mirror: ${mirror.cardA.name} <-> ${mirror.cardB.name}`);
    }
  }

  return lines.join("\n");
}
