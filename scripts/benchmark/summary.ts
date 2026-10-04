export interface HumanReview {
  caseId: string;
  scores: Record<string, number>;
  spatialAccuracy: string;
  narrativePatternConflict: string;
  drawnCardAccuracy: string;
  automatedFlagReview: string;
  validatorMissedFact: string;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * p;
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower);
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function fraction(numerator: number, denominator: number): number | null {
  return denominator ? numerator / denominator : null;
}

function scoresFor(records: any[], key: string): number[] {
  return records
    .map((record) => record.judge?.value?.scores?.[key])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5);
}

function groupSummary(records: any[]) {
  const attempted = records.length;
  const providerErrors = records.filter((record) => record.run?.status === "provider_error").length;
  const completedRequests = records.filter((record) => record.run?.status === "ok");
  const evaluations = completedRequests.map((record) => record.evaluation).filter(Boolean);
  const parseFailures = evaluations.filter((evaluation) => !evaluation.parsed).length;
  const schemaFailures = evaluations.filter((evaluation) => evaluation.parsed && !evaluation.schemaValid).length;
  const finishFailures = evaluations.filter((evaluation) => evaluation.outputFailure?.startsWith("finish_reason_")).length;
  const appServeCandidates = evaluations.filter((evaluation) => evaluation.schemaValid).length;
  const appServeFailures = evaluations.filter((evaluation) => evaluation.schemaValid && evaluation.appWouldServe === false).length;
  const factIssueRecords = evaluations.filter((evaluation) =>
    evaluation.inventedCards?.length || evaluation.unknownCardLabels?.length || evaluation.falseGeometry?.length,
  );
  const explicitProseCardRecords = evaluations.filter((evaluation) => evaluation.proseCardMentions?.length);
  const validatorErrors = completedRequests.filter((record) => record.validatorError).length;
  const mainLatencies = records.map((record) => record.run?.latencyMs).filter((value: unknown): value is number => typeof value === "number" && Number.isFinite(value));
  const successfulLatencies = completedRequests.map((record) => record.run.latencyMs).filter(Number.isFinite);
  const judgeLatencies = records.map((record) => record.judge?.latencyMs).filter((value: unknown): value is number => typeof value === "number");
  const scoreDimensions = ["directness", "relevance", "depth", "spreadSynthesis", "calibration", "naturalness", "languageConsistency"];
  const judgeScores = Object.fromEntries(scoreDimensions.map((key) => [key, average(scoresFor(records, key))]));
  const judgeConflictCases = records.filter((record) => (record.judge?.value?.patternTextConflicts?.length ?? 0) > 0).length;
  const judgeUnsupportedSpatialCases = records.filter((record) => (record.judge?.value?.unsupportedSpatialClaims?.length ?? 0) > 0).length;
  const judgeUndrawnClaimsCases = records.filter((record) => (record.judge?.value?.undrawnCardClaims?.length ?? 0) > 0).length;
  const inputTokens = records.reduce((sum, record) => sum + (record.usage?.inputTokens ?? 0), 0);
  const outputTokens = records.reduce((sum, record) => sum + (record.usage?.outputTokens ?? 0), 0);
  const reasoningTokens = records.reduce((sum, record) => sum + (record.usage?.reasoningTokens ?? 0), 0);
  const cacheHits = records.reduce((sum, record) => sum + (record.usage?.cacheHitTokens ?? 0), 0);
  const judgeInputTokens = records.reduce((sum, record) => sum + (record.judge?.usage?.inputTokens ?? 0), 0);
  const judgeOutputTokens = records.reduce((sum, record) => sum + (record.judge?.usage?.outputTokens ?? 0), 0);
  const judgeReasoningTokens = records.reduce((sum, record) => sum + (record.judge?.usage?.reasoningTokens ?? 0), 0);
  const judgeCacheHits = records.reduce((sum, record) => sum + (record.judge?.usage?.cacheHitTokens ?? 0), 0);
  const mainCost = records.reduce((sum, record) => sum + (record.costUsd ?? 0), 0);
  const judgeCost = records.reduce((sum, record) => sum + (record.judge?.costUsd ?? 0), 0);
  const judgeCompleted = records.filter((record) => record.judge && !record.judge.error && record.judge.value).length;

  return {
    attempted,
    completedRequests: completedRequests.length,
    providerErrors,
    providerErrorRate: fraction(providerErrors, attempted),
    parseFailures,
    schemaFailures,
    finishReasonFailures: finishFailures,
    nonStopFinishRate: fraction(finishFailures, evaluations.length),
    modelContractFailureRate: fraction(parseFailures + schemaFailures, attempted),
    generationFailureCases: providerErrors + parseFailures + schemaFailures,
    generationFailureRate: fraction(providerErrors + parseFailures + schemaFailures, attempted),
    appServingFailureRate: fraction(appServeFailures, appServeCandidates),
    // These are machine-detected DeepSeek output defects, not validator implementation errors.
    modelFactualIssueCases: factIssueRecords.length,
    modelFactualIssueRate: fraction(factIssueRecords.length, evaluations.length),
    explicitUndrawnProseCases: explicitProseCardRecords.length,
    appFatalGroundingRate: fraction(explicitProseCardRecords.length, evaluations.length),
    validatorExceptions: validatorErrors,
    validatorExceptionRate: fraction(validatorErrors, completedRequests.length),
    factualFindings: {
      undrawnOrRecognisedCardMentions: evaluations.reduce((sum, evaluation) => sum + (evaluation.inventedCards?.length ?? 0), 0),
      unknownStructuredCardNames: evaluations.reduce((sum, evaluation) => sum + (evaluation.unknownCardLabels?.length ?? 0), 0),
      falseGeometryPatterns: evaluations.reduce((sum, evaluation) => sum + (evaluation.falseGeometry?.length ?? 0), 0),
      falseHousePatterns: evaluations.reduce((sum, evaluation) => sum + (evaluation.falseGeometry?.filter((item: any) => item.relation === "house").length ?? 0), 0),
      patternsDropped: evaluations.reduce((sum, evaluation) =>
        sum + (evaluation.inventedCards?.filter((item: any) => item.field === "pattern").length ?? 0)
          + (evaluation.unknownCardLabels?.length ?? 0)
          + (evaluation.falseGeometry?.length ?? 0), 0),
    },
    latencyMs: {
      generation: { p50: percentile(mainLatencies, 0.5), p95: percentile(mainLatencies, 0.95), mean: average(mainLatencies) },
      successfulGeneration: { p50: percentile(successfulLatencies, 0.5), p95: percentile(successfulLatencies, 0.95), mean: average(successfulLatencies) },
      judge: { p50: percentile(judgeLatencies, 0.5), p95: percentile(judgeLatencies, 0.95), mean: average(judgeLatencies) },
    },
    tokens: {
      generation: { input: inputTokens, output: outputTokens, reasoning: reasoningTokens, cacheHitInput: cacheHits, total: inputTokens + outputTokens },
      judge: { input: judgeInputTokens, output: judgeOutputTokens, reasoning: judgeReasoningTokens, cacheHitInput: judgeCacheHits, total: judgeInputTokens + judgeOutputTokens },
      combined: { input: inputTokens + judgeInputTokens, output: outputTokens + judgeOutputTokens, total: inputTokens + outputTokens + judgeInputTokens + judgeOutputTokens },
    },
    costUsd: { generation: mainCost, judge: judgeCost, combined: mainCost + judgeCost },
    judge: {
      completed: judgeCompleted,
      failures: records.filter((record) => record.judge?.error || (record.judge && !record.judge.value)).length,
      meanScores: judgeScores,
      patternTextConflictRate: fraction(judgeConflictCases, judgeCompleted),
      unsupportedSpatialClaimRate: fraction(judgeUnsupportedSpatialCases, judgeCompleted),
      undrawnCardClaimRate: fraction(judgeUndrawnClaimsCases, judgeCompleted),
      interpretation: "LLM judge is a screening signal, not ground truth; see human review annotations.",
    },
  };
}

export function parseHumanReviewTSV(contents: string): HumanReview[] {
  const [headerLine, ...body] = contents.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = headerLine.split("\t");
  return body.map((line) => {
    const cells = line.split("\t");
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    const scoreColumns = ["directness", "relevance", "depth", "spreadSynthesis", "calibration", "naturalness", "languageConsistency"];
    const candidates: [string, number][] = scoreColumns.map((key) => [key, Number(row[`${key}_1to5`])]);
    const scores = Object.fromEntries(candidates.filter((item): item is [string, number] =>
      Number.isInteger(item[1]) && item[1] >= 1 && item[1] <= 5,
    )) as Record<string, number>;
    return {
      caseId: row.caseId ?? "",
      scores,
      spatialAccuracy: row.spatialAccuracy_yes_no_unsure ?? "",
      narrativePatternConflict: row.narrativePatternConflict_yes_no_unsure ?? "",
      drawnCardAccuracy: row.drawnCardAccuracy_yes_no_unsure ?? "",
      automatedFlagReview: row.automatedFalsePositive_yes_no_unsure ?? "",
      validatorMissedFact: row.validatorMissedFinding_yes_no_unsure ?? "",
    };
  });
}

export function humanSummary(reviews: HumanReview[]) {
  const reviewable = reviews.filter((review) => review.caseId);
  const dimensions = ["directness", "relevance", "depth", "spreadSynthesis", "calibration", "naturalness", "languageConsistency"];
  const yesRate = (values: string[]) => fraction(values.filter((value) => value.toLowerCase() === "yes").length, values.filter((value) => /^(yes|no|unsure)$/i.test(value)).length);
  return {
    reviewedCases: reviewable.length,
    meanScores: Object.fromEntries(dimensions.map((dimension) => [dimension, average(reviewable.flatMap((review) => review.scores[dimension] === undefined ? [] : [review.scores[dimension]]))])),
    spatialInaccuracyRate: yesRate(reviewable.map((review) => review.spatialAccuracy)),
    narrativePatternConflictRate: yesRate(reviewable.map((review) => review.narrativePatternConflict)),
    drawnCardInaccuracyRate: yesRate(reviewable.map((review) => review.drawnCardAccuracy)),
    automatedFlagFalsePositiveRate: yesRate(reviewable.map((review) => review.automatedFlagReview)),
    validatorMissedFactRate: yesRate(reviewable.map((review) => review.validatorMissedFact)),
  };
}

export function summarize(records: any[], reviews?: HumanReview[], manifest?: Record<string, any>) {
  const bySpread = Object.fromEntries([...new Set(records.map((record) => record.case.spreadId))]
    .sort((a, b) => records.find((record) => record.case.spreadId === a).case.cardCount - records.find((record) => record.case.spreadId === b).case.cardCount)
    .map((spreadId) => [spreadId, groupSummary(records.filter((record) => record.case.spreadId === spreadId))]));
  const summary: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    total: groupSummary(records),
    bySpread,
    run: {
      seed: manifest?.seed ?? null,
      planned: manifest?.plannedCases ?? records.length,
      recorded: records.length,
      model: manifest?.model ?? records[0]?.run?.responseModel ?? null,
      judgeModel: manifest?.judgeModel ?? null,
      judgeEnabled: manifest?.judgeEnabled ?? records.some((record) => record.judge !== null),
    },
  };
  if (reviews) summary.humanReview = humanSummary(reviews);
  return summary;
}
