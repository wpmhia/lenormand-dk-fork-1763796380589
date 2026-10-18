import { generateText, type LanguageModel } from "ai";
import { SimpleAnswerSchema, renderSimpleAnswer } from "@/lib/simple-answer";

/**
 * Shared model service for primary readings and follow-ups. Both paths use the same provider
 * settings, timeout handling and empty-output diagnostics; only the accepted output format
 * differs (JSON answer vs. plain prose).
 *
 * DeepSeek thinking mode is always on. It is fixed in code, not read from the environment, so a
 * stale override cannot silently switch it off in production. Reasoning tokens share
 * `maxOutputTokens` with the body; prompt-builder sizes that budget for both.
 */
export const READING_THINKING = { type: "enabled" as const };
export const READING_REASONING_EFFORT = "low" as const;

export type GenerationResult =
  | { ok: true; text: string }
  | { ok: false; reason: "empty-output" };

export type ReadingServiceResult =
  | { ok: true; reading: string }
  | { ok: false; reason: "empty-output" | "invalid-output" };

export interface GenerationOptions {
  model: LanguageModel;
  system: string;
  prompt: string;
  maxTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
  logLabel: "reading" | "followup";
}

export type ReadingServiceOptions = Omit<GenerationOptions, "logLabel">;

/** One model call under the shared settings. The returned body is non-empty trimmed text. */
export async function generateModelText(options: GenerationOptions): Promise<GenerationResult> {
  const startedAt = Date.now();
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

  const text = (result.text ?? "").trim();
  if (!text) {
    logEmptyOutput(options.logLabel, result, Date.now() - startedAt, options.maxTokens);
    return { ok: false, reason: "empty-output" };
  }
  return { ok: true, text };
}

/** The reading path: one model call, one parse path. The text must be a JSON answer object. */
export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const generated = await generateModelText({ ...options, logLabel: "reading" });
  if (!generated.ok) return generated;
  const parsed = parseAnswer(generated.text);
  if (!parsed) return { ok: false, reason: "invalid-output" };
  return { ok: true, reading: renderSimpleAnswer(parsed) };
}

/**
 * Shared timeout classification. The SDK's total timeout raises AbortError just like a real
 * abort, so routes check the client's own signal first and use this for the remainder.
 */
export function isTimeoutError(error: { name?: string; message?: string }): boolean {
  return (
    error.name === "TimeoutError" ||
    error.name === "AbortError" ||
    Boolean(error.message && /abort|timeout|timed out/i.test(error.message))
  );
}

/**
 * Logs diagnostics for an empty response: token counts, finish reason and timing only. The
 * question, cards, reasoning text, raw output and credentials are never logged. A `length`
 * finish means the output budget was exhausted, which is the known cause; any other finish
 * reason leaves the cause unknown.
 */
function logEmptyOutput(
  label: "reading" | "followup",
  result: {
    finishReason: string;
    usage?: { outputTokens?: number; outputTokenDetails?: { textTokens?: number; reasoningTokens?: number } };
  },
  elapsedMs: number,
  maxTokens: number,
): void {
  console.error(`${label}: empty model output`, {
    cause: result.finishReason === "length" ? "output-budget-exhausted" : "unknown",
    finishReason: result.finishReason,
    maxTokens,
    outputTokens: result.usage?.outputTokens,
    reasoningTokens: result.usage?.outputTokenDetails?.reasoningTokens,
    textTokens: result.usage?.outputTokenDetails?.textTokens,
    elapsedMs,
  });
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
