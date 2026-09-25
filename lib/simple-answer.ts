import { z } from "zod";

export const HouseMirrorSchema = z.object({
  house: z.string().min(1),
  meaning: z.string().min(1),
});

export type HouseMirror = z.infer<typeof HouseMirrorSchema>;

export const SimpleAnswerSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  cards: z.array(z.object({ combination: z.string().min(1), meaning: z.string().min(1) })).default([]),
  timing: z.string().nullable().default(null),
  housesAndMirrors: z.array(HouseMirrorSchema).default([]),
});

export const SimpleAnswerTransportSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  cards: z.array(z.unknown()).default([]),
  timing: z.unknown().optional(),
  housesAndMirrors: z.array(z.unknown()).default([]),
});

export type SimpleAnswer = z.infer<typeof SimpleAnswerSchema>;

export function renderSimpleAnswer(answer: SimpleAnswer): string {
  const cards = answer.cards.length > 0
    ? answer.cards.map((card) => `- **${card.combination}**: ${card.meaning}`).join("\n")
    : "";
  const timing = answer.timing ? `\n\n## Timing\n${answer.timing}` : "";
  const houses = answer.housesAndMirrors.length > 0
    ? `\n\n## Houses and mirrors\n${answer.housesAndMirrors.map((item) => `- **${item.house}**: ${item.meaning}`).join("\n")}`
    : "";
  const cardsSection = cards ? `\n\n## Key combinations\n${cards}` : "";
  return `## Answer\n${answer.directAnswer}\n\n## Reading\n${answer.interpretation}${cardsSection}${timing}${houses}`;
}
