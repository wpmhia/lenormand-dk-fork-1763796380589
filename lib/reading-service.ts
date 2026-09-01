import { generateText, Output } from "ai";
import type { ReadingContext } from "@/lib/reading-context";
import {
  getStructuredReadingSchema,
  renderStructuredReading,
  validateStructuredReading,
  withCanonicalPredictionTiming,
} from "@/lib/structured-reading";
import { buildPredictionTimingLine } from "@/lib/timing";
import {
  isCriticalIssue,
  normalizeMarkdown,
  validateReadingOutput,
  type ValidationIssue,
} from "@/lib/reading-validator";

export type ReadingServiceResult =
  | { ok: true; reading: string }
  | { ok: false; reason: "empty-output" | "structured-output-empty" | "validation"; issues: ValidationIssue[] };

interface ReadingServiceOptions {
  context: ReadingContext;
  model: any;
  system: string;
  prompt: string;
  cardCount: number;
  maxTokens: number;
  initialTimeoutMs: number;
  repairTimeoutMs: number;
  signal?: AbortSignal;
}

export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const { context, model, system, prompt, cardCount, maxTokens, initialTimeoutMs, repairTimeoutMs, signal } = options;
  const schema = getStructuredReadingSchema(context.spreadId);
  const canonicalTiming = buildPredictionTimingLine(context.timingEvidence);

  const generate = (instruction: string, timeout: number, retries: number, promptOverride = prompt) => generateText({
    model,
    system: instruction,
    prompt: promptOverride,
    output: Output.object({ schema }),
    temperature: retries > 0 ? 0.2 : 0.1,
    maxOutputTokens: maxTokens,
    maxRetries: retries,
    abortSignal: signal,
    timeout: { totalMs: timeout },
  });

  const finalize = (output: any): { text: string; issues: ValidationIssue[] } => {
    const structuredOutput = context.layout.type === "single"
      ? output
      : withCanonicalPredictionTiming(output, canonicalTiming);
    const text = normalizeMarkdown(renderStructuredReading(structuredOutput, context.spreadId));
    const structuralIssues = validateStructuredReading(structuredOutput, context);
    const outputIssues = validateReadingOutput(text, context.cards.map((card) => card.id), context.spreadId, {
      text: canonicalTiming,
      evidence: context.timingEvidence,
    }, false);
    return {
      text,
      issues: [
        ...outputIssues.issues.filter(isCriticalIssue),
        ...structuralIssues,
      ],
    };
  };

  const initial = await generate(system, initialTimeoutMs, 1);
  if (!initial.output) return { ok: false, reason: "empty-output", issues: [] };
  let finalized = finalize(initial.output);
  if (finalized.issues.length === 0) return { ok: true, reading: finalized.text };

  const repair = await generate(
    `${system}\n\nVALIDATION OVERRIDE: Return only an object conforming to the supplied structured schema; do not emit Markdown headings. Correct exactly the listed validation failures.`,
    repairTimeoutMs,
    0,
    `${prompt}\n\nValidation failures:\n${finalized.issues.map((issue) => `- ${issue.message}`).join("\n")}\nCorrect exactly these failures.`,
  );
  if (!repair.output) return { ok: false, reason: "structured-output-empty", issues: finalized.issues };
  finalized = finalize(repair.output);
  return finalized.issues.length === 0
    ? { ok: true, reading: finalized.text }
    : { ok: false, reason: "validation", issues: finalized.issues };
}
