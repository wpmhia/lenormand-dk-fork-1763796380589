import { z } from "zod";

/**
 * The model's answer: a direct answer and a coherent reading. The server renders it with the
 * same Markdown sections that saved readings already use.
 */
export const SimpleAnswerSchema = z.object({
  answer: z.string().trim().min(1),
  reading: z.string().trim().min(1),
});

export type SimpleAnswer = z.infer<typeof SimpleAnswerSchema>;

export function renderSimpleAnswer(answer: SimpleAnswer): string {
  return `## Answer\n${answer.answer}\n\n## Reading\n${answer.reading}`;
}

/**
 * Whether a generated reading is complete enough to persist. `aiReading` is only set after a
 * successful server-validated generation, so a non-empty body is the signal.
 */
export function isReadingComplete(reading: string): boolean {
  return reading.trim().length > 0;
}
