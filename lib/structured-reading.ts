import { z } from "zod";
import type { ReadingContext } from "@/lib/reading-context";
import { getCardEvidenceId, getGrandTableauPromptedHouseIds, getPairEvidenceId } from "@/lib/lenormand-evidence";

const PredictionSchema = z.object({
  development: z.string().min(1),
  timing: z.string().min(1),
  watchFor: z.string().nullable(),
  practicalAction: z.string().nullable(),
});

const EvidenceSchema = z.array(z.object({
  pair: z.string().min(1),
  evidenceIds: z.array(z.string().min(1)).min(1),
  implication: z.string().min(1),
})).min(1);

const MultiCardReadingSchema = z.object({
  interpretation: z.string().min(1),
  evidence: EvidenceSchema,
  prediction: PredictionSchema,
});

const SingleCardReadingSchema = z.object({
  interpretation: z.string().min(1),
});

const GrandTableauReadingSchema = MultiCardReadingSchema.extend({
  housesAndMirrors: z.array(z.object({
    house: z.string().min(1),
    meaning: z.string().min(1),
  })).min(1),
});

/** Kept as the default multi-card schema for callers that do not have a spread id. */
export const StructuredReadingSchema = MultiCardReadingSchema;
export const SingleCardStructuredReadingSchema = SingleCardReadingSchema;
export const GrandTableauStructuredReadingSchema = GrandTableauReadingSchema;

export type StructuredReading = z.infer<typeof MultiCardReadingSchema>;
export type SingleCardReading = z.infer<typeof SingleCardReadingSchema>;
export type GrandTableauReading = z.infer<typeof GrandTableauReadingSchema>;

export function getStructuredReadingSchema(spreadId: string) {
  if (spreadId === "single-card" || spreadId === "daily-card") return SingleCardReadingSchema;
  if (spreadId === "grand-tableau") return GrandTableauReadingSchema;
  return MultiCardReadingSchema;
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
  type: "ungrounded_evidence";
  message: string;
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
    for (const houseId of getGrandTableauPromptedHouseIds(context.layout)) {
      allowedEvidenceIds.add(`house-${houseId}`);
    }
  }
  const citedIds = new Set(multiReading.evidence.flatMap((item) => item.evidenceIds));

  for (const id of citedIds) {
    if (!allowedEvidenceIds.has(id)) {
      issues.push({ type: "ungrounded_evidence", message: `Structured evidence cites unknown evidence ID: "${id}"` });
    }
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
