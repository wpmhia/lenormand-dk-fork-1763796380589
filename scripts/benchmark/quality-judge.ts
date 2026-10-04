import { generateText } from "ai";
import type { LanguageModel } from "ai";
import type { BenchmarkCase } from "./cases";
import type { ReadingContext } from "@/lib/reading-context";
import type { Evaluation } from "./evaluate";

export const QUALITY_JUDGE_SYSTEM = `You are an independent quality auditor for Lenormand readings. Assess the supplied response, not whether a particular card meaning is traditionally correct. Do not invent card meanings or apply a card-specific rulebook. Use only the supplied question, cards, positions, and structured patterns for factual spatial checks. Be conservative: quote the exact text for each identified issue and use confidence from 0 to 1. Return only valid JSON.`;

export function buildQualityJudgePrompt(
  benchmarkCase: BenchmarkCase,
  context: ReadingContext,
  evaluation: Evaluation,
): string {
  return `Blind review. Do not see or infer the benchmark's automated validator decisions.

Question (${benchmarkCase.language}): ${benchmarkCase.question}
Spread: ${benchmarkCase.spreadLabel} (${benchmarkCase.cardCount} cards)
Cards in position order: ${context.cards.map((card, index) => `${index + 1}:${card.name}`).join(" | ")}

Delivered structured patterns:
${JSON.stringify(evaluation.deliveredPatterns, null, 2)}

Delivered answer:
${evaluation.deliveredAnswer ?? "(none)"}

Delivered reading:
${evaluation.deliveredReading ?? "(none)"}

Review the response on these general reader-facing dimensions (1=poor, 5=strong):
- directness: answers the exact question rather than substituting another question
- relevance: details are grounded in the user's context/question
- depth: meaningful synthesis rather than generic filler or a card inventory; appropriate to spread size
- spreadSynthesis: uses a coherent reading rather than cherry-picking or mechanically listing cards
- calibration: uncertainty and confidence feel proportionate, without unsupported certainty
- naturalness: clear, fluent, human-sounding language
- languageConsistency: consistently uses the question's language

Also independently identify, without translating card names into fixed meanings:
- prose claims of position/adjacency/row/column/diagonal/sequence/knight/house that are not supported by the listed positions or declared patterns;
- conflicts between a spatial statement in prose and the delivered pattern list;
- explicit claims that a card is in the spread when it is not.
Do not count neutral mentions or ordinary-language uses of words that happen to be card names. Do not require every drawn card to be named.

Return exactly this JSON shape:
{
  "scores": {"directness": 1, "relevance": 1, "depth": 1, "spreadSynthesis": 1, "calibration": 1, "naturalness": 1, "languageConsistency": 1},
  "unsupportedSpatialClaims": [{"quote": "exact excerpt", "reason": "brief", "confidence": 0.0}],
  "patternTextConflicts": [{"quote": "exact excerpt", "pattern": "pattern label", "reason": "brief", "confidence": 0.0}],
  "undrawnCardClaims": [{"quote": "exact excerpt", "card": "name", "confidence": 0.0}],
  "overallConfidence": 0.0,
  "notes": "brief; no card meanings"
}`;
}

export interface JudgeResult {
  value: Record<string, unknown> | null;
  raw: string;
  finishReason: string;
  rawFinishReason: string | null;
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
      maxOutputTokens: 700,
      maxRetries: 0,
      providerOptions: { deepseek: { thinking: { type: "disabled" } } },
      timeout: { totalMs: timeoutMs },
    });
    const raw = result.text ?? "";
    const deepseekMetadata = (result.providerMetadata?.deepseek ?? {}) as Record<string, unknown>;
    return {
      value: parseJson(raw),
      raw,
      finishReason: result.finishReason,
      rawFinishReason: result.rawFinishReason ?? null,
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
