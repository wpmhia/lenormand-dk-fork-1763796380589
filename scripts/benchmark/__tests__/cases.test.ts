import { describe, expect, it } from "vitest";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { BENCHMARK_SPREADS, createBenchmarkCases } from "../cases";

describe("benchmark cases", () => {
  it("creates exactly 100 seeded cases for every required spread size", () => {
    const cases = createBenchmarkCases(987654, 100);
    expect(cases).toHaveLength(500);
    expect(Object.fromEntries(BENCHMARK_SPREADS.map(({ id }) => [id, cases.filter((item) => item.spreadId === id).length]))).toEqual({
      "single-card": 100,
      "sentence-3": 100,
      "sentence-5": 100,
      comprehensive: 100,
      "grand-tableau": 100,
    });
  });

  it("reproduces cards, questions and preferences for the same seed", () => {
    expect(createBenchmarkCases(42, 10)).toEqual(createBenchmarkCases(42, 10));
  });

  it("changes the generated fixtures when the seed changes", () => {
    expect(createBenchmarkCases(42, 10)).not.toEqual(createBenchmarkCases(43, 10));
  });

  it("uses the canonical deck without replacement and varies natural question language", () => {
    const allowedIds = new Set(CARD_CATALOG.map((card) => card.id));
    const cases = createBenchmarkCases(13579, 50);
    for (const benchmarkCase of cases) {
      expect(benchmarkCase.cardIdsByPosition).toHaveLength(benchmarkCase.cardCount);
      expect(new Set(benchmarkCase.cardIdsByPosition).size).toBe(benchmarkCase.cardCount);
      expect(benchmarkCase.cardIdsByPosition.every((id) => allowedIds.has(id))).toBe(true);
      expect(benchmarkCase.question.length).toBeGreaterThan(40);
    }
    expect(new Set(cases.filter((item) => item.spreadId === "sentence-5").map((item) => item.question)).size).toBeGreaterThan(10);
    expect(cases.some((item) => item.language === "en")).toBe(true);
    expect(cases.some((item) => item.language === "nl")).toBe(true);
  });

  it("rejects invalid sample sizes", () => {
    expect(() => createBenchmarkCases(1, 0)).toThrow(/positive integer/);
    expect(() => createBenchmarkCases(1, 1.5)).toThrow(/positive integer/);
  });
});
