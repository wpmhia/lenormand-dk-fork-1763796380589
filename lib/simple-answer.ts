import { z } from "zod";

export const HouseMirrorSchema = z.object({
  house: z.string().min(1),
  meaning: z.string().min(1),
});

export type HouseMirror = z.infer<typeof HouseMirrorSchema>;

export const KeyPatternSchema = z.object({
  cards: z.string().min(1),
  meaning: z.string().min(1),
});

export type KeyPattern = z.infer<typeof KeyPatternSchema>;

/**
 * Presentation capacity for the model, not a reading methodology.
 *
 * A 36-card Grand Tableau cannot be carried honestly by `interpretation` alone: the
 * model compresses and the reading collapses into one dense paragraph. `positiveFactors`,
 * `challenges`, `keyPatterns` and `development` give it somewhere to put the converging
 * and conflicting lines it is supposed to weigh. The server preselects none of it.
 *
 * Everything here is optional at the model boundary so a missing field degrades to `[]`
 * or `null` rather than failing the whole reading.
 */
export const ModelAnswerSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  positiveFactors: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  keyPatterns: z.array(KeyPatternSchema).optional(),
  development: z.string().nullable().optional(),
  cards: z.array(
    z.object({
      combination: z.string().min(1),
      meaning: z.string().min(1),
    }),
  ).optional(),
  timing: z.string().nullable().optional(),
  housesAndMirrors: z.array(HouseMirrorSchema).optional(),
});

export const SimpleAnswerSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  positiveFactors: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  keyPatterns: z.array(KeyPatternSchema).default([]),
  development: z.string().nullable().default(null),
  cards: z.array(z.object({ combination: z.string().min(1), meaning: z.string().min(1) })).default([]),
  timing: z.string().nullable().default(null),
  housesAndMirrors: z.array(HouseMirrorSchema).default([]),
});

export const SimpleAnswerTransportSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  positiveFactors: z.array(z.unknown()).default([]),
  challenges: z.array(z.unknown()).default([]),
  keyPatterns: z.array(z.unknown()).default([]),
  development: z.unknown().optional(),
  cards: z.array(z.unknown()).default([]),
  timing: z.unknown().optional(),
  housesAndMirrors: z.array(z.unknown()).default([]),
});

export type SimpleAnswer = z.infer<typeof SimpleAnswerSchema>;

const INTERNAL_REFERENCE_PATTERNS: RegExp[] = [
  /\b(?:position|positie)\s*[-#]?\s*\d+\b/i,
  /\bcard-\d+\b/i,
  /\bpair-\d+(?:-\d+)?\b/i,
  /\b(?:evidence|bewijs)\s*(?:id|identifier|nummer|reference|referentie)\b/i,
  /\b(?:weight|gewicht)\s*[-#]?\s*\d+\b/i,
];

export function findProseInvariantViolation(answer: SimpleAnswer): string | null {
  const prose = [
    answer.directAnswer,
    answer.interpretation,
    ...answer.positiveFactors,
    ...answer.challenges,
    ...answer.keyPatterns.flatMap((pattern) => [pattern.cards, pattern.meaning]),
    answer.development || "",
    ...answer.cards.flatMap((card) => [card.combination, card.meaning]),
    answer.timing || "",
    ...answer.housesAndMirrors.flatMap((item) => [item.house, item.meaning]),
  ].join("\n");
  const violation = INTERNAL_REFERENCE_PATTERNS.find((pattern) => pattern.test(prose));
  return violation?.source || null;
}

function section(title: string, items: string[]): string {
  if (items.length === 0) return "";
  return `\n\n## ${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

export function renderSimpleAnswer(answer: SimpleAnswer): string {
  const positives = section("Positive factors", answer.positiveFactors);
  const challenges = section("Challenges", answer.challenges);
  const patterns = section(
    "Key patterns",
    answer.keyPatterns.map((pattern) => `**${pattern.cards}**: ${pattern.meaning}`),
  );
  const development = answer.development ? `\n\n## Development\n${answer.development}` : "";
  const cards = section("Key combinations", answer.cards.map((card) => `**${card.combination}**: ${card.meaning}`));
  const timing = answer.timing ? `\n\n## Timing\n${answer.timing}` : "";
  const houses = section(
    "Houses and mirrors",
    answer.housesAndMirrors.map((item) => `**${item.house}**: ${item.meaning}`),
  );
  return `## Answer\n${answer.directAnswer}\n\n## Reading\n${answer.interpretation}${positives}${challenges}${patterns}${development}${cards}${timing}${houses}`;
}