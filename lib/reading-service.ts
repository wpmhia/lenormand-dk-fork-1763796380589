import { generateText, type LanguageModel } from "ai";
import { z } from "zod";
import type { ReadingContext } from "@/lib/reading-context";
import {
  renderSimpleAnswer,
  ModelAnswerSchema,
  SimpleAnswerSchema,
  SimpleAnswerTransportSchema,
  findProseInvariantViolation,
  type Pattern,
  type SimpleAnswer,
} from "@/lib/simple-answer";
import { extractJsonObject } from "@/lib/model-json";
import { findInventedCards, findUnresolvedCardLabels } from "@/lib/invented-cards";

/** A problem found while generating or parsing one reading. */
export interface ValidationIssue {
  type: "invented_card" | "structured-output";
  message: string;
  code?: string;
  /** The answer field the problem was found in, when known. */
  field?: string;
  /** The exact matched fragment, so a fabrication can be told from ordinary prose. */
  fragment?: string;
}

export type ReadingServiceResult =
  | { ok: true; reading: string; droppedPatterns: string[] }
  | { ok: false; reason: "empty-output" | "schema-mismatch"; issues: ValidationIssue[]; diagnostics?: StructuredOutputDiagnostics };

export interface ReadingServiceOptions {
  context: ReadingContext;
  model: LanguageModel;
  system: string;
  prompt: string;
  cardCount: number;
  maxTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
}

/**
 * DeepSeek thinking mode is always on for readings. It is fixed in code, not read from
 * the environment, so a stale override cannot silently switch it off in production.
 * Reasoning tokens share `maxOutputTokens` with the JSON body; the budget in
 * prompt-builder reserves room for them.
 */
export const READING_THINKING = { type: "enabled" as const };
export const READING_REASONING_EFFORT = "high" as const;

export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const result = await generateOnce(options);
  if (result.kind === "empty") return { ok: false, reason: "empty-output", issues: [] };
  if (result.kind !== "valid") {
    return { ok: false, reason: "schema-mismatch", issues: [schemaIssue(result.error)], diagnostics: result.diagnostics };
  }

  const validation = validateAnswer(result.answer, options.context);

  return {
    ok: true,
    reading: renderSimpleAnswer(validation.answer),
    droppedPatterns: validation.droppedPatterns,
  };
}

interface AnswerValidation {
  /** The serving answer: every rejected pattern removed, prose untouched. */
  answer: SimpleAnswer;
  droppedPatterns: string[];
}

/**
 * The server-side contract for one candidate answer: patterns may only list drawn
 * canonical cards and every card name must resolve; any pattern that fails these checks is
 * dropped from `patterns[]` before rendering. Prose is not a hard validation boundary:
 * card mentions there may be negations or refer to a different spread.
 */
function validateAnswer(candidate: SimpleAnswer, context: ReadingContext): AnswerValidation {
  const drawnCardIds = context.cards.map((card) => card.id);

  const invented = findInventedCards(candidate, drawnCardIds).filter((match) => match.field === "pattern");
  const unresolved = findUnresolvedCardLabels(candidate);
  const badPatternIndices = new Set<number>();
  candidate.patterns.forEach((_, index) => {
    if (invented.some((match) => match.patternIndex === index) || unresolved.some((label) => label.patternIndex === index)) {
      badPatternIndices.add(index);
    }
  });

  const droppedPatterns = [...badPatternIndices]
    .sort((a, b) => a - b)
    .map((index) => {
      const pattern = candidate.patterns[index];
      const names = [...new Set(invented.filter((match) => match.patternIndex === index).map((match) => match.name))];
      const labels = [...new Set(unresolved.filter((label) => label.patternIndex === index).map((label) => label.label))];
      const reasons: string[] = [];
      if (names.length > 0) reasons.push(`names undrawn card(s): ${names.join(", ")}`);
      if (labels.length > 0) reasons.push(`uses unrecognised card name(s): ${labels.join(", ")}`);
      return `Pattern "${pattern.cards.join(" + ")}" ${reasons.join("; ")}`;
    });

  const verified: SimpleAnswer = badPatternIndices.size === 0
    ? candidate
    : { ...candidate, patterns: candidate.patterns.filter((_, index) => !badPatternIndices.has(index)) };

  return { answer: verified, droppedPatterns };
}

type GenerationAttempt =
  | { kind: "empty" }
  | { kind: "valid"; answer: ReturnType<typeof SimpleAnswerSchema.parse>; diagnostics?: StructuredOutputDiagnostics }
  | { kind: "invalid"; error: unknown; diagnostics: StructuredOutputDiagnostics };

type StructuredOutputDiagnostics = {
  finishReason: unknown;
  rawShape: ReturnType<typeof describeRawOutput>;
};

async function generateOnce(options: ReadingServiceOptions): Promise<GenerationAttempt> {
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

  const raw = result.text ?? "";
  if (!raw.trim()) return { kind: "empty" };

  const diagnostics: StructuredOutputDiagnostics = { finishReason: result.finishReason, rawShape: describeRawOutput(raw) };
  const answer = answerFromText(raw);
  if (answer) return { kind: "valid", answer, diagnostics };
  return { kind: "invalid", error: new Error("Model output was not a usable reading object"), diagnostics };
}

function answerFromText(raw: string): ReturnType<typeof SimpleAnswerSchema.parse> | null {
  const object = extractJsonObject(raw);
  if (!object) return null;

  const strict = ModelAnswerSchema.safeParse(object);
  if (strict.success) {
    try {
      const answer = normalizeSimpleAnswer(strict.data);
      warnOnProseMetadataLeak(answer);
      return answer;
    } catch {
      return null;
    }
  }
  return recoverAnswer(object);
}

function recoverAnswer(object: Record<string, unknown>): ReturnType<typeof SimpleAnswerSchema.parse> | null {
  const tolerantCandidate = {
    ...object,
    patterns: Array.isArray(object.patterns) ? object.patterns : [],
  };
  const parsed = SimpleAnswerTransportSchema.safeParse(tolerantCandidate);
  if (!parsed.success) return null;

  try {
    const answer = normalizeSimpleAnswer(parsed.data);
    warnOnProseMetadataLeak(answer);
    return answer;
  } catch {
    return null;
  }
}

function normalizeSimpleAnswer(
  raw: z.infer<typeof ModelAnswerSchema> | z.infer<typeof SimpleAnswerTransportSchema>,
): ReturnType<typeof SimpleAnswerSchema.parse> {
  return SimpleAnswerSchema.parse({
    ...raw,
    patterns: (raw.patterns ?? [])
      .map(normalizePattern)
      .filter((item): item is Pattern => item !== null),
    timing: normalizeTiming(raw.timing),
  });
}

function normalizePattern(value: unknown): Pattern | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const item = value as Record<string, unknown>;
    const cards = Array.isArray(item.cards)
      ? item.cards.filter((card): card is string => typeof card === "string" && card.trim().length > 0).map((card) => card.trim())
      : typeof item.cards === "string" && item.cards.trim()
        ? [item.cards.trim()]
        : [];

    if (cards.length === 0 || typeof item.meaning !== "string" || !item.meaning.trim()) return null;

    return { cards, meaning: item.meaning.trim() };
  }

  return null;
}

function normalizeTiming(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function schemaIssue(error: unknown): ValidationIssue {
  return {
    type: "structured-output",
    message: `SimpleAnswer JSON could not be parsed or did not match the model schema: ${error instanceof Error ? error.message : String(error)}`,
  };
}

function warnOnProseMetadataLeak(answer: ReturnType<typeof SimpleAnswerSchema.parse>): void {
  const leak = findProseInvariantViolation(answer);
  if (leak) console.warn("reading: prose metadata leak", { leak });
}

function describeRawOutput(raw: string) {
  const trimmed = raw.trim();
  return {
    length: raw.length,
    startsWithBrace: trimmed.startsWith("{"),
    endsWithBrace: trimmed.endsWith("}"),
    startsWithFence: trimmed.startsWith("```"),
    startsWithHeading: trimmed.startsWith("#"),
    hasOpeningBrace: trimmed.includes("{"),
    hasClosingBrace: trimmed.includes("}"),
  };
}
