import { ReadingContext } from "@/lib/reading-context";
import { getCanonicalLenormandPairMeaning } from "@/lib/pair-meaning";

export type EvidenceClass = "structural" | "canonical" | "contextual";
export type EvidenceStrength = "strong" | "moderate" | "mixed" | "unresolved";

export interface ReadingTrace {
  question: { text: string; domain: ReadingContext["questionDomain"]; frame: string };
  observations: string[];
  semanticEvidence: { id: string; class: EvidenceClass; text: string; strength: EvidenceStrength }[];
  hierarchy: { strongest: string; secondary: string };
  timing: { supported: boolean };
}

export function buildReadingTrace(context: ReadingContext): ReadingTrace {
  const observations = context.cards.map((card, index) => `card:${card.id}:position:${index + 1}`);
  const linearPairs = context.adjacentPairs
    .filter((pair) => pair.indexB === pair.indexA + 1)
    .sort((a, b) => b.weight - a.weight);

  const semanticEvidence = linearPairs.map((pair) => {
    const meaning = getCanonicalLenormandPairMeaning(pair.cardA.id, pair.cardB.id);
    return {
      id: `pair:${Math.min(pair.cardA.id, pair.cardB.id)}-${Math.max(pair.cardA.id, pair.cardB.id)}`,
      class: (meaning ? "canonical" : "structural") as EvidenceClass,
      text: meaning || `${pair.cardA.name} + ${pair.cardB.name}: no canonical pair meaning supplied`,
      strength: (meaning ? (pair.weight >= 5 ? "strong" : "moderate") : "unresolved") as EvidenceStrength,
    };
  });

  return {
    question: { text: context.question, domain: context.questionDomain, frame: context.questionFrame },
    observations,
    semanticEvidence,
    hierarchy: {
      strongest: linearPairs[0] ? `pair:${linearPairs[0].indexA + 1}+${linearPairs[0].indexB + 1}` : "none",
      secondary: linearPairs[1] ? `pair:${linearPairs[1].indexA + 1}+${linearPairs[1].indexB + 1}` : "none",
    },
    timing: { supported: context.timingEvidence.length > 0 },
  };
}
