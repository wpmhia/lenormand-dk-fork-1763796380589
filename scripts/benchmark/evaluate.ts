import { extractJsonObject } from "@/lib/model-json";
import {
  ModelAnswerSchema,
  SimpleAnswerSchema,
  SimpleAnswerTransportSchema,
  PATTERN_RELATIONS,
  renderSimpleAnswer,
  type Pattern,
} from "@/lib/simple-answer";
import { findInventedCards, findUnresolvedCardLabels } from "@/lib/invented-cards";
import { findInvalidGeometryPatterns } from "@/lib/geometry-claims";
import type { ReadingContext } from "@/lib/reading-context";

export interface Evaluation {
  parsed: boolean;
  schemaValid: boolean;
  parseMode: "strict" | "recovered" | "invalid";
  appWouldServe: boolean;
  finishReason: string;
  outputFailure: string | null;
  inventedCards: { card: string; field: string; fragment: string }[];
  unknownCardLabels: { label: string; patternIndex: number }[];
  falseGeometry: { patternIndex: number; message: string; relation: string }[];
  deliveredReading: string | null;
  deliveredAnswer: string | null;
  deliveredPatterns: unknown[];
  proseCardMentions: { card: string; field: string; fragment: string }[];
}

export function evaluateOutput(raw: string, finishReason: string, context: ReadingContext): Evaluation {
  const object = extractJsonObject(raw);
  if (!object) return failedEvaluation(finishReason, "no_json_object");

  // Match the production `answerFromText` contract: strict parse first, followed by its
  // tolerant transport recovery for absent/malformed `patterns` and optional timing.
  // Otherwise the benchmark would report recoverable outputs as model failures.
  const strict = ModelAnswerSchema.safeParse(object);
  let answer: ReturnType<typeof SimpleAnswerSchema.parse>;
  let parseMode: Evaluation["parseMode"];
  if (strict.success) {
    answer = normalizeCandidate(strict.data);
    parseMode = "strict";
  } else {
    const tolerantCandidate = { ...object, patterns: Array.isArray(object.patterns) ? object.patterns : [] };
    const recovered = SimpleAnswerTransportSchema.safeParse(tolerantCandidate);
    if (!recovered.success) {
      return { ...failedEvaluation(finishReason, "schema_mismatch"), parsed: true };
    }
    answer = normalizeCandidate(recovered.data);
    parseMode = "recovered";
  }

  // Pattern-level findings are recorded before deterministic repair. The delivered object
  // mirrors the production service's pattern drops and prose grounding failure.
  const drawnIds = context.cards.map((card) => card.id);
  const cardFindings = findInventedCards(answer, drawnIds);
  const labelFindings = findUnresolvedCardLabels(answer);
  const geometryFindings = findInvalidGeometryPatterns(answer, context);
  const rejectedIndices = new Set<number>([
    ...cardFindings.filter((match) => match.field === "pattern").map((match) => match.patternIndex!),
    ...labelFindings.map((match) => match.patternIndex),
    ...geometryFindings.map((match) => match.index),
  ]);
  const delivered = {
    ...answer,
    patterns: answer.patterns.filter((_, index) => !rejectedIndices.has(index)),
  };
  const proseCardMentions = findInventedCards(delivered, drawnIds).filter((match) => match.field !== "pattern");
  const outputFailure = finishReason !== "stop" ? `finish_reason_${finishReason}` : null;

  return {
    parsed: true,
    schemaValid: true,
    parseMode,
    appWouldServe: proseCardMentions.length === 0,
    finishReason,
    outputFailure,
    inventedCards: cardFindings.map((match) => ({ card: match.name, field: match.field, fragment: match.fragment })),
    unknownCardLabels: labelFindings,
    falseGeometry: geometryFindings.map((match) => ({
      patternIndex: match.index,
      message: match.message,
      relation: answer.patterns[match.index]?.relation ?? "unknown",
    })),
    deliveredReading: renderSimpleAnswer(delivered),
    deliveredAnswer: answer.answer,
    deliveredPatterns: delivered.patterns,
    proseCardMentions: proseCardMentions.map((match) => ({ card: match.name, field: match.field, fragment: match.fragment })),
  };
}

function failedEvaluation(finishReason: string, failure: string): Evaluation {
  return {
    parsed: false,
    schemaValid: false,
    parseMode: "invalid",
    appWouldServe: false,
    finishReason,
    outputFailure: failure,
    inventedCards: [],
    unknownCardLabels: [],
    falseGeometry: [],
    deliveredReading: null,
    deliveredAnswer: null,
    deliveredPatterns: [],
    proseCardMentions: [],
  };
}

function normalizeCandidate(
  raw: Record<string, unknown>,
): ReturnType<typeof SimpleAnswerSchema.parse> {
  const patterns = Array.isArray(raw.patterns)
    ? raw.patterns.map(normalizePattern).filter((item): item is Pattern => item !== null)
    : [];
  const timing = typeof raw.timing === "string" && raw.timing.trim() ? raw.timing.trim() : null;
  return SimpleAnswerSchema.parse({ ...raw, patterns, timing });
}

function normalizePattern(value: unknown): Pattern | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const cards = Array.isArray(item.cards)
    ? item.cards.filter((card): card is string => typeof card === "string" && card.trim().length > 0).map((card) => card.trim())
    : typeof item.cards === "string" && item.cards.trim()
      ? [item.cards.trim()]
      : [];
  if (cards.length === 0 || typeof item.meaning !== "string" || !item.meaning.trim()) return null;
  const relation = typeof item.relation === "string" && (PATTERN_RELATIONS as readonly string[]).includes(item.relation)
    ? item.relation as Pattern["relation"]
    : "combination";
  const house = typeof item.house === "string" && item.house.trim() ? item.house.trim() : null;
  return { cards, relation, house, meaning: item.meaning.trim() };
}
