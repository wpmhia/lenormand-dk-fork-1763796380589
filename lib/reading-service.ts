import { generateText, type LanguageModel } from "ai";
import { z } from "zod";
import type { ReadingContext } from "@/lib/reading-context";
import {
  renderSimpleAnswer,
  ModelAnswerSchema,
  SimpleAnswerSchema,
  SimpleAnswerTransportSchema,
  findProseInvariantViolation,
  PATTERN_RELATIONS,
  type Pattern,
} from "@/lib/simple-answer";
import type { ValidationIssue } from "@/lib/reading-validator";
import { extractJsonObject } from "@/lib/model-json";
import { findInventedCards } from "@/lib/invented-cards";
import { findInvalidGeometryPatterns } from "@/lib/geometry-claims";
import { GRAND_TABLEAU_CARD_COUNT } from "@/lib/constants";

export type ReadingServiceResult =
  | { ok: true; reading: string; droppedGeometryPatterns: string[] }
  | { ok: false; reason: "empty-output" | "schema-mismatch" | "invented-card"; issues: ValidationIssue[]; diagnostics?: StructuredOutputDiagnostics };

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
 * DeepSeek thinking mode.
 *
 * The AI SDK defaults to `enabled`; this project previously forced `disabled` for
 * every reading. Thinking is genuinely useful for a 36-card Grand Tableau, but it
 * is not free to switch on: reasoning tokens are drawn from the same
 * `maxOutputTokens` budget as the JSON body, and generation is capped at
 * READING_GENERATION_TIMEOUT_MS (15s). Enabling it without raising both turns thin
 * readings into truncated-JSON 502s and timeouts, so the default stays `off` and
 * the A/B test is a single env var.
 *
 * DEEPSEEK_THINKING=auto  -> on for grand-tableau (36 cards), off otherwise
 * DEEPSEEK_THINKING=on    -> always on
 * DEEPSEEK_THINKING=off   -> always off (default)
 */
export function resolveThinkingMode(cardCount: number): { type: "enabled" | "disabled" } {
  const configured = (process.env.DEEPSEEK_THINKING || "off").toLowerCase();
  if (configured === "on" || configured === "enabled") return { type: "enabled" };
  if (configured === "auto") return { type: cardCount >= GRAND_TABLEAU_CARD_COUNT ? "enabled" : "disabled" };
  return { type: "disabled" };
}

export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const result = await generateOnce(options);
  if (result.kind === "empty") return { ok: false, reason: "empty-output", issues: [] };
  if (result.kind === "valid") {
    const invented = findInventedCards(result.answer, options.context.cards.map((card) => card.id));
    if (invented.length > 0) {
      return {
        ok: false,
        reason: "invented-card",
        issues: [{
          type: "invented_card",
          message: `Reading names ${invented.length} card(s) that were not drawn: ${invented.join(", ")}`,
        }],
        diagnostics: result.diagnostics,
      };
    }

    // A false spatial claim is repaired locally: drop the offending patterns and keep the
    // reading. Rejecting the whole Grand Tableau over one mis-declared relation would throw
    // away a usable reading for a detail.
    const invalidGeometry = findInvalidGeometryPatterns(result.answer, options.context);
    const answer = invalidGeometry.length === 0
      ? result.answer
      : {
          ...result.answer,
          patterns: result.answer.patterns.filter((_, index) => !invalidGeometry.some((item) => item.index === index)),
        };

    return {
      ok: true,
      reading: renderSimpleAnswer(answer),
      droppedGeometryPatterns: invalidGeometry.map((item) => item.message),
    };
  }
  return { ok: false, reason: "schema-mismatch", issues: [schemaIssue(result.error)], diagnostics: result.diagnostics };
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
    providerOptions: { deepseek: { thinking: resolveThinkingMode(options.cardCount) } },
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

    const relation =
      typeof item.relation === "string" && (PATTERN_RELATIONS as readonly string[]).includes(item.relation)
        ? (item.relation as Pattern["relation"])
        : "combination";
    return { cards, relation, meaning: item.meaning.trim() };
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
