export type PricingPeriod = "peak" | "off-peak";

export interface PerMillionPricing {
  inputCacheHitUsd: number;
  inputCacheMissUsd: number;
  outputUsd: number;
}

/**
 * Official DeepSeek API rates fetched 2026-10-04; override with CLI flags on a later run.
 * USD per 1M tokens. API pricing varies by model and peak/off-peak window.
 * Source: https://api-docs.deepseek.com/quick_start/pricing
 */
const OFF_PEAK: Record<string, PerMillionPricing> = {
  "deepseek-flash": { inputCacheHitUsd: 0.003, inputCacheMissUsd: 0.15, outputUsd: 0.6 },
  "deepseek-v4-flash": { inputCacheHitUsd: 0.003, inputCacheMissUsd: 0.15, outputUsd: 0.6 },
  "deepseek-v4-pro": { inputCacheHitUsd: 0.022, inputCacheMissUsd: 0.66, outputUsd: 1.98 },
};

const PEAK: Record<string, PerMillionPricing> = {
  "deepseek-flash": { inputCacheHitUsd: 0.006, inputCacheMissUsd: 0.3, outputUsd: 1.2 },
  "deepseek-v4-flash": { inputCacheHitUsd: 0.006, inputCacheMissUsd: 0.3, outputUsd: 1.2 },
  "deepseek-v4-pro": { inputCacheHitUsd: 0.044, inputCacheMissUsd: 1.32, outputUsd: 3.96 },
};

export function pricingFor(model: string, period: PricingPeriod): PerMillionPricing | null {
  return (period === "peak" ? PEAK : OFF_PEAK)[model] ?? null;
}

export function calculateCostUsd(
  usage: { inputTokens?: number | null; cacheHitTokens?: number | null; outputTokens?: number | null },
  prices: PerMillionPricing | null,
): number | null {
  if (!prices || usage.inputTokens == null || usage.outputTokens == null) return null;
  const hit = Math.min(usage.inputTokens, Math.max(0, usage.cacheHitTokens ?? 0));
  const miss = usage.inputTokens - hit;
  return (
    (hit * prices.inputCacheHitUsd + miss * prices.inputCacheMissUsd + usage.outputTokens * prices.outputUsd) /
    1_000_000
  );
}
