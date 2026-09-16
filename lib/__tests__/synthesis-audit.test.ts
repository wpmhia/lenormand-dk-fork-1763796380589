import { describe, expect, it } from "vitest";
import { buildEvidenceEnvelope } from "@/lib/lenormand-evidence";
import { buildReadingContext } from "@/lib/reading-context";
import { auditStructuredSynthesis } from "@/lib/synthesis-audit";

const cards = [
  { id: 12, name: "Birds", keywords: [], position: 0 },
  { id: 21, name: "Mountain", keywords: [], position: 1 },
  { id: 24, name: "Heart", keywords: [], position: 2 },
];

const reading = (development: string, evidenceIds = ["pair-1-2", "card-3"]) => ({
  mode: "forecast" as const,
  interpretation: "Communication and uncertainty are present.",
  evidence: [{ pair: "Birds + Mountain", evidenceIds: ["pair-1-2"], implication: "Communication appears difficult or delayed." }],
  prediction: { development, evidenceIds, timing: "Not clearly shown by these cards.", watchFor: null, practicalAction: null },
});

describe("claim-level synthesis audit", () => {
  it("accepts direct and derived claims with resolvable provenance", () => {
    const context = buildReadingContext("sentence-3", "What develops in this relationship?", cards, new Map());
    const result = auditStructuredSynthesis(reading("Communication may remain difficult, but the emotional direction is uncertain."), buildEvidenceEnvelope(context));
    expect(result.violations.some((violation) => violation.code === "fabricated_provenance")).toBe(false);
  });

  it("detects fabricated evidence references", () => {
    const context = buildReadingContext("sentence-3", "What develops?", cards, new Map());
    const result = auditStructuredSynthesis(reading("The outcome follows the cards.", ["pair-99-100", "card-3"]), buildEvidenceEnvelope(context));
    expect(result.violations.some((violation) => violation.code === "fabricated_provenance")).toBe(true);
  });

  it("detects canonical claims attached to an unreviewed pair", () => {
    const context = buildReadingContext("sentence-3", "What develops?", cards, new Map());
    const result = auditStructuredSynthesis({
      ...reading("In Lenormand, Birds + Mountain means a fixed three-week delay."),
      evidence: [{ pair: "Birds + Mountain", evidenceIds: ["pair-1-2"], implication: "In Lenormand, this pair means a fixed delay." }],
    }, buildEvidenceEnvelope(context));
    expect(result.violations.some((violation) => violation.code === "unreviewed_pair_expansion")).toBe(true);
  });
});
