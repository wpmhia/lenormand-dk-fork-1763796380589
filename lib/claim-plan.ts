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
  mode: "forecast" | "retrospective_event" | "current_state";
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
