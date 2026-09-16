import { z } from "zod";
import { generateText, Output, type LanguageModel } from "ai";

export const QuestionFrameSchema = z.object({
  domain: z.enum(["relocation", "health", "career", "love", "love_sexual", "money", "home", "travel", "general"]),
  subject: z.string().nullable(),
  counterparty: z.string().nullable(),
  predicate: z.string().min(1),
  intent: z.enum(["future_outcome", "retrospective_event", "current_state", "advice", "timing", "description"]),
  mode: z.enum(["forecast", "retrospective_event", "advice"]),
  timeframe: z.object({ value: z.number().positive(), unit: z.enum(["day", "week", "month", "year"]) }).nullable(),
  language: z.string().min(2).max(12),
  confidence: z.number().min(0).max(1),
});

export type QuestionFrame = z.infer<typeof QuestionFrameSchema>;

export async function parseQuestionFrame(question: string, model: LanguageModel, signal?: AbortSignal): Promise<QuestionFrame> {
  const result = await generateText({
    model,
    abortSignal: signal,
    maxOutputTokens: 240,
    system: "Parse the user's question only. Return the requested structured object. Detect whether it asks about a future outcome, a past/retrospective event, current state, or advice. Detect sexual/relationship predicates without relying on fixed keywords. Do not infer an answer, card meaning, polarity, or outside facts. Preserve ambiguity.",
    prompt: `Parse this question into the schema exactly:\n\n${question}`,
    output: Output.object({ schema: QuestionFrameSchema }),
  });
  if (!result.output) throw new Error("Question frame was not generated");
  return result.output;
}
