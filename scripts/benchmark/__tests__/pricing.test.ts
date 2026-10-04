import { describe, expect, it } from "vitest";
import { calculateCostUsd, pricingFor } from "../pricing";

describe("benchmark pricing", () => {
  it("uses distinct current peak and off-peak rates", () => {
    expect(pricingFor("deepseek-flash", "off-peak")).toEqual({ inputCacheHitUsd: 0.003, inputCacheMissUsd: 0.15, outputUsd: 0.6 });
    expect(pricingFor("deepseek-flash", "peak")).toEqual({ inputCacheHitUsd: 0.006, inputCacheMissUsd: 0.3, outputUsd: 1.2 });
  });

  it("calculates costs using provider-reported cache hits and total tokens", () => {
    const prices = pricingFor("deepseek-flash", "off-peak")!;
    expect(calculateCostUsd({ inputTokens: 1_000_000, cacheHitTokens: 200_000, outputTokens: 10_000 }, prices)).toBeCloseTo(
      (200_000 * 0.003 + 800_000 * 0.15 + 10_000 * 0.6) / 1_000_000,
    );
  });

  it("returns null when usage or a model price is not available", () => {
    expect(calculateCostUsd({ inputTokens: null, outputTokens: 2 }, pricingFor("deepseek-flash", "off-peak"))).toBeNull();
    expect(pricingFor("unlisted-model", "peak")).toBeNull();
  });
});
