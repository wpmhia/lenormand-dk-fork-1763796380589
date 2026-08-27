import { z } from "zod";

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
