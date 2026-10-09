import { extractJsonObject } from "@/lib/model-json";
import {
  ModelAnswerSchema,
  SimpleAnswerSchema,
  SimpleAnswerTransportSchema,
  renderSimpleAnswer,
  type Pattern,
} from "@/lib/simple-answer";
import { findInventedCards, findUnresolvedCardLabels } from "@/lib/invented-cards";
import type { ReadingContext } from "@/lib/reading-context";

export interface GeometryCheck {
  relation: "adjacent" | "row" | "column" | "diagonal" | "knight" | "house" | "sequence";
  quote: string;
  ok: boolean;
}

export interface Evaluation {
  parsed: boolean;
  schemaValid: boolean;
  parseMode: "strict" | "recovered" | "invalid";
  appWouldServe: boolean;
  finishReason: string;
  outputFailure: string | null;
  inventedCards: { card: string; field: string; fragment: string }[];
  unknownCardLabels: { label: string; patternIndex: number }[];
  proseGeometry: GeometryCheck[];
  deliveredReading: string | null;
  deliveredAnswer: string | null;
  deliveredPatterns: unknown[];
}

function cardIndexByName(context: ReadingContext, name: string): number {
  const drawn = context.cards.findIndex((card) => card.name.toLowerCase() === name.trim().toLowerCase());
  if (drawn !== -1) return drawn;
  // House lookup: each position's house carries a canonical name; the model may invoke the
  // house name without it being one of the drawn cards.
  return context.cards.findIndex((card) => card.name.toLowerCase() === name.trim().toLowerCase());
}

/**
 * An independent, prompt-blind check for spatial claims the model makes in free prose.
 *
 * It uses only the drawn cards and their positions; it knows nothing about verified
 * clusters, the production validator, or the prompt. The benchmark reuses the same
 * finders as the legacy validator so A/B comparisons remain meaningful.
 */
function detectSpatialClaims(context: ReadingContext, text: string): GeometryCheck[] {
  if (!text) return [];
  const checks: GeometryCheck[] = [];
  const lines = context.layout.type === "grand-tableau" || context.layout.type === "petit-tableau"
    ? { rows: context.layout.type === "grand-tableau" ? 4 : 3, columns: context.layout.type === "grand-tableau" ? 9 : 3 }
    : null;

  const claim = (relation: GeometryCheck["relation"], regex: RegExp): void => {
    const matches = text.match(regex);
    if (!matches) return;
    for (const match of matches.slice(0, 3)) {
      const tokens = match.split(/[^a-zA-ZäöüÄÖÜß]+/g).filter((token) => token.length > 0);
      if (tokens.length < 2) continue;
      const indices = tokens.map((token) => cardIndexByName(context, token)).filter((index) => index !== -1);
      if (indices.length < 2) continue;
      checks.push({ relation, quote: match, ok: verifySpatialClaim(relation, indices, context, lines) });
    }
  };

  const scanPair = (relation: GeometryCheck["relation"]) => claim(relation, new RegExp(`\\b[A-Z][A-Za-zäöüÄÖÜß'’]+\\b [+-] \\b[A-Z][A-Za-zäöüÄÖÜß'’]+\\b`, "g"));

  scanPair("adjacent");
  scanPair("row");
  scanPair("column");
  scanPair("diagonal");
  scanPair("knight");
  scanPair("house");
  scanPair("sequence");

  return checks;
}

function verifySpatialClaim(
  relation: GeometryCheck["relation"],
  indices: number[],
  context: ReadingContext,
  lines: { rows: number; columns: number } | null,
): boolean {
  const [a, b] = [indices[0], indices[1]];
  switch (relation) {
    case "sequence":
      // Sequence in a line: consecutive positions. A line has no other geometry.
      if (context.layout.type !== "linear-sentence") return false;
      return Math.abs(a - b) === 1;
    case "adjacent":
      if (!lines) return Math.abs(a - b) === 1;
      return isGridAdjacent(a, b, lines.columns);
    case "row":
      if (!lines) return false;
      return Math.floor(a / lines.columns) === Math.floor(b / lines.columns);
    case "column":
      if (!lines) return false;
      return a % lines.columns === b % lines.columns;
    case "diagonal":
      if (!lines) return false;
      return isDiagonal(a, b, lines.columns);
    case "knight":
      if (!lines) return false;
      return isKnight(a, b, lines.columns);
    case "house":
      // House requires a grand-tableau layout where each position has a named house.
      if (context.layout.type !== "grand-tableau") return false;
      // The position of `b` carries the `a`-named house iff the cell's houseCardId matches a.
      return context.layout.houses[b]?.houseCardId === a;
    default:
      return true;
  }
}

function isGridAdjacent(a: number, b: number, columns: number): boolean {
  const rowA = Math.floor(a / columns);
  const colA = a % columns;
  const rowB = Math.floor(b / columns);
  const colB = b % columns;
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
}

function isDiagonal(a: number, b: number, columns: number): boolean {
  const rowA = Math.floor(a / columns);
  const colA = a % columns;
  const rowB = Math.floor(b / columns);
  const colB = b % columns;
  return Math.abs(rowA - rowB) === Math.abs(colA - colB) && rowA !== rowB;
}

function isKnight(a: number, b: number, columns: number): boolean {
  const rowA = Math.floor(a / columns);
  const colA = a % columns;
  const rowB = Math.floor(b / columns);
  const colB = b % columns;
  return (Math.abs(rowA - rowB) === 2 && Math.abs(colA - colB) === 1)
    || (Math.abs(rowA - rowB) === 1 && Math.abs(colA - colB) === 2);
}

/**
 * Evaluate one DeepSeek output against the simplified contract. The benchmark never
 * picks a subset of patterns for the model: every listed pattern is recorded as either
 * accepted or as a pattern-level rejected finding, and the model narrative is returned
 * verbatim for the independent judge to assess.
 */
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

  // The delivered object mirrors production: invalid pattern labels are dropped. Prose is
  // not scanned for card names because a mention may be a negation or refer to another spread.
  const drawnIds = context.cards.map((card) => card.id);
  const cardFindings = findInventedCards(answer, drawnIds);
  const labelFindings = findUnresolvedCardLabels(answer);
  const rejectedIndices = new Set<number>([
    ...cardFindings.filter((match) => match.field === "pattern").map((match) => match.patternIndex!),
    ...labelFindings.map((match) => match.patternIndex),
  ]);
  const delivered = {
    ...answer,
    patterns: answer.patterns.filter((_, index) => !rejectedIndices.has(index)),
  };
  const outputFailure = finishReason !== "stop" ? `finish_reason_${finishReason}` : null;
  const proseGeometry = [
    ...detectSpatialClaims(context, answer.answer ?? ""),
    ...detectSpatialClaims(context, answer.reading ?? ""),
  ];

  return {
    parsed: true,
    schemaValid: true,
    parseMode,
    appWouldServe: true,
    finishReason,
    outputFailure,
    inventedCards: cardFindings.map((match) => ({ card: match.name, field: match.field, fragment: match.fragment })),
    unknownCardLabels: labelFindings,
    proseGeometry,
    deliveredReading: renderSimpleAnswer(delivered),
    deliveredAnswer: answer.answer,
    deliveredPatterns: delivered.patterns,
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
    proseGeometry: [],
    deliveredReading: null,
    deliveredAnswer: null,
    deliveredPatterns: [],
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
  return { cards, meaning: item.meaning.trim() };
}
