import type { EvidenceEnvelope } from "@/lib/lenormand-evidence";
import type { GrandTableauReading, StructuredReading } from "@/lib/structured-reading";

export type ClaimType = "cardMeaning" | "pairMeaning" | "positionInterpretation" | "scenario" | "entityBinding" | "timing" | "outcome" | "uncertainty";
export type ClaimSupport = "direct" | "derived" | "none";

export interface ExtractedClaim {
  claimId: string;
  text: string;
  type: ClaimType;
  confidence: "high" | "moderate" | "low";
  evidenceRefs: string[];
  support: ClaimSupport;
}

export interface SynthesisAuditViolation {
  code: "fabricated_provenance" | "unreviewed_pair_expansion" | "missing_claim_provenance";
  claimId: string;
  message: string;
}

export interface SynthesisAuditResult {
  claims: ExtractedClaim[];
  violations: SynthesisAuditViolation[];
}

function normalizeEvidenceId(id: string): string {
  return id.replace(/^card-/, "card:").replace(/^pair-/, "pair:");
}

function confidence(text: string): ExtractedClaim["confidence"] {
  if (/\b(?:may|might|could|uncertain|unclear|possibly|perhaps)\b/i.test(text)) return "low";
  if (/\b(?:likely|probable|supports|suggests)\b/i.test(text)) return "moderate";
  return "high";
}

function claimType(text: string): ClaimType {
  if (/\b(?:timing|within|days?|weeks?|months?|soon|later)\b/i.test(text)) return "timing";
  if (/\b(?:uncertain|unclear|unknown|possibility|could|might)\b/i.test(text)) return "uncertainty";
  if (/\b(?:will|happen|develop|outcome|result)\b/i.test(text)) return "outcome";
  return "scenario";
}

export function auditStructuredSynthesis(
  reading: StructuredReading | GrandTableauReading,
  envelope: EvidenceEnvelope,
): SynthesisAuditResult {
  const claims: ExtractedClaim[] = [];
  const add = (text: string, refs: string[], type = claimType(text), support: ClaimSupport = refs.length ? "direct" : "none") => {
    claims.push({ claimId: `claim-${claims.length + 1}`, text, type, confidence: confidence(text), evidenceRefs: refs.map(normalizeEvidenceId), support });
  };

  add(reading.interpretation, []);
  for (const item of reading.evidence) add(item.implication, item.evidenceIds, "scenario");
  add(reading.prediction.development, reading.prediction.evidenceIds, "outcome");
  if (reading.prediction.timing) add(reading.prediction.timing, [], "timing");

  const validRefs = new Set([
    ...envelope.cards.map((card) => `card:${card.evidenceId.replace("card-", "")}`),
    ...envelope.pairs.map((pair) => `pair:${pair.evidenceId.replace("pair-", "")}`),
    ...envelope.positionEvidence.map((position) => `position:${position.position}`),
    ...envelope.timing.evidence.map((_, index) => `timing:${index + 1}`),
  ]);
  const unreviewedPairs = new Set(envelope.pairs.filter((pair) => pair.status === "unreviewed").map((pair) => `pair:${pair.evidenceId.replace("pair-", "")}`));
  const violations: SynthesisAuditViolation[] = [];
  for (const claim of claims) {
    for (const ref of claim.evidenceRefs) {
      if (!validRefs.has(ref)) violations.push({ code: "fabricated_provenance", claimId: claim.claimId, message: `Claim references unavailable evidence "${ref}".` });
    }
    if (claim.evidenceRefs.some((ref) => unreviewedPairs.has(ref)) && /\b(?:canonical|means|in Lenormand|the pair)\b/i.test(claim.text)) {
      violations.push({ code: "unreviewed_pair_expansion", claimId: claim.claimId, message: "An unreviewed pair was presented as established canonical meaning." });
    }
    if (claim.support === "none" && claim.type !== "uncertainty") {
      violations.push({ code: "missing_claim_provenance", claimId: claim.claimId, message: "A substantive claim has no explicit evidence reference." });
    }
  }
  return { claims, violations };
}
