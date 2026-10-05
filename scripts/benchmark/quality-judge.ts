import { generateText } from "ai";
import type { LanguageModel } from "ai";
import type { BenchmarkCase } from "./cases";
import type { ReadingContext } from "@/lib/reading-context";
import type { Evaluation } from "./evaluate";

export const QUALITY_JUDGE_SYSTEM = `You are an independent quality auditor for Lenormand readings. Assess the supplied response, not whether a particular card meaning is traditionally correct. Do not invent card meanings or apply a card-specific rulebook. Use only the supplied question, cards and positions for factual spatial checks. Be conservative: quote the exact text for each identified issue and use confidence from 0 to 1. Return only valid JSON.`;

export function buildQualityJudgePrompt(
  benchmarkCase: BenchmarkCase,
  context: ReadingContext,
  evaluation: Evaluation,
): string {
  const gridSize = context.layout.type === "grand-tableau" ? 9 : context.layout.type === "petit-tableau" ? 3 : null;
  const positionMap = gridSize
    ? context.cards.map((card, index) => `position ${index + 1}: ${card.name}, row ${Math.floor(index / gridSize) + 1}, column ${(index % gridSize) + 1}`).join("\n")
    : context.cards.map((card, index) => `position ${index + 1}: ${card.name}`).join("\n");
  const houseMap = context.layout.type === "grand-tableau"
    ? context.layout.houses.map((placement) => `position ${placement.position} is the ${placement.houseName} house; occupant=${placement.occupyingCard.name}`).join("\n")
    : "No houses exist in this spread.";
  return `Blind review. Do not see or infer the benchmark's automated validator decisions.

Question (${benchmarkCase.language}): ${benchmarkCase.question}
Spread: ${benchmarkCase.spreadLabel} (${benchmarkCase.cardCount} cards)

Layout type: ${context.layout.type}
Position map:
${positionMap}

House map:
${houseMap}

Apply only these geometric definitions (no card meanings): in a line, adjacency means consecutive positions; in a grid, adjacency includes horizontal, vertical and diagonal neighboring cells one step apart. A row or column has a constant row or column coordinate; a diagonal has constant row-column or row+column. A house claim names one occupant and the house card; check that occupant against the house map above. A sequence is consecutive positions in the supplied order.

Delivered structured patterns:
${JSON.stringify(evaluation.deliveredPatterns, null, 2)}

Delivered answer:
${evaluation.deliveredAnswer ?? "(none)"}

Delivered reading:
${evaluation.deliveredReading ?? "(none)"}

Review the response on these general reader-facing dimensions (1=poor, 5=strong):
- directness: answers the exact question rather than substituting another question
- relevance: details are grounded in the user's context/question
- depth: meaningful, specific synthesis rather than generic filler or a card inventory; appropriate to spread size
- spreadSynthesis: makes meaningful use of the supplied spread as a whole, not merely a few convenient cards; do not require every card to be named
- calibration: uncertainty and confidence feel proportionate, without unsupported certainty
- naturalness: clear, fluent, human-sounding language
- languageConsistency: consistently uses the question's language

Also independently identify, without translating card names into fixed meanings:
- prose claims of position, adjacency, row, column, diagonal, knight move or house that the position/house maps actually contradict;
- spatial claims that are geometrically true but not declared in the delivered patterns array (a contract omission, not false geometry);
- conflicts where prose and a delivered spatial pattern assert different relations;
- explicit claims that a card is in the spread when it is not.
- concrete user-specific assumptions (unprovided events, motives, identities, facts or prerequisites), contradictions, or guarantees that contradict the question or a delivered pattern meaning. Treat the delivered pattern field "meaning" as evidence; do not require the prose to copy it verbatim. Do not call a normal Lenormand synthesis or plausible prediction unsupported merely because it is not a supplied biographical fact. Do not assess card meanings against a hidden rulebook. Do not mark the reading bad just because it does not invoke a particular spatial relationship.
Do not count neutral mentions or ordinary-language uses of words that happen to be card names. Do not require every drawn card to be named.
Keep every issue array to at most 3 highest-confidence examples; quote exact, short excerpts (under 20 words), give one concise reason and do not repeat the same issue in multiple arrays. Keep notes under 20 words.

Return exactly this JSON shape:
{
  "scores": {"directness": 1, "relevance": 1, "depth": 1, "spreadSynthesis": 1, "calibration": 1, "naturalness": 1, "languageConsistency": 1},
  "unsupportedSpatialClaims": [{"quote": "exact excerpt", "reason": "brief", "confidence": 0.0}],
  "unlistedSpatialClaims": [{"quote": "exact excerpt", "relation": "brief", "confidence": 0.0}],
  "patternTextConflicts": [{"quote": "exact excerpt", "pattern": "pattern label", "reason": "brief", "confidence": 0.0}],
  "undrawnCardClaims": [{"quote": "exact excerpt", "card": "name", "confidence": 0.0}],
  "unsupportedConclusions": [{"quote": "exact excerpt", "reason": "brief", "confidence": 0.0}],
  "overallConfidence": 0.0,
  "notes": "brief; no card meanings"
}`;
}

export interface JudgeResult {
  value: Record<string, unknown> | null;
  raw: string;
  finishReason: string;
  rawFinishReason: string | null;
  failureKind: "provider_error" | "truncated_json" | "invalid_json" | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    reasoningTokens: number | null;
    cacheHitTokens: number | null;
    cacheMissTokens: number | null;
  };
  latencyMs: number;
  error: string | null;
  responseModel: string | null;
  systemFingerprint: string | null;
}

export async function runQualityJudge(
  model: LanguageModel,
  prompt: string,
  timeoutMs: number,
): Promise<JudgeResult> {
  const startedAt = Date.now();
  try {
    const result = await generateText({
      model,
      system: QUALITY_JUDGE_SYSTEM,
      prompt,
      maxOutputTokens: 1600,
      maxRetries: 0,
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      timeout: { totalMs: timeoutMs },
    });
    const raw = result.text ?? "";
    const deepseekMetadata = (result.providerMetadata?.deepseek ?? {}) as Record<string, unknown>;
    const value = parseJson(raw);
    return {
      value,
      raw,
      finishReason: result.finishReason,
      rawFinishReason: result.rawFinishReason ?? null,
      failureKind: !value && result.finishReason === "length" ? "truncated_json" : value ? null : "invalid_json",
      usage: {
        inputTokens: result.usage.inputTokens ?? null,
        outputTokens: result.usage.outputTokens ?? null,
        reasoningTokens: result.usage.outputTokenDetails.reasoningTokens ?? null,
        cacheHitTokens: result.usage.inputTokenDetails.cacheReadTokens ?? null,
        cacheMissTokens: result.usage.inputTokenDetails.noCacheTokens ?? null,
      },
      latencyMs: Date.now() - startedAt,
      error: null,
      responseModel: result.response.modelId ?? null,
      systemFingerprint: typeof deepseekMetadata.systemFingerprint === "string" ? deepseekMetadata.systemFingerprint : null,
    };
  } catch (error) {
    return {
      value: null,
      raw: "",
      finishReason: "error",
      rawFinishReason: null,
      failureKind: "provider_error",
      usage: { inputTokens: null, outputTokens: null, reasoningTokens: null, cacheHitTokens: null, cacheMissTokens: null },
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      responseModel: null,
      systemFingerprint: null,
    };
  }
}

function parseJson(text: string): Record<string, unknown> | null {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  try {
    const value: unknown = JSON.parse(trimmed.slice(first, last + 1));
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
