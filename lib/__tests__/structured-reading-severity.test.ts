import { describe, expect, it } from "vitest";
import { isBlockingStructuredIssue } from "@/lib/structured-reading";

describe("structured validation severity", () => {
  it("keeps interpretive disagreements non-blocking but entity substitutions blocking", () => {
    expect(isBlockingStructuredIssue({ type: "semantic_grounding", code: "unsupported_entity_binding", message: "unbound person" })).toBe(true);
    expect(isBlockingStructuredIssue({ type: "semantic_grounding", code: "unsupported_causality", message: "unsupported cause" })).toBe(false);
  });

  it("keeps fabricated evidence references blocking", () => {
    expect(isBlockingStructuredIssue({ type: "ungrounded_evidence", message: "unknown evidence" })).toBe(true);
    expect(isBlockingStructuredIssue({ type: "ungrounded_prediction", message: "unknown evidence" })).toBe(true);
  });
});
