import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { ReadingContext } from "@/lib/reading-context";
import {
  renderSimpleAnswer,
  SimpleAnswerSchema,
  SimpleAnswerTransportSchema,
  findProseInvariantViolation,
  type HouseMirror,
} from "@/lib/simple-answer";
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

  const repairPrompt = `${options.prompt}\n\nThe previous model response was malformed or violated the output contract. Repair it once. Preserve the useful reading content, but remove internal coordinates, numeric positions, evidence identifiers, pair IDs, weights, and implementation terminology from every user-visible field. Return only valid JSON matching the exact object contract; do not add commentary.\n\nPrevious response:\n${result.raw.slice(0, 16_000)}`;
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
       output: Output.object({
         schema: SimpleAnswerTransportSchema,
         name: "simple_lenormand_reading",
         description: "A structured Lenormand reading. housesAndMirrors may contain house/meaning objects or strings that the server will normalize.",
       }),
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      maxOutputTokens: options.maxTokens,
      maxRetries: 0,
      abortSignal: options.signal,
      timeout: { totalMs: timeoutMs },
    });
    if (!result.output) return { kind: "empty" };
    const parsed = SimpleAnswerTransportSchema.safeParse(result.output);
    if (!parsed.success) {
      const raw = result.text || JSON.stringify(result.output);
      const recovered = recoverAnswer(raw);
      if (recovered) return { kind: "valid", answer: recovered };
      return { kind: "invalid", raw, error: parsed.error };
    }
    try {
      const answer = normalizeSimpleAnswer(parsed.data);
      if (findProseInvariantViolation(answer)) {
        return { kind: "invalid", raw: result.text || JSON.stringify(result.output), error: new Error("User-facing prose contains internal references") };
      }
      return { kind: "valid", answer };
    } catch (error) {
      return { kind: "invalid", raw: result.text || JSON.stringify(result.output), error };
    }
  } catch (error) {
    const raw = isMalformedObjectError(error) ? error.text || "" : "";
    if (isMalformedObjectError(error)) {
      const recovered = recoverAnswer(raw);
      if (recovered) return { kind: "valid", answer: recovered };
      return { kind: "invalid", raw, error };
    }
    throw error;
  }
}

function recoverAnswer(raw: string): ReturnType<typeof SimpleAnswerSchema.parse> | null {
  const candidate = parseJsonCandidate(raw);
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;

  const object = candidate as Record<string, unknown>;
  const tolerantCandidate = {
    ...object,
    cards: Array.isArray(object.cards) ? object.cards : [],
    housesAndMirrors: Array.isArray(object.housesAndMirrors) ? object.housesAndMirrors : [],
  };
  const parsed = SimpleAnswerTransportSchema.safeParse(tolerantCandidate);
  if (!parsed.success) return null;

  try {
    const answer = normalizeSimpleAnswer(parsed.data);
    return findProseInvariantViolation(answer) ? null : answer;
  } catch {
    return null;
  }
}

function parseJsonCandidate(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const candidates = [
    trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim(),
    trimmed.slice(trimmed.indexOf("{"), trimmed.lastIndexOf("}") + 1),
  ];
  for (const candidate of candidates) {
    if (!candidate || !candidate.startsWith("{") || !candidate.endsWith("}")) continue;
    try {
      return JSON.parse(candidate);
    } catch {
    }
  }
  return null;
}

function isMalformedObjectError(error: unknown): error is Error & { text?: string } {
  return Boolean(error && typeof error === "object" && (error as { name?: string }).name === "AI_NoObjectGeneratedError");
}

function normalizeSimpleAnswer(raw: z.infer<typeof SimpleAnswerTransportSchema>): ReturnType<typeof SimpleAnswerSchema.parse> {
  return SimpleAnswerSchema.parse({
    ...raw,
    cards: raw.cards
      .map(normalizeCard)
      .filter((item): item is { combination: string; meaning: string } => item !== null),
    timing: normalizeTiming(raw.timing),
    housesAndMirrors: raw.housesAndMirrors
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
    type: "missing_section",
    message: `SimpleAnswer JSON did not match the transport schema: ${error instanceof Error ? error.message : String(error)}`,
  };
}
