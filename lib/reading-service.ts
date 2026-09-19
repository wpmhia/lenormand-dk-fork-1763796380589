import { generateText, Output, type LanguageModel } from "ai";
import type { ReadingContext } from "@/lib/reading-context";
import { renderSimpleAnswer, SimpleAnswerSchema } from "@/lib/simple-answer";
import type { ValidationIssue } from "@/lib/reading-validator";

export type ReadingServiceResult =
  | { ok: true; reading: string }
  | { ok: false; reason: "empty-output"; issues: ValidationIssue[] };

interface ReadingServiceOptions {
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
  const result = await generateText({
    model: options.model,
    system: options.system,
    prompt: options.prompt,
    output: Output.object({ schema: SimpleAnswerSchema }),
    providerOptions: { deepseek: { thinking: { type: "disabled" } } },
    maxOutputTokens: options.maxTokens,
    maxRetries: 1,
    abortSignal: options.signal,
    timeout: { totalMs: options.initialTimeoutMs },
  });

  if (!result.output) return { ok: false, reason: "empty-output", issues: [] };
  return { ok: true, reading: renderSimpleAnswer(result.output) };
}
