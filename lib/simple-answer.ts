import { z } from "zod";

export const SimpleAnswerSchema = z.object({
  mode: z.enum(["forecast", "retrospective_event", "current_state", "advice"]),
  interpretation: z.string().min(1),
  cards: z.array(z.object({ pair: z.string().min(1), implication: z.string().min(1) })).min(1),
  answer: z.string().min(1),
  verdict: z.enum(["supported", "not_supported", "unresolved"]).default("unresolved"),
  timing: z.string().nullable().default(null),
  watchFor: z.string().nullable().default(null),
  practicalAction: z.string().nullable().default(null),
});

export type SimpleAnswer = z.infer<typeof SimpleAnswerSchema>;
