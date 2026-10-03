import { z } from "zod";

/**
 * The relation a pattern claims between the cards it names.
 *
 * The model declares the relation explicitly instead of the validator guessing it from
 * prose. That is what keeps geometry validation card-agnostic: the server receives card
 * names and a relation type, resolves names to positions, and checks the arithmetic. It
 * never needs to know that a card is a Tree, a Woman or a Paths.
 */
export const PATTERN_RELATIONS = [
  "combination",
  "sequence",
  "adjacent",
  "row",
  "column",
  "diagonal",
  "knight",
  "house",
  "surrounding",
] as const;

export type PatternRelation = (typeof PATTERN_RELATIONS)[number];

export const PatternSchema = z.object({
  cards: z.string().min(1),
  /** Defaults to `combination`, which asserts no geometric relation to verify. */
  relation: z.enum(PATTERN_RELATIONS).default("combination"),
  meaning: z.string().min(1),
});

export type Pattern = z.infer<typeof PatternSchema>;

/**
 * One output contract for every spread size.
 *
 * There is deliberately no per-spread field set. `positiveFactors`, `challenges`,
 * `development`, `housesAndMirrors` and `cards` were removed: on a five-card line they
 * made the model restate one conclusion five ways, and on a Grand Tableau they did not
 * add anything `reading` could not say directly. A large spread simply produces more
 * `patterns`; a small spread produces fewer. Presentation capacity scales with the
 * content, not with a schema the server preselects.
 */
export const ModelAnswerSchema = z.object({
  answer: z.string().min(1),
  reading: z.string().min(1),
  patterns: z.array(PatternSchema).optional(),
  timing: z.string().nullable().optional(),
});

export const SimpleAnswerSchema = z.object({
  answer: z.string().min(1),
  reading: z.string().min(1),
  patterns: z.array(PatternSchema).default([]),
  timing: z.string().nullable().default(null),
});

export const SimpleAnswerTransportSchema = z.object({
  answer: z.string().min(1),
  reading: z.string().min(1),
  patterns: z.array(z.unknown()).default([]),
  timing: z.unknown().optional(),
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
    answer.answer,
    answer.reading,
    ...answer.patterns.flatMap((pattern) => [pattern.cards, pattern.meaning]),
    answer.timing || "",
  ].join("\n");
  const violation = INTERNAL_REFERENCE_PATTERNS.find((pattern) => pattern.test(prose));
  return violation?.source || null;
}

export function renderSimpleAnswer(answer: SimpleAnswer): string {
  const patterns = answer.patterns.length
    ? `\n\n## Patterns\n${answer.patterns.map((pattern) => `- **${pattern.cards}**: ${pattern.meaning}`).join("\n")}`
    : "";
  const timing = answer.timing ? `\n\n## Timing\n${answer.timing}` : "";
  return `## Answer\n${answer.answer}\n\n## Reading\n${answer.reading}${patterns}${timing}`;
}