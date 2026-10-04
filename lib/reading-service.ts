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
  type SimpleAnswer,
} from "@/lib/simple-answer";
import type { ValidationIssue } from "@/lib/reading-validator";
import { extractJsonObject } from "@/lib/model-json";
import { findInventedCards, findUnresolvedCardLabels, type InventedCardMatch } from "@/lib/invented-cards";
import { findInvalidGeometryPatterns } from "@/lib/geometry-claims";
import { GRAND_TABLEAU_CARD_COUNT } from "@/lib/constants";

export type ReadingServiceResult =
  | { ok: true; reading: string; droppedGeometryPatterns: string[]; droppedInventedPatterns: string[] }
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
  if (result.kind !== "valid") {
    return { ok: false, reason: "schema-mismatch", issues: [schemaIssue(result.error)], diagnostics: result.diagnostics };
  }

  const validation = validateAnswer(result.answer, options.context);

  // An explicit card reference in free prose is an unrepairable factual statement, not a
  // pattern detail: it is fatal on its own.
  if (validation.proseIssues.length > 0) return inventedCardFailure(validation.proseIssues, result.diagnostics);

  if (validation.droppedGeometry.length === 0 && validation.droppedInvented.length === 0) {
    return {
      ok: true,
      reading: renderSimpleAnswer(validation.answer),
      droppedGeometryPatterns: [],
      droppedInventedPatterns: [],
    };
  }

  // A pattern was rejected. Dropping it from `patterns[]` is not enough on its own: the
  // model may already have restated that same false relationship in `answer` or `reading`.
  // The narrative is therefore regenerated once from the verified patterns, so what ships
  // is built from claims the server has actually checked rather than prose it just refuted.
  const repaired = await generateOnce({ ...options, prompt: buildRepairPrompt(options.prompt, validation) });
  if (repaired.kind === "valid") {
    const finalAnswer = { ...repaired.answer, patterns: validation.verifiedPatterns };
    const prose = findInventedCards(finalAnswer, options.context.cards.map((card) => card.id)).filter(
      (match) => match.field !== "pattern",
    );
    if (prose.length === 0) {
      return {
        ok: true,
        reading: renderSimpleAnswer(finalAnswer),
        droppedGeometryPatterns: validation.droppedGeometry,
        droppedInventedPatterns: validation.droppedInvented,
      };
    }
    return inventedCardFailure(prose, repaired.diagnostics);
  }

  return {
    ok: false,
    reason: "schema-mismatch",
    issues: [{
      type: "structured-output",
      message: "A reading with rejected structural claims could not be rewritten from the verified patterns.",
    }],
    diagnostics: repaired.kind === "invalid" ? repaired.diagnostics : undefined,
  };
}

interface AnswerValidation {
  /** The serving answer: every rejected pattern removed, prose untouched. */
  answer: SimpleAnswer;
  verifiedPatterns: Pattern[];
  droppedInvented: string[];
  droppedGeometry: string[];
  proseIssues: InventedCardMatch[];
}

/**
 * Everything deterministic the server can say about one candidate answer:
 * which patterns fail the invented-card, unresolved-name and geometry gates, and which
 * verified patterns survive. Free prose is only checked for explicit card references.
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

  const droppedInvented = [...badPatternIndices]
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

  const afterLabels: SimpleAnswer = badPatternIndices.size === 0
    ? candidate
    : { ...candidate, patterns: candidate.patterns.filter((_, index) => !badPatternIndices.has(index)) };

  const invalidGeometry = findInvalidGeometryPatterns(afterLabels, context);
  const badGeometry = new Set(invalidGeometry.map((item) => item.index));
  const verifiedPatterns = afterLabels.patterns.filter((_, index) => !badGeometry.has(index));

  const verified: SimpleAnswer = { ...afterLabels, patterns: verifiedPatterns };
  const proseIssues = findInventedCards(verified, drawnCardIds).filter((match) => match.field !== "pattern");

  return {
    answer: verified,
    verifiedPatterns,
    droppedInvented,
    droppedGeometry: invalidGeometry.map((item) => item.message),
    proseIssues,
  };
}

function inventedCardFailure(matches: InventedCardMatch[], diagnostics?: StructuredOutputDiagnostics): ReadingServiceResult {
  return {
    ok: false,
    reason: "invented-card",
    issues: matches.map((match) => ({
      type: "invented_card" as const,
      message: `Reading names undrawn card ${match.name} (${match.id}) in "${match.field}": ${match.fragment}`,
      field: match.field,
      fragment: match.fragment,
    })),
    diagnostics,
  };
}

function buildRepairPrompt(basePrompt: string, validation: AnswerValidation): string {
  const verified = validation.verifiedPatterns.length > 0
    ? validation.verifiedPatterns
        .map((pattern) => `- ${pattern.cards.join(" + ")} [${pattern.relation}${pattern.house ? `, house: ${pattern.house}` : ""}]: ${pattern.meaning}`)
        .join("\n")
    : "- (none)";
  const rejected = [...validation.droppedInvented, ...validation.droppedGeometry].map((message) => `- ${message}`).join("\n");

  return `${basePrompt}

Correction pass:
Your previous answer asserted structural claims the coordinates do not support. These were rejected:
${rejected}

The verified patterns below are the only spatial claims you may use. Every statement about position, adjacency, sequence, rows, columns, diagonals, knight moves, houses or combinations in the narrative must come from this list:
${verified}

Rewrite "answer" and "reading" so they no longer repeat or paraphrase any rejected claim and reference only the verified patterns. Copy the "patterns" array exactly as listed above. Return the same JSON object shape and change nothing else.`;
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
    const house = typeof item.house === "string" && item.house.trim() ? item.house.trim() : null;
    return { cards, relation, house, meaning: item.meaning.trim() };
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
