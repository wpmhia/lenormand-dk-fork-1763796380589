import { z } from "zod";
import { generateText, Output, type LanguageModel } from "ai";

export const QuestionFrameSchema = z.object({
  domain: z.enum(["relocation", "health", "career", "love", "love_sexual", "money", "home", "travel", "general"]),
  subject: z.string().nullable(),
  counterparty: z.string().nullable(),
  predicate: z.string().min(1),
  mode: z.enum(["forecast", "retrospective_event", "advice"]),
  timeframe: z.object({ value: z.number().positive(), unit: z.enum(["day", "week", "month", "year"]) }).nullable(),
});

export type QuestionFrame = z.infer<typeof QuestionFrameSchema>;

export async function parseQuestionFrame(question: string, model: LanguageModel, signal?: AbortSignal): Promise<QuestionFrame> {
  const result = await generateText({
    model,
    abortSignal: signal,
    maxOutputTokens: 240,
    system: "Parse the user's question only. Return the requested structured object with one canonical mode: forecast, retrospective_event, or advice. Detect sexual/relationship predicates without relying on fixed keywords. Do not infer an answer, card meaning, polarity, or outside facts. Preserve ambiguity.",
    prompt: `Parse this question into the schema exactly:\n\n${question}`,
    output: Output.object({ schema: QuestionFrameSchema }),
  });
  if (!result.output) throw new Error("Question frame was not generated");
  return result.output;
}
