import { describe, expect, it } from "vitest";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { BENCHMARK_SPREADS, createBenchmarkCases, createContentRegressionCases } from "../cases";

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

  it("pairs suggestive and neutral Mahican questions over the same draw", () => {
    const cases = createContentRegressionCases();
    const suggestive = cases.find((item) => item.id === "content-mahican-suggestive-nl-001")!;
    const neutral = cases.find((item) => item.id === "content-mahican-neutral-nl-001")!;

    expect(suggestive.question).toBe("Op welke manier communiceert Mahican nog met buitenechtelijke mannen?");
    expect(neutral.question).toBe("Welke thema's laten deze kaarten zien rond Mahicans communicatie?");
    expect(suggestive.cardIdsByPosition).toEqual([31, 22, 25, 17, 21]);
    expect(neutral.cardIdsByPosition).toEqual(suggestive.cardIdsByPosition);
    expect(suggestive.significatorPreference).toBe("both");
    expect(suggestive.regressionTarget).toMatch(/ongoing contact.*extramarital.*communication channel/i);
  });

  it("checks that missing confirmation does not become a negative or opposite fact", () => {
    const regression = createContentRegressionCases().find((item) => item.id === "content-absence-is-not-opposite-nl-001")!;
    expect(regression.question).toBe("Is Mahican gestopt met daten met andere mannen?");
    expect(regression.cardIdsByPosition).toEqual([31, 22, 25, 17, 21]);
    expect(regression.regressionTarget).toMatch(/continues dating.*stopped/i);
    expect(regression.regressionTarget).toMatch(/Uncertainty is acceptable.*do not require a yes\/no/i);
  });
});
