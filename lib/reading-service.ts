import { generateText, type LanguageModel } from "ai";
import { z } from "zod";
import type { ReadingContext } from "@/lib/reading-context";
import {
  renderSimpleAnswer,
  ModelAnswerSchema,
  SimpleAnswerSchema,
  SimpleAnswerTransportSchema,
  findProseInvariantViolation,
  type HouseMirror,
} from "@/lib/simple-answer";
import type { ValidationIssue } from "@/lib/reading-validator";
import { extractJsonObject } from "@/lib/model-json";

export type ReadingServiceResult =
  | { ok: true; reading: string }
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

export async function generateReading(options: ReadingServiceOptions): Promise<ReadingServiceResult> {
  const result = await generateOnce(options);
  if (result.kind === "empty") return { ok: false, reason: "empty-output", issues: [] };
  if (result.kind === "valid") return { ok: true, reading: renderSimpleAnswer(result.answer) };
  return { ok: false, reason: "schema-mismatch", issues: [schemaIssue(result.error)], diagnostics: result.diagnostics };
}

type GenerationAttempt =
  | { kind: "empty" }
  | { kind: "valid"; answer: ReturnType<typeof SimpleAnswerSchema.parse> }
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
    providerOptions: { deepseek: { thinking: { type: "disabled" } } },
    maxOutputTokens: options.maxTokens,
    maxRetries: 0,
    abortSignal: options.signal,
    timeout: { totalMs: options.timeoutMs },
  });

  const raw = result.text ?? "";
  if (!raw.trim()) return { kind: "empty" };

  const diagnostics: StructuredOutputDiagnostics = { finishReason: result.finishReason, rawShape: describeRawOutput(raw) };
  const answer = answerFromText(raw);
  if (answer) return { kind: "valid", answer };
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
    cards: Array.isArray(object.cards) ? object.cards : [],
    housesAndMirrors: Array.isArray(object.housesAndMirrors) ? object.housesAndMirrors : [],
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
    cards: (raw.cards ?? [])
      .map(normalizeCard)
      .filter((item): item is { combination: string; meaning: string } => item !== null),
    timing: normalizeTiming(raw.timing),
    housesAndMirrors: (raw.housesAndMirrors ?? [])
      .map(normalizeHouseMirror)
      .filter((item): item is HouseMirror => item !== null),
  });
}

function normalizeCard(value: unknown): { combination: string; meaning: string } | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const item = value as Record<string, unknown>;
    if (typeof item.combination === "string" && item.combination.trim() && typeof item.meaning === "string" && item.meaning.trim()) {
      return { combination: item.combination.trim(), meaning: item.meaning.trim() };
    }
    return null;
  }

  if (typeof value === "string") {
    const match = value.match(/^\s*(?:[-*]\s*)?\**(.+?)\**\s*(?::|—|–)\s*(.+)\s*$/);
    if (match) return { combination: match[1].trim(), meaning: match[2].trim() };
  }
  return null;
}

function normalizeTiming(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeHouseMirror(value: unknown): HouseMirror | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const item = value as Record<string, unknown>;
    if (typeof item.house === "string" && item.house.trim() && typeof item.meaning === "string" && item.meaning.trim()) {
      return { house: item.house.trim(), meaning: item.meaning.trim() };
    }
    return null;
  }

  if (typeof value === "string") {
    const match = value.match(/^\s*(?:[-*]\s*)?\**(.+?)\**\s*(?::|—|–)\s*(.+)\s*$/);
    if (match) return { house: match[1].trim(), meaning: match[2].trim() };
  }
  return null;
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
