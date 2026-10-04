import { describe, expect, it } from "vitest";
import { humanSummary, parseHumanReviewTSV, summarize } from "../summary";

describe("benchmark summaries", () => {
  it("reports p50/p95, generation errors, validator exceptions and model findings separately", () => {
    const records = [
      {
        case: { id: "a", seed: 1, spreadId: "sentence-3", cardCount: 3 },
        run: { status: "ok", latencyMs: 100, finishReason: "stop", responseModel: "deepseek-flash" },
        usage: { inputTokens: 10, outputTokens: 5, reasoningTokens: 0, cacheHitTokens: 0 }, costUsd: 0.01,
        evaluation: { parsed: true, schemaValid: true, outputFailure: null, inventedCards: [], unknownCardLabels: [], falseGeometry: [], proseCardMentions: [] },
        validatorError: null,
        judge: null,
      },
      {
        case: { id: "b", seed: 2, spreadId: "sentence-3", cardCount: 3 },
        run: { status: "ok", latencyMs: 500, finishReason: "stop", responseModel: "deepseek-flash" },
        usage: { inputTokens: 20, outputTokens: 10, reasoningTokens: 2, cacheHitTokens: 5 }, costUsd: 0.02,
        evaluation: { parsed: true, schemaValid: true, outputFailure: null, inventedCards: [{ field: "pattern" }], unknownCardLabels: [], falseGeometry: [{ relation: "house" }], proseCardMentions: [] },
        validatorError: "simulated checker error",
        judge: null,
      },
      {
        case: { id: "c", seed: 3, spreadId: "sentence-3", cardCount: 3 },
        run: { status: "provider_error", latencyMs: 800, finishReason: "error", responseModel: null },
        usage: {}, costUsd: null, evaluation: null, validatorError: null, judge: null,
      },
    ];
    const total = summarize(records).total as any;
    expect(total.latencyMs.generation.p50).toBe(500);
    expect(total.latencyMs.generation.p95).toBe(770);
    expect(total.latencyMs.successfulGeneration.p50).toBe(300);
    expect(total.latencyMs.successfulGeneration.p95).toBe(480);
    expect(total.providerErrors).toBe(1);
    expect(total.modelFactualIssueCases).toBe(1);
    expect(total.validatorExceptions).toBe(1);
    expect(total.factualFindings.falseHousePatterns).toBe(1);
  });

  it("imports human numeric scores and defect annotations from the review TSV", () => {
    const tsv = [
      "caseId\tdirectness_1to5\tdepth_1to5\tspatialAccuracy_yes_no_unsure\tnarrativePatternConflict_yes_no_unsure\tdrawnCardAccuracy_yes_no_unsure\tautomatedFalsePositive_yes_no_unsure\tvalidatorMissedFinding_yes_no_unsure",
      "x-001\t4\t5\tyes\tno\tno\tyes\tno",
    ].join("\n");
    const reviews = parseHumanReviewTSV(tsv);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].scores).toMatchObject({ directness: 4, depth: 5 });
    expect(humanSummary(reviews)).toMatchObject({
      reviewedCases: 1,
      spatialInaccuracyRate: 1,
      narrativePatternConflictRate: 0,
      automatedFlagFalsePositiveRate: 1,
      validatorMissedFactRate: 0,
    });
  });

  it("distinguishes truncated judge JSON from provider errors", () => {
    const records = ["truncated_json", "provider_error", "invalid_json"].map((failureKind, index) => ({
      case: { id: `case-${index}`, spreadId: "grand-tableau", cardCount: 36 },
      run: { status: "ok", latencyMs: 100, responseModel: "deepseek-flash" },
      usage: { inputTokens: 10, outputTokens: 5 },
      evaluation: { parsed: true, schemaValid: true, inventedCards: [], unknownCardLabels: [], falseGeometry: [], proseCardMentions: [] },
      validatorError: null,
      judge: { failureKind, error: failureKind === "provider_error" ? "TimeoutError" : null, value: null, latencyMs: 50 },
    }));
    const judge = (summarize(records).total as any).judge;
    expect(judge.failuresByKind).toEqual({ provider_error: 1, truncated_json: 1, invalid_json: 1 });
  });
});
