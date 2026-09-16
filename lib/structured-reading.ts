import { z } from "zod";
import type { ReadingContext } from "@/lib/reading-context";
import { getCardEvidenceId, getGrandTableauPromptedHouseIds, getPairEvidenceId } from "@/lib/lenormand-evidence";
import { validateEntityEvidenceBinding, validatePredictionSemantics, validateQuestionSubjectPreservation } from "@/lib/semantic-grounding";
import { buildClaimPlan } from "@/lib/claim-plan";

const PredictionSchema = z.object({
  development: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
  timing: z.string().min(1),
  watchFor: z.string().nullable(),
  practicalAction: z.string().nullable(),
});

const RetrospectiveConclusionSchema = z.object({
  verdict: z.enum(["supported", "not_supported", "unresolved"]),
  statement: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
});

const EvidenceSchema = z.array(z.object({
  pair: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
  implication: z.string().min(1),
})).min(1);

const ForecastReadingSchema = z.object({
  mode: z.literal("forecast").default("forecast"),
  interpretation: z.string().min(1),
  evidence: EvidenceSchema,
  prediction: PredictionSchema,
});

const RetrospectiveReadingSchema = z.object({
  mode: z.literal("retrospective_event"),
  interpretation: z.string().min(1),
  evidence: EvidenceSchema,
  conclusion: RetrospectiveConclusionSchema,
});
const CurrentStateReadingSchema = z.object({
  mode: z.literal("current_state"),
  interpretation: z.string().min(1),
  evidence: EvidenceSchema,
  conclusion: RetrospectiveConclusionSchema,
});
const AdviceReadingSchema = z.object({
  mode: z.literal("advice"),
  interpretation: z.string().min(1),
  evidence: EvidenceSchema,
  practicalGuidance: z.string().min(1),
  guidanceEvidenceIds: z.array(z.string().min(1)).min(1),
});

const MultiCardReadingSchema = z.discriminatedUnion("mode", [ForecastReadingSchema, RetrospectiveReadingSchema, CurrentStateReadingSchema, AdviceReadingSchema]);

const SingleCardReadingSchema = z.object({
  interpretation: z.string().min(1),
});

const GrandTableauForecastReadingSchema = ForecastReadingSchema.extend({
  housesAndMirrors: z.array(z.object({
    house: z.string().min(1),
    meaning: z.string().min(1),
  })).min(1),
});
const GrandTableauRetrospectiveReadingSchema = RetrospectiveReadingSchema.extend({
  housesAndMirrors: z.array(z.object({ house: z.string().min(1), meaning: z.string().min(1) })).min(1),
});
const GrandTableauCurrentStateReadingSchema = CurrentStateReadingSchema.extend({
  housesAndMirrors: z.array(z.object({ house: z.string().min(1), meaning: z.string().min(1) })).min(1),
});
const GrandTableauAdviceReadingSchema = AdviceReadingSchema.extend({
  housesAndMirrors: z.array(z.object({ house: z.string().min(1), meaning: z.string().min(1) })).min(1),
});
const GrandTableauReadingSchema = z.discriminatedUnion("mode", [GrandTableauForecastReadingSchema, GrandTableauRetrospectiveReadingSchema, GrandTableauCurrentStateReadingSchema, GrandTableauAdviceReadingSchema]);

/** Kept as the default multi-card schema for callers that do not have a spread id. */
export const StructuredReadingSchema = MultiCardReadingSchema;
export const SingleCardStructuredReadingSchema = SingleCardReadingSchema;
export const GrandTableauStructuredReadingSchema = GrandTableauReadingSchema;

export type StructuredReading = z.infer<typeof MultiCardReadingSchema>;
export type SingleCardReading = z.infer<typeof SingleCardReadingSchema>;
export type GrandTableauReading = z.infer<typeof GrandTableauReadingSchema>;

export interface CompatibilityAnswer {
  interpretation: string;
  cards: Array<{ pair: string; implication: string }>;
  answer: string;
  timing?: string;
  watchFor?: string | null;
  practicalAction?: string | null;
}

export function toCompatibilityAnswer(reading: StructuredReading | SingleCardReading | GrandTableauReading): CompatibilityAnswer {
  if ("practicalGuidance" in reading) {
    return { interpretation: reading.interpretation, cards: reading.evidence, answer: reading.practicalGuidance };
  }
  if ("conclusion" in reading) {
    return { interpretation: reading.interpretation, cards: reading.evidence, answer: reading.conclusion.statement };
  }
  if ("prediction" in reading) {
    return { interpretation: reading.interpretation, cards: reading.evidence, answer: reading.prediction.development, timing: reading.prediction.timing, watchFor: reading.prediction.watchFor, practicalAction: reading.prediction.practicalAction };
  }
  return { interpretation: reading.interpretation, cards: [], answer: reading.interpretation };
}

export function getStructuredReadingSchema(spreadId: string, mode: "forecast" | "retrospective_event" | "current_state" | "advice" = "forecast") {
  if (spreadId === "single-card" || spreadId === "daily-card") return SingleCardReadingSchema;
  if (spreadId === "grand-tableau") return mode === "retrospective_event" ? GrandTableauRetrospectiveReadingSchema : mode === "current_state" ? GrandTableauCurrentStateReadingSchema : mode === "advice" ? GrandTableauAdviceReadingSchema : GrandTableauForecastReadingSchema;
  return mode === "retrospective_event" ? RetrospectiveReadingSchema : mode === "current_state" ? CurrentStateReadingSchema : mode === "advice" ? AdviceReadingSchema : ForecastReadingSchema;
}

function isGrandTableauReading(reading: StructuredReading | GrandTableauReading): reading is GrandTableauReading {
  return "housesAndMirrors" in reading;
}

export function renderStructuredReading(
  reading: StructuredReading | SingleCardReading | GrandTableauReading,
  spreadId = "sentence-3",
): string {
  if (spreadId === "single-card" || spreadId === "daily-card") {
    return ["## Interpretation", reading.interpretation].join("\n");
  }

  const multiReading = reading as StructuredReading | GrandTableauReading;
  const compatibilityAnswer = toCompatibilityAnswer(reading);
  const evidence = compatibilityAnswer.cards
    .map((item) => `- **${item.pair}**: ${item.implication}`)
    .join("\n");
  if ("conclusion" in multiReading) {
    const housesAndMirrors = isGrandTableauReading(multiReading)
      ? ["## Houses and mirrors", multiReading.housesAndMirrors.map((item) => `- **${item.house}**: ${item.meaning}`).join("\n"), ""]
      : [];
    return ["## Interpretation", compatibilityAnswer.interpretation, "", ...housesAndMirrors, "## Cards", evidence, "", "## Conclusion", `**Card indication:** ${multiReading.conclusion.verdict.replace("_", " ")}.`, compatibilityAnswer.answer].join("\n");
  }
  if ("practicalGuidance" in multiReading) {
    const houses = isGrandTableauReading(multiReading)
      ? ["## Houses and mirrors", multiReading.housesAndMirrors.map((item) => `- **${item.house}**: ${item.meaning}`).join("\n"), ""]
      : [];
    return ["## Interpretation", compatibilityAnswer.interpretation, "", ...houses, "## Cards", evidence, "", "## Practical guidance", compatibilityAnswer.answer].filter(Boolean).join("\n");
  }
  const optional = [
    multiReading.prediction.watchFor ? `**Watch for:** ${multiReading.prediction.watchFor}` : null,
    multiReading.prediction.practicalAction ? `**Practical action:** ${multiReading.prediction.practicalAction}` : null,
  ].filter(Boolean).join("\n");

  const housesAndMirrors = isGrandTableauReading(multiReading)
    ? ["## Houses and mirrors", multiReading.housesAndMirrors.map((item) => `- **${item.house}**: ${item.meaning}`).join("\n"), ""]
    : [];

  return [
    "## Interpretation",
    compatibilityAnswer.interpretation,
    "",
    ...housesAndMirrors,
    "## Cards",
    evidence,
    "",
    "## Prediction",
    `**Most likely development:** ${multiReading.prediction.development}`,
    `**Likely timing:** ${multiReading.prediction.timing}`,
    optional,
  ].filter(Boolean).join("\n");
}

export interface StructuredReadingIssue {
  type: "ungrounded_evidence" | "ungrounded_prediction" | "semantic_grounding";
  message: string;
  code?: string;
}

export function isBlockingStructuredIssue(issue: StructuredReadingIssue): boolean {
  // Semantic disagreement is diagnostic only. Rendering must not turn a
  // debatable interpretation into an HTTP 5xx; only structural/provenance
  // failures that make the object unusable remain blocking here.
  return issue.type === "ungrounded_evidence" || issue.type === "ungrounded_prediction";
}

const IMPORTANT_GT_TOPICS = new Set(["heart", "love", "money", "health", "work", "home"]);

/** Validates claims that are lost when structured output is rendered to Markdown. */
export function validateStructuredReading(
  reading: StructuredReading | SingleCardReading | GrandTableauReading,
  context: ReadingContext,
): StructuredReadingIssue[] {
  if (context.layout.type === "single") return [];

  const multiReading = reading as StructuredReading | GrandTableauReading;
  const issues: StructuredReadingIssue[] = [];
  const allowedEvidenceIds = new Set([
    ...context.cards.map((_, index) => getCardEvidenceId(index)),
    ...context.adjacentPairs.map((pair) => getPairEvidenceId(pair.indexA, pair.indexB)),
  ]);
  if (context.layout.type === "grand-tableau") {
    for (let position = 1; position <= context.cards.length; position++) {
      allowedEvidenceIds.add(`position-${position}`);
    }
    for (const house of context.layout.houses) allowedEvidenceIds.add(`house-${house.houseCardId}`);
  }
  if ("conclusion" in multiReading) {
    const conclusionIds = new Set(multiReading.conclusion.evidenceIds);
    for (const id of conclusionIds) if (!allowedEvidenceIds.has(id)) issues.push({ type: "ungrounded_prediction", message: `Conclusion cites unknown evidence ID: "${id}"` });
    issues.push(...validateQuestionSubjectPreservation(multiReading.interpretation, context, "interpretation"));
    issues.push(...validateQuestionSubjectPreservation(multiReading.conclusion.statement, context, "prediction"));
    issues.push(...validateEntityEvidenceBinding(multiReading.conclusion.statement, new Set(multiReading.conclusion.evidenceIds), context));
    for (const item of multiReading.evidence) {
      for (const id of item.evidenceIds) if (!allowedEvidenceIds.has(id)) issues.push({ type: "ungrounded_evidence", message: `Structured evidence cites unknown evidence ID: "${id}"` });
      issues.push(...validateQuestionSubjectPreservation(item.implication, context, "card-commentary"));
      issues.push(...validateEntityEvidenceBinding(item.implication, new Set(item.evidenceIds), context));
    }
    return issues;
  }
  if ("practicalGuidance" in multiReading) {
    for (const id of multiReading.guidanceEvidenceIds) if (!allowedEvidenceIds.has(id)) issues.push({ type: "ungrounded_evidence", message: `Guidance cites unknown evidence ID: "${id}"` });
    issues.push(...validateQuestionSubjectPreservation(multiReading.interpretation, context, "interpretation"));
    issues.push(...validateQuestionSubjectPreservation(multiReading.practicalGuidance, context, "prediction"));
    for (const item of multiReading.evidence) {
      for (const id of item.evidenceIds) if (!allowedEvidenceIds.has(id)) issues.push({ type: "ungrounded_evidence", message: `Structured evidence cites unknown evidence ID: "${id}"` });
      issues.push(...validateQuestionSubjectPreservation(item.implication, context, "card-commentary"));
    }
    return issues;
  }
  const citedIds = new Set(multiReading.evidence.flatMap((item) => item.evidenceIds));
  const predictionEvidenceIds = new Set(multiReading.prediction.evidenceIds);

  for (const id of citedIds) {
    if (!allowedEvidenceIds.has(id)) {
      issues.push({ type: "ungrounded_evidence", message: `Structured evidence cites unknown evidence ID: "${id}"` });
    }
  }

  for (const id of predictionEvidenceIds) {
    if (!allowedEvidenceIds.has(id)) {
      issues.push({ type: "ungrounded_prediction", message: `Prediction cites unknown evidence ID: "${id}"` });
    }
  }

  if (context.spreadId === "sentence-3" || context.spreadId === "sentence-5") {
    const last = context.cards.length - 1;
    for (const id of [getPairEvidenceId(last - 1, last), getCardEvidenceId(last)]) {
      if (!predictionEvidenceIds.has(id)) {
        issues.push({ type: "ungrounded_prediction", message: `Prediction must cite closing evidence "${id}"` });
      }
    }
  }

  issues.push(...validatePredictionSemantics(multiReading.prediction.development, context, predictionEvidenceIds));
  issues.push(...validateQuestionSubjectPreservation(multiReading.interpretation, context, "interpretation"));
  issues.push(...validateQuestionSubjectPreservation(multiReading.prediction.development, context, "prediction"));
  issues.push(...validateEntityEvidenceBinding(multiReading.prediction.development, predictionEvidenceIds, context));
  for (const item of multiReading.evidence) {
    issues.push(...validatePredictionSemantics(item.implication, context, undefined, { validatePolarity: false, validateQuestionSpecificity: false, validateEpistemicCertainty: false }));
    issues.push(...validateQuestionSubjectPreservation(item.implication, context, "card-commentary"));
    issues.push(...validateEntityEvidenceBinding(item.implication, new Set(item.evidenceIds), context));
  }

  if (context.spreadId === "sentence-3" || context.spreadId === "sentence-5") {
    const requiredCount = context.spreadId === "sentence-3" ? 2 : 4;
    const requiredIds = context.adjacentPairs
      .filter((pair) => pair.indexB === pair.indexA + 1)
      .map((pair) => getPairEvidenceId(pair.indexA, pair.indexB));
    if (requiredIds.length !== requiredCount) {
      issues.push({ type: "ungrounded_evidence", message: `Deterministic pair contract expected ${requiredCount} adjacent pairs, found ${requiredIds.length}` });
    }
    for (const id of requiredIds) {
      if (!citedIds.has(id)) issues.push({ type: "ungrounded_evidence", message: `Structured evidence is missing required pair ID: "${id}"` });
    }
  }

  if (context.layout.type === "grand-tableau") {
    const houses = (multiReading as GrandTableauReading).housesAndMirrors;
    const grandLayout = context.layout;
    const requiredHouseIds = grandLayout.topicCards
      .filter((topic) => IMPORTANT_GT_TOPICS.has(topic.topic))
      .map((topic) => `house-${topic.cardId}`)
      .filter((id) => getGrandTableauPromptedHouseIds(grandLayout).has(Number(id.replace("house-", ""))));
    const houseText = houses.map((house) => `${house.house} ${house.meaning}`.toLowerCase()).join(" ");
    for (const id of requiredHouseIds) {
      const cardId = Number(id.replace("house-", ""));
      const house = grandLayout.houses.find((item) => item.houseCardId === cardId);
      if (!house || !houseText.includes(house.houseName.toLowerCase())) {
        issues.push({ type: "ungrounded_evidence", message: `Structured Grand Tableau output is missing required topic house: "${house?.houseName ?? id}"` });
      }
    }
    if (houses.length === 0) issues.push({ type: "ungrounded_evidence", message: "Structured Grand Tableau output must contain houses and mirrors" });
  }

  return issues;
}

export function withCanonicalPredictionTiming(
  reading: StructuredReading | SingleCardReading | GrandTableauReading,
  timing: string,
): StructuredReading | SingleCardReading | GrandTableauReading {
  if (!("prediction" in reading)) return reading;
  return { ...reading, prediction: { ...reading.prediction, timing } };
}
