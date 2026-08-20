import { z } from "zod";

export const StructuredReadingSchema = z.object({
  interpretation: z.string().min(1),
  evidence: z.array(z.object({
    pair: z.string().min(1),
    evidenceIds: z.array(z.string().min(1)).min(1),
    implication: z.string().min(1),
  })).min(1),
  prediction: z.object({
    development: z.string().min(1),
    timing: z.string().min(1),
    watchFor: z.string().nullable(),
    practicalAction: z.string().nullable(),
  }),
});

export type StructuredReading = z.infer<typeof StructuredReadingSchema>;

export function renderStructuredReading(reading: StructuredReading): string {
  const evidence = reading.evidence
    .map((item) => `- **${item.pair}**: ${item.implication}`)
    .join("\n");
  const optional = [
    reading.prediction.watchFor ? `**Watch for:** ${reading.prediction.watchFor}` : null,
    reading.prediction.practicalAction ? `**Practical action:** ${reading.prediction.practicalAction}` : null,
  ].filter(Boolean).join("\n");

  return [
    "## Interpretation",
    reading.interpretation,
    "",
    "## Cards",
    evidence,
    "",
    "## Prediction",
    `**Most likely development:** ${reading.prediction.development}`,
    `**Likely timing:** ${reading.prediction.timing}`,
    optional,
  ].filter(Boolean).join("\n");
}
