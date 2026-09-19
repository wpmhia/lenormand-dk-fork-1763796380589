import { generateText, Output, type LanguageModel } from "ai";
import type { ReadingContext } from "@/lib/reading-context";
import {
  getStructuredReadingSchema,
  normalizeStructuredEvidence,
  renderStructuredReading,
  validateStructuredReading,
  isBlockingStructuredIssue,
  withCanonicalPredictionTiming,
} from "@/lib/structured-reading";
import { buildPredictionTimingLine } from "@/lib/timing";
import { SimpleAnswerSchema, type SimpleAnswer } from "@/lib/simple-answer";
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
  deadlineAt?: number;
}

function adaptSimpleAnswer(answer: SimpleAnswer, context: ReadingContext): Record<string, unknown> {
  const evidence = answer.cards.map((card) => ({ ...card, evidenceIds: [] as string[] }));
  const verdictPrefix = answer.verdict === "not_supported"
    ? "The cards do not support this outcome. "
    : answer.verdict === "supported"
      ? "The cards support this outcome. "
      : "The outcome remains unresolved. ";
  if (answer.mode === "forecast") {
    return {
      mode: "forecast",
      interpretation: answer.interpretation,
      evidence,
      prediction: {
        development: `${verdictPrefix}${answer.answer}`,
        evidenceIds: [],
        timing: answer.timing || "Not clearly shown by these cards.",
        watchFor: answer.watchFor,
        practicalAction: answer.practicalAction,
      },
    };
  }
  if (answer.mode === "advice") {
    return { mode: "advice", interpretation: answer.interpretation, evidence, practicalGuidance: answer.answer, guidanceEvidenceIds: [] };
  }
  return {
    mode: answer.mode,
    interpretation: answer.interpretation,
    evidence,
    conclusion: {
      verdict: answer.verdict || "unresolved",
      statement: answer.answer,
      evidenceIds: [],
    },
  };
}

export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const { context, model, system, prompt, cardCount, maxTokens, initialTimeoutMs, repairTimeoutMs, signal } = options;
  const readingMode = context.semanticQuestion?.mode === "retrospective_event" || context.semanticQuestion?.mode === "current_state" || context.semanticQuestion?.mode === "advice" ? context.semanticQuestion.mode : "forecast";
  const useSimpleAnswer = context.spreadId !== "grand-tableau" && context.layout.type !== "single";
  const schema = useSimpleAnswer ? SimpleAnswerSchema : getStructuredReadingSchema(context.spreadId, readingMode);
  const canonicalTiming = buildPredictionTimingLine(context.timingEvidence, context.question, context.semanticQuestion);
  const closingEvidenceInstruction = "The server will attach evidence provenance after generation.";
  const structuredEvidenceInstruction = "";
  const modeInstruction = readingMode === "advice"
    ? "This is advice mode. Return mode=advice with interpretation, evidence, and practicalGuidance. Do not return prediction or timing fields."
    : readingMode !== "forecast"
    ? `This is ${readingMode} mode. Return mode=${readingMode} and a conclusion object with verdict and statement. Do not return prediction or timing fields.`
    : "Return mode=forecast with the required prediction fields.";
  const initialPrompt = `${prompt}\n\n${modeInstruction} Return valid JSON only. Return only the requested structured object. Evidence provenance is normalized server-side; do not create or manage internal evidence IDs. ${structuredEvidenceInstruction} ${closingEvidenceInstruction}`;

  const generate = (instruction: string, timeout: number, retries: number, promptOverride = prompt) => generateText({
    model,
    system: instruction,
    prompt: promptOverride,
    output: Output.object({ schema }),
    providerOptions: { deepseek: { thinking: { type: "disabled" } } },
    ...(retries > 0 ? { temperature: 0.2 } : {}),
    maxOutputTokens: maxTokens,
    maxRetries: retries,
    abortSignal: signal,
    timeout: { totalMs: timeout },
  });

  const finalize = (output: unknown): { text: string; issues: ValidationIssue[] } => {
    const structuredOutput = normalizeStructuredEvidence(
      (useSimpleAnswer ? adaptSimpleAnswer(output as SimpleAnswer, context) : output) as Parameters<typeof renderStructuredReading>[0],
      context,
    ) as Parameters<typeof renderStructuredReading>[0];
    const canonicalOutput = context.layout.type === "single"
      ? structuredOutput
      : withCanonicalPredictionTiming(structuredOutput as Exclude<typeof structuredOutput, never>, canonicalTiming);
    const text = normalizeMarkdown(renderStructuredReading(canonicalOutput, context.spreadId));
    const structuralIssues = validateStructuredReading(canonicalOutput, context);
    const warnings = structuralIssues.filter((issue) => !isBlockingStructuredIssue(issue));
    if (warnings.length > 0) {
      console.info("reading-service: non-blocking semantic warnings", {
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

  const remainingRepairMs = options.deadlineAt
    ? Math.max(1_000, options.deadlineAt - Date.now() - 4_000)
    : repairTimeoutMs;
  const repair = await generate(
    `${system}\n\nVALIDATION OVERRIDE: Return only an object conforming to the supplied structured schema; do not emit Markdown headings. Preserve every explicit question subject exactly throughout the repaired interpretation, evidence implications, and ${readingMode === "retrospective_event" ? "conclusion" : "prediction"}; never replace it with Man, Woman, he, or she. ${modeInstruction} ${structuredEvidenceInstruction} ${closingEvidenceInstruction} Correct exactly the listed validation failures without weakening the evidence or hierarchy rules.`,
    remainingRepairMs,
    0,
    `${prompt}\n\nValidation failures (type: actionable message):\n${finalized.issues.map((issue) => `- ${issue.type}: ${issue.message}`).join("\n")}\n${modeInstruction}\n${structuredEvidenceInstruction}\n${closingEvidenceInstruction}\nReturn the complete structured object. Correct exactly these failures.`,
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
