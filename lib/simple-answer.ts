import { z } from "zod";

export const SimpleAnswerSchema = z.object({
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  cards: z.array(z.object({ combination: z.string().min(1), meaning: z.string().min(1) })).default([]),
  timing: z.string().nullable().default(null),
  housesAndMirrors: z.array(z.object({ house: z.string(), meaning: z.string() })).default([]),
});

export type SimpleAnswer = z.infer<typeof SimpleAnswerSchema>;
