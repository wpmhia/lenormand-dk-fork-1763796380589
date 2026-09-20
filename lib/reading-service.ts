import { generateText, Output, type LanguageModel } from "ai";
import type { ReadingContext } from "@/lib/reading-context";
import { renderSimpleAnswer, SimpleAnswerSchema } from "@/lib/simple-answer";
import type { ValidationIssue } from "@/lib/reading-validator";

export type ReadingServiceResult =
  | { ok: true; reading: string }
  | { ok: false; reason: "empty-output" | "schema-mismatch"; issues: ValidationIssue[] };

export interface ReadingServiceOptions {
  context: ReadingContext;
  model: LanguageModel;
  system: string;
  prompt: string;
  cardCount: number;
  maxTokens: number;
  initialTimeoutMs: number;
  repairTimeoutMs?: number;
  deadlineAt?: number;
  signal?: AbortSignal;
}

export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const result = await generateOnce(options, options.prompt, options.initialTimeoutMs);
  if (result.kind === "empty") return { ok: false, reason: "empty-output", issues: [] };
  if (result.kind === "valid") return { ok: true, reading: renderSimpleAnswer(result.answer) };

  const repairMs = Math.min(
    options.repairTimeoutMs ?? 0,
    Math.max(0, (options.deadlineAt ?? Number.POSITIVE_INFINITY) - Date.now()),
  );
  if (repairMs < 1_000 || !result.raw.trim()) {
    return { ok: false, reason: "schema-mismatch", issues: [schemaIssue(result.error)] };
  }

  const repairPrompt = `${options.prompt}\n\nThe previous model response was malformed or did not match the required object. Repair it once. Return only valid JSON matching the exact object contract; preserve its useful content and do not add commentary.\n\nPrevious response:\n${result.raw.slice(0, 16_000)}`;
  const repaired = await generateOnce(options, repairPrompt, repairMs);
  if (repaired.kind === "valid") return { ok: true, reading: renderSimpleAnswer(repaired.answer) };
  if (repaired.kind === "empty") return { ok: false, reason: "empty-output", issues: [] };
  return { ok: false, reason: "schema-mismatch", issues: [schemaIssue(repaired.error)] };
}

type GenerationAttempt =
  | { kind: "empty" }
  | { kind: "valid"; answer: ReturnType<typeof SimpleAnswerSchema.parse> }
  | { kind: "invalid"; raw: string; error: unknown };

async function generateOnce(options: ReadingServiceOptions, prompt: string, timeoutMs: number): Promise<GenerationAttempt> {
  try {
    const result = await generateText({
      model: options.model,
      system: options.system,
      prompt,
      output: Output.json(),
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      maxOutputTokens: options.maxTokens,
      maxRetries: 0,
      abortSignal: options.signal,
      timeout: { totalMs: timeoutMs },
    });
    if (!result.output) return { kind: "empty" };
    const parsed = SimpleAnswerSchema.safeParse(result.output);
    return parsed.success
      ? { kind: "valid", answer: parsed.data }
      : { kind: "invalid", raw: result.text || JSON.stringify(result.output), error: parsed.error };
  } catch (error) {
    const raw = isMalformedObjectError(error) ? error.text || "" : "";
    if (isMalformedObjectError(error)) return { kind: "invalid", raw, error };
    throw error;
  }
}

function isMalformedObjectError(error: unknown): error is Error & { text?: string } {
  return Boolean(error && typeof error === "object" && (error as { name?: string }).name === "AI_NoObjectGeneratedError");
}

function schemaIssue(error: unknown): ValidationIssue {
  return {
    type: "missing_section",
    message: `SimpleAnswer JSON did not match the transport schema: ${error instanceof Error ? error.message : String(error)}`,
  };
}
