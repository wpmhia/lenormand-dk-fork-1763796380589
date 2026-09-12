import { describe, expect, it } from "vitest";
import { GOLDEN_QA_CORPUS } from "./golden-qa-corpus";

describe("golden QA corpus", () => {
  it("covers every recent semantic regression family", () => {
    expect(GOLDEN_QA_CORPUS).toHaveLength(11);
    expect(new Set(GOLDEN_QA_CORPUS.map((item) => item.id)).size).toBe(11);
    for (const item of GOLDEN_QA_CORPUS) {
      expect(item.cards.length).toBeGreaterThan(0);
      expect(item.supportedEvidence.length).toBeGreaterThan(0);
      expect(item.forbiddenClaims.length).toBeGreaterThan(0);
      expect(item.polarity).toBeDefined();
      expect(item.timing.evidenceSupported).toBeTypeOf("boolean");
    }
  });
});
