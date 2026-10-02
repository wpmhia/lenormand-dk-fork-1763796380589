import { z } from "zod";
import { generateText, type LanguageModel } from "ai";
import { extractJsonObject } from "@/lib/model-json";

export const QuestionFrameSchema = z.object({
  domain: z.enum(["relocation", "health", "career", "love", "love_sexual", "money", "home", "travel", "general"]),
  subject: z.string().nullable(),
  counterparty: z.string().nullable(),
  predicate: z.string().min(1),
  mode: z.enum(["forecast", "retrospective_event", "current_state", "advice"]),
  timeframe: z.object({ value: z.number().positive(), unit: z.enum(["day", "week", "month", "year"]) }).nullable(),
});

export type QuestionFrame = z.infer<typeof QuestionFrameSchema>;

const QUESTION_FRAME_CONTRACT = `Return exactly one JSON object and nothing else, with these fields:
{
  "domain": "relocation" | "health" | "career" | "love" | "love_sexual" | "money" | "home" | "travel" | "general",
  "subject": string | null,
  "counterparty": string | null,
  "predicate": string,
  "mode": "forecast" | "retrospective_event" | "current_state" | "advice",
  "timeframe": { "value": number, "unit": "day" | "week" | "month" | "year" } | null
}
- Use null for subject, counterparty, or timeframe when the question does not specify them.
- Do not rename, add, or remove fields. Do not use Markdown fences.`;

export async function parseQuestionFrame(question: string, model: LanguageModel, signal?: AbortSignal): Promise<QuestionFrame> {
  const result = await generateText({
    model,
    abortSignal: signal,
    maxOutputTokens: 240,
    providerOptions: { deepseek: { thinking: { type: "disabled" } } },
    system: `Parse the user's question only. Identify the grammatical subject/actor, counterparty/target, and exact predicate including meaningful qualifiers such as style, intensity, emotional or sexual quality. Do not generalize a qualified predicate into a broader action. Do not infer an answer, card meaning, polarity, or outside facts. Preserve ambiguity.\n\n${QUESTION_FRAME_CONTRACT}`,
    prompt: `Parse this question into the object above exactly.\n\n${question}`,
  });

  const object = extractJsonObject(result.text ?? "");
  if (!object) throw new Error("Question frame was not generated");
  return QuestionFrameSchema.parse(object);
}

