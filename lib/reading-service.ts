import { generateText, type LanguageModel } from "ai";
import { SimpleAnswerSchema, renderSimpleAnswer, type SimpleAnswer } from "@/lib/simple-answer";

/**
 * Shared model service for primary readings and follow-ups. Both paths use the same provider
 * settings, timeout handling and empty-output diagnostics; only the accepted output format
 * differs (JSON answer vs. plain prose).
 *
 * Thinking mode is always off for the built-in interpretation. It is fixed in code, not read
 * from the environment, so a stale override cannot silently switch it on in production. The
 * reading quality lives in the supplied prompt and card geometry, not in paid reasoning tokens.
 * Without reasoning, the whole `maxOutputTokens` budget is available to the body.
 */
export const READING_THINKING = { type: "disabled" as const };

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
  /** Correlates the generation log with the route log. Never derived from user content. */
  requestId?: string;
}

export type ReadingServiceOptions = Omit<GenerationOptions, "logLabel">;

/** One model call under the shared settings. The returned body is non-empty trimmed text. */
export async function generateModelText(options: GenerationOptions): Promise<GenerationResult> {
  const startedAt = Date.now();
  let result;
  try {
    result = await generateText({
      model: options.model,
      system: options.system,
      prompt: options.prompt,
      providerOptions: { deepseek: { thinking: READING_THINKING } },
      maxOutputTokens: options.maxTokens,
      maxRetries: 0,
      abortSignal: options.signal,
      timeout: { totalMs: options.timeoutMs },
    });
  } catch (error) {
    logGeneration(options, { outcome: "error", elapsedMs: Date.now() - startedAt, error: errorClass(error) });
    throw error;
  }

  const text = (result.text ?? "").trim();
  logGeneration(options, {
    outcome: text ? "ok" : "empty",
    elapsedMs: Date.now() - startedAt,
    finishReason: result.finishReason,
    usage: result.usage,
  });
  if (!text) {
    logEmptyOutput(options.logLabel, result, Date.now() - startedAt, options.maxTokens);
    return { ok: false, reason: "empty-output" };
  }
  return { ok: true, text };
}

type GenerationUsage = {
  inputTokens?: number;
  outputTokens?: number;
  outputTokenDetails?: { textTokens?: number; reasoningTokens?: number };
};

/**
 * One structured line per DeepSeek generation: request ID, timing against the configured limit,
 * finish reason and token usage. The prompt, question, cards, output text and credentials are
 * never included; only the error class name is kept for failures.
 */
export function logGeneration(
  options: Pick<GenerationOptions, "logLabel" | "requestId" | "timeoutMs" | "maxTokens">,
  fields: {
    outcome: "ok" | "empty" | "error";
    elapsedMs: number;
    finishReason?: string;
    usage?: GenerationUsage;
    error?: string;
  },
): void {
  console.info("deepseek generation", {
    label: options.logLabel,
    requestId: options.requestId,
    model: READING_MODEL_LABEL,
    outcome: fields.outcome,
    elapsedMs: fields.elapsedMs,
    timeoutMs: options.timeoutMs,
    maxTokens: options.maxTokens,
    finishReason: fields.finishReason,
    inputTokens: fields.usage?.inputTokens,
    outputTokens: fields.usage?.outputTokens,
    reasoningTokens: fields.usage?.outputTokenDetails?.reasoningTokens,
    textTokens: fields.usage?.outputTokenDetails?.textTokens,
    error: fields.error,
  });
}

const READING_MODEL_LABEL = process.env.DEEPSEEK_MODEL || "deepseek-flash";

/** The error's class name only. Messages can echo request details, so they are not logged. */
function errorClass(error: unknown): string {
  return error instanceof Error ? error.name || "Error" : "UnknownError";
}

/** The reading path: one model call, one parse path. The text must be a JSON answer object. */
export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const generated = await generateModelText({ ...options, logLabel: "reading" });
  if (!generated.ok) return generated;
  const parsed = parseAnswer(generated.text);
  if (!parsed.ok) {
    logInvalidOutput(parsed.diagnosis, generated.text.length);
    return { ok: false, reason: "invalid-output" };
  }
  return { ok: true, reading: renderSimpleAnswer(parsed.answer) };
}

/**
 * Logs why a non-empty output was rejected: the failure class, the output length and the names
 * of invalid schema fields. Field names come from our own schema, never from the model text, so
 * the raw output, the question and the cards are never logged.
 */
function logInvalidOutput(diagnosis: ParseDiagnosis, outputLength: number): void {
  console.error("reading: invalid model output", {
    cause: diagnosis.cause,
    outputLength,
    invalidFields: diagnosis.cause === "schema" ? diagnosis.invalidFields : undefined,
  });
}

type ParseDiagnosis = { cause: "json-parse" } | { cause: "schema"; invalidFields: string[] };

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
function parseAnswer(
  raw: string,
): { ok: true; answer: SimpleAnswer } | { ok: false; diagnosis: ParseDiagnosis } {
  const unfenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let json: unknown;
  try {
    json = JSON.parse(unfenced);
  } catch {
    return { ok: false, diagnosis: { cause: "json-parse" } };
  }
  const answer = SimpleAnswerSchema.safeParse(json);
  if (answer.success) return { ok: true, answer: answer.data };
  const invalidFields = [...new Set(answer.error.issues.map((issue) => String(issue.path[0] ?? "(root)")))];
  return { ok: false, diagnosis: { cause: "schema", invalidFields } };
}
