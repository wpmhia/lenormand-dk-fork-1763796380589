import type { ReadingContext } from "@/lib/reading-context";
import { getCanonicalLenormandPairMeaning, getUsableLenormandPairMeaning } from "@/lib/pair-meaning";
import { getPairEvidenceId } from "@/lib/lenormand-evidence";

export type ClaimModality = "supported" | "suggested" | "possible" | "unresolved";
export type ClaimPolarity = "positive" | "negative" | "neutral" | "unresolved";

export interface ClaimPlanClaim {
  id: string;
  subject: string;
  predicate: string;
  object?: string;
  modality: ClaimModality;
  polarity: ClaimPolarity;
  evidenceIds: string[];
  bindingIds: string[];
  proposition: string | null;
}

export interface ClaimPlan {
  mode: "forecast" | "retrospective_event" | "current_state" | "advice";
  subject: string | null;
  counterparty: string | null;
  predicate: string;
  claims: ClaimPlanClaim[];
}

export function buildClaimPlan(context: ReadingContext): ClaimPlan {
  const semantic = context.semanticQuestion;
  const claims: ClaimPlanClaim[] = [];

  for (const pair of context.adjacentPairs) {
    const canonical = getUsableLenormandPairMeaning(
      getCanonicalLenormandPairMeaning(pair.cardA.id, pair.cardB.id, semantic),
    );
    const evidenceId = getPairEvidenceId(pair.indexA, pair.indexB);
    claims.push({
      id: `pair-${pair.indexA + 1}-${pair.indexB + 1}`,
      subject: "situation",
      predicate: canonical ? "supported_pair_meaning" : "unreviewed_pair_combination",
      modality: canonical ? "supported" : "unresolved",
      polarity: "unresolved",
      evidenceIds: [evidenceId],
      bindingIds: [],
      proposition: canonical || null,
    });
  }

  for (const [index] of context.cards.entries()) {
    claims.push({ id: `card-${index + 1}`, subject: "situation", predicate: "card_meaning", modality: "suggested", polarity: "unresolved", evidenceIds: [`card-${index + 1}`], bindingIds: [], proposition: null });
  }
  if (context.layout.type === "grand-tableau") {
    for (const position of context.layout.grid.flat()) {
      claims.push({ id: `position-${position.index + 1}`, subject: "situation", predicate: "position_context", modality: "suggested", polarity: "unresolved", evidenceIds: [`position-${position.index + 1}`], bindingIds: [], proposition: null });
    }
    for (const house of context.layout.houses) {
      claims.push({ id: `house-${house.houseCardId}`, subject: "situation", predicate: "house_relation", modality: "suggested", polarity: "unresolved", evidenceIds: [`house-${house.houseCardId}`], bindingIds: [], proposition: null });
    }
    for (const mirror of context.layout.mirrors) {
      claims.push({ id: `mirror-${mirror.cardA.id}-${mirror.cardB.id}`, subject: "situation", predicate: "mirror_relation", modality: "suggested", polarity: "unresolved", evidenceIds: [`mirror-${mirror.cardA.id}-${mirror.cardB.id}`], bindingIds: [], proposition: null });
    }
  }
  if (context.timingEvidence.length > 0) {
    claims.push({ id: "timing-1", subject: "event", predicate: "timing", modality: "supported", polarity: "neutral", evidenceIds: ["timing-1"], bindingIds: [], proposition: null });
  }

  const subject = semantic?.subject || context.questionSubjects[0] || null;
  const primaryEvidence = context.adjacentPairs.map((pair) => getPairEvidenceId(pair.indexA, pair.indexB));
  claims.push({
    id: "question-predicate",
    subject: subject || "question subject",
    predicate: semantic?.predicate || "answer the question",
    object: semantic?.counterparty || undefined,
    modality: "suggested",
    polarity: "unresolved",
    evidenceIds: primaryEvidence,
    bindingIds: context.personBindings.map((binding) => `${binding.cardId}`),
    proposition: null,
  });

  return {
    mode: semantic?.mode || "forecast",
    subject,
    counterparty: semantic?.counterparty || null,
    predicate: semantic?.predicate || "answer the question",
    claims,
  };
}
