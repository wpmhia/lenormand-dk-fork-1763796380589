import { z } from "zod";
import type { ReadingContext } from "@/lib/reading-context";
import { getCardEvidenceId, getGrandTableauPromptedHouseIds, getPairEvidenceId } from "@/lib/lenormand-evidence";
import { validatePredictionSemantics, validateQuestionSubjectPreservation } from "@/lib/semantic-grounding";

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

const MultiCardReadingSchema = z.discriminatedUnion("mode", [ForecastReadingSchema, RetrospectiveReadingSchema]);

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
const GrandTableauReadingSchema = z.discriminatedUnion("mode", [GrandTableauForecastReadingSchema, GrandTableauRetrospectiveReadingSchema]);

/** Kept as the default multi-card schema for callers that do not have a spread id. */
export const StructuredReadingSchema = MultiCardReadingSchema;
export const SingleCardStructuredReadingSchema = SingleCardReadingSchema;
export const GrandTableauStructuredReadingSchema = GrandTableauReadingSchema;

export type StructuredReading = z.infer<typeof MultiCardReadingSchema>;
export type SingleCardReading = z.infer<typeof SingleCardReadingSchema>;
export type GrandTableauReading = z.infer<typeof GrandTableauReadingSchema>;

export function getStructuredReadingSchema(spreadId: string, mode: "forecast" | "retrospective_event" = "forecast") {
  if (spreadId === "single-card" || spreadId === "daily-card") return SingleCardReadingSchema;
  if (spreadId === "grand-tableau") return mode === "retrospective_event" ? GrandTableauRetrospectiveReadingSchema : GrandTableauForecastReadingSchema;
  return mode === "retrospective_event" ? RetrospectiveReadingSchema : ForecastReadingSchema;
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
  const evidence = multiReading.evidence
    .map((item) => `- **${item.pair}**: ${item.implication}`)
    .join("\n");
  if ("conclusion" in multiReading) {
    const housesAndMirrors = isGrandTableauReading(multiReading)
      ? ["## Houses and mirrors", multiReading.housesAndMirrors.map((item) => `- **${item.house}**: ${item.meaning}`).join("\n"), ""]
      : [];
    return ["## Interpretation", multiReading.interpretation, "", ...housesAndMirrors, "## Cards", evidence, "", "## Conclusion", `**Card indication:** ${multiReading.conclusion.verdict.replace("_", " ")}.`, multiReading.conclusion.statement].join("\n");
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
    multiReading.interpretation,
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
  if (issue.code === "unsupported_certainty") return false;
  if (issue.code === "unsupported_entity_binding" || issue.code === "subject_substitution") return true;
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
    for (const houseId of getGrandTableauPromptedHouseIds(context.layout)) allowedEvidenceIds.add(`house-${houseId}`);
  }
  if ("conclusion" in multiReading) {
    const conclusionIds = new Set(multiReading.conclusion.evidenceIds);
    for (const id of conclusionIds) if (!allowedEvidenceIds.has(id)) issues.push({ type: "ungrounded_prediction", message: `Conclusion cites unknown evidence ID: "${id}"` });
    issues.push(...validateQuestionSubjectPreservation(multiReading.interpretation, context, "interpretation"));
    issues.push(...validateQuestionSubjectPreservation(multiReading.conclusion.statement, context, "prediction"));
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
  for (const item of multiReading.evidence) {
    issues.push(...validatePredictionSemantics(item.implication, context, undefined, { validatePolarity: false, validateQuestionSpecificity: false, validateEpistemicCertainty: false }));
    issues.push(...validateQuestionSubjectPreservation(item.implication, context, "card-commentary"));
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
