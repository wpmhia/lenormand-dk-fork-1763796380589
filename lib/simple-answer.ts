import { z } from "zod";

export const SimpleAnswerSchema = z.object({
  mode: z.enum(["forecast", "retrospective_event", "current_state", "advice"]),
  directAnswer: z.string().min(1),
  interpretation: z.string().min(1),
  cards: z.array(z.object({ combination: z.string().min(1), meaning: z.string().min(1) })).default([]),
  timing: z.string().nullable().default(null),
});

export type SimpleAnswer = z.infer<typeof SimpleAnswerSchema>;
