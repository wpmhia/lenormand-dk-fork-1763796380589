import { generateText, Output, type LanguageModel } from "ai";
import type { ReadingContext } from "@/lib/reading-context";
import {
  getStructuredReadingSchema,
  renderStructuredReading,
  validateStructuredReading,
  isBlockingStructuredIssue,
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
  model: LanguageModel;
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
  const closingEvidenceInstruction = context.spreadId === "sentence-3" || context.spreadId === "sentence-5"
    ? `For this sentence spread, prediction.evidenceIds must include "pair-${context.cards.length - 1}-${context.cards.length}" and "card-${context.cards.length}".`
    : "";
  const requiredPairIds = context.spreadId === "sentence-3" || context.spreadId === "sentence-5"
    ? context.adjacentPairs
      .filter((pair) => pair.indexB === pair.indexA + 1)
      .map((pair) => `pair-${pair.indexA + 1}-${pair.indexB + 1}`)
      .join(", ")
    : "";
  const structuredEvidenceInstruction = requiredPairIds
    ? `For this spread, evidence[].evidenceIds must include exactly these adjacent pair IDs: ${requiredPairIds}.`
    : "";
  const initialPrompt = `${prompt}\n\nReturn only the requested structured object. Every evidence item must cite an evidence ID that appears in the deterministic evidence pack. Do not create evidence IDs. ${structuredEvidenceInstruction} ${closingEvidenceInstruction}`;

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

  const finalize = (output: unknown): { text: string; issues: ValidationIssue[] } => {
    const structuredOutput = output as Parameters<typeof renderStructuredReading>[0];
    const canonicalOutput = context.layout.type === "single"
      ? structuredOutput
      : withCanonicalPredictionTiming(structuredOutput as Exclude<typeof structuredOutput, never>, canonicalTiming);
    const text = normalizeMarkdown(renderStructuredReading(canonicalOutput, context.spreadId));
    const structuralIssues = validateStructuredReading(canonicalOutput, context);
    const warnings = structuralIssues.filter((issue) => !isBlockingStructuredIssue(issue));
    if (warnings.length > 0) {
      console.warn("reading-service: non-blocking semantic warnings", {
        warnings: warnings.map((issue) => ({ code: issue.code ?? issue.type, type: issue.type, message: issue.message })),
      });
    }
    const outputIssues = validateReadingOutput(text, context.cards.map((card) => card.id), context.spreadId, {
      text: canonicalTiming,
      evidence: context.timingEvidence,
    }, false);
    return {
      text,
      issues: [
        ...outputIssues.issues.filter(isCriticalIssue),
        ...structuralIssues.filter(isBlockingStructuredIssue),
      ],
    };
  };

  const logValidation = (phase: "initial" | "repair", attempt: number, finalized: { issues: ValidationIssue[] }) => {
    const logger = finalized.issues.length === 0 ? console.info : console.error;
    logger("reading-service: validation disposition", {
      phase,
      attempt,
      repairAttempted: phase === "repair",
      finalDisposition: finalized.issues.length === 0 ? "accepted" : "rejected",
      issues: finalized.issues.map((issue) => ({
        code: issue.code ?? issue.type,
        type: issue.type,
        message: issue.message,
      })),
    });
  };

  const initial = await generate(system, initialTimeoutMs, 1, initialPrompt);
  if (!initial.output) return { ok: false, reason: "empty-output", issues: [] };
  let finalized = finalize(initial.output);
  if (finalized.issues.length > 0) {
    logValidation("initial", 1, finalized);
    console.error("reading-service: initial structured output rejected", {
      spreadId: context.spreadId,
      issues: finalized.issues.map((issue) => ({ type: issue.type, message: issue.message })),
    });
  }
  if (finalized.issues.length === 0) {
    logValidation("initial", 1, finalized);
    return { ok: true, reading: finalized.text };
  }

  const repair = await generate(
    `${system}\n\nVALIDATION OVERRIDE: Return only an object conforming to the supplied structured schema; do not emit Markdown headings. Preserve every explicit question subject exactly throughout the repaired interpretation, evidence implications, and prediction; never replace it with Man, Woman, he, or she. The object must include prediction fields development, evidenceIds, timing, watchFor, and practicalAction. ${structuredEvidenceInstruction} ${closingEvidenceInstruction} Correct exactly the listed validation failures without weakening the evidence or hierarchy rules.`,
    repairTimeoutMs,
    0,
    `${prompt}\n\nValidation failures (type: actionable message):\n${finalized.issues.map((issue) => `- ${issue.type}: ${issue.message}`).join("\n")}\n${structuredEvidenceInstruction}\n${closingEvidenceInstruction}\nReturn the complete structured object, including every required prediction field. Correct exactly these failures.`,
  );
  if (!repair.output) {
    logValidation("repair", 2, finalized);
    return { ok: false, reason: "structured-output-empty", issues: finalized.issues };
  }
  finalized = finalize(repair.output);
  logValidation("repair", 2, finalized);
  if (finalized.issues.length > 0) {
    console.error("reading-service: repaired structured output rejected", {
      spreadId: context.spreadId,
      issues: finalized.issues.map((issue) => ({ type: issue.type, message: issue.message })),
    });
  }
  return finalized.issues.length === 0
    ? { ok: true, reading: finalized.text }
    : { ok: false, reason: "validation", issues: finalized.issues };
}
