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
 * Output capacity scales with the spread.
 *
 * A five-card line carries one linear story. Asking the model to also fill
 * positiveFactors, challenges, keyPatterns, development, cards and housesAndMirrors does
 * not produce a richer reading; it produces the same conclusion six times over, which
 * the model then averages into something blander and less committed than any one pass.
 * Each spread size is therefore offered only the fields that can carry something the
 * prose cannot already say.
 *
 * `cards` is gone entirely: it duplicated `keyPatterns`, which already binds a named
 * combination to its meaning.
 */
export type OutputTier = "compact" | "standard" | "full";

export function outputTierFor(cardCount: number): OutputTier {
  if (cardCount <= 5) return "compact";
  if (cardCount <= 9) return "standard";
  return "full";
}

/**
 * Everything past `directAnswer`/`interpretation` is optional at the model boundary so a
 * field the model did not fill degrades to `[]` or `null` instead of failing the reading.
 */
export const ModelAnswerSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  keyPatterns: z.array(KeyPatternSchema).optional(),
  positiveFactors: z.array(z.string()).optional(),
  challenges: z.array(z.string()).optional(),
  development: z.string().nullable().optional(),
  timing: z.string().nullable().optional(),
  housesAndMirrors: z.array(HouseMirrorSchema).optional(),
});

export const SimpleAnswerSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  keyPatterns: z.array(KeyPatternSchema).default([]),
  positiveFactors: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  development: z.string().nullable().default(null),
  timing: z.string().nullable().default(null),
  housesAndMirrors: z.array(HouseMirrorSchema).default([]),
});

export const SimpleAnswerTransportSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  keyPatterns: z.array(z.unknown()).default([]),
  positiveFactors: z.array(z.unknown()).default([]),
  challenges: z.array(z.unknown()).default([]),
  development: z.unknown().optional(),
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
    ...answer.keyPatterns.flatMap((pattern) => [pattern.cards, pattern.meaning]),
    ...answer.positiveFactors,
    ...answer.challenges,
    answer.development || "",
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

/**
 * Renders only the sections that carry content. Because the request contract already
 * withholds fields a small spread cannot fill, a five-card reading renders as Answer,
 * Reading, Key patterns and Timing, with no empty headings and no restated conclusion.
 */
export function renderSimpleAnswer(answer: SimpleAnswer): string {
  const patterns = section(
    "Key patterns",
    answer.keyPatterns.map((pattern) => `**${pattern.cards}**: ${pattern.meaning}`),
  );
  const positives = section("Positive factors", answer.positiveFactors);
  const challenges = section("Challenges", answer.challenges);
  const development = answer.development ? `\n\n## Development\n${answer.development}` : "";
  const timing = answer.timing ? `\n\n## Timing\n${answer.timing}` : "";
  const houses = section(
    "Houses and mirrors",
    answer.housesAndMirrors.map((item) => `**${item.house}**: ${item.meaning}`),
  );
  return `## Answer\n${answer.directAnswer}\n\n## Reading\n${answer.interpretation}${patterns}${positives}${challenges}${development}${timing}${houses}`;
}