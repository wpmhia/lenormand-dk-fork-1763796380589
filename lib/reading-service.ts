import { generateText, type LanguageModel } from "ai";
import { SimpleAnswerSchema, renderSimpleAnswer } from "@/lib/simple-answer";

/**
 * DeepSeek thinking mode is always on for readings. It is fixed in code, not read from the
 * environment, so a stale override cannot silently switch it off in production. Reasoning
 * tokens share `maxOutputTokens` with the JSON body; prompt-builder reserves room for them.
 */
export const READING_THINKING = { type: "enabled" as const };
export const READING_REASONING_EFFORT = "high" as const;

export type ReadingServiceResult =
  | { ok: true; reading: string }
  | { ok: false; reason: "empty-output" | "invalid-output" };

export interface ReadingServiceOptions {
  model: LanguageModel;
  system: string;
  prompt: string;
  maxTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
}

/** One model call, one parse path: the text must be a JSON object matching the answer schema. */
export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const result = await generateText({
    model: options.model,
    system: options.system,
    prompt: options.prompt,
    providerOptions: { deepseek: { thinking: READING_THINKING, reasoningEffort: READING_REASONING_EFFORT } },
    maxOutputTokens: options.maxTokens,
    maxRetries: 0,
    abortSignal: options.signal,
    timeout: { totalMs: options.timeoutMs },
  });

  const raw = (result.text ?? "").trim();
  if (!raw) return { ok: false, reason: "empty-output" };

  const parsed = parseAnswer(raw);
  if (!parsed) return { ok: false, reason: "invalid-output" };
  return { ok: true, reading: renderSimpleAnswer(parsed) };
}

/** Parses the model's JSON object. Markdown fences are removed once; nothing else is recovered. */
function parseAnswer(raw: string) {
  const unfenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let json: unknown;
  try {
    json = JSON.parse(unfenced);
  } catch {
    return null;
  }
  const answer = SimpleAnswerSchema.safeParse(json);
  return answer.success ? answer.data : null;
}
