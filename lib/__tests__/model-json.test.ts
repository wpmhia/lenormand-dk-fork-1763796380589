import { describe, expect, it } from "vitest";
import { extractJsonObject } from "@/lib/model-json";
import { getTokenBudget } from "@/lib/prompt-builder";

describe("model JSON extraction", () => {
  it("parses a plain JSON object", () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips Markdown fences", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("extracts an object embedded in surrounding prose", () => {
    expect(extractJsonObject('Here you go: {"a":1} thanks')).toEqual({ a: 1 });
  });

  it.each([
    ["empty string", ""],
    ["prose only", "no json here"],
    ["truncated object", '{"answer":"cut off'],
    ["json array", "[1,2,3]"],
  ])("returns null for %s", (_, raw) => {
    expect(extractJsonObject(raw)).toBeNull();
  });
});

describe("reading token budgets", () => {
  it("keeps the budget proportional to spread size without inviting overgeneration", () => {
    const budgets = [1, 3, 5, 9, 36].map((cardCount) => getTokenBudget(cardCount));
    // A 5-card line should not be given 2k tokens; that's room to overgenerate.
    expect(getTokenBudget(5)).toBeLessThan(2_000);
    for (const budget of budgets) {
      expect(budget).toBeGreaterThanOrEqual(600);
    }
  });

  it("grows the budget with spread size", () => {
    const budgets = [1, 3, 5, 9, 36].map((cardCount) => getTokenBudget(cardCount));
    expect([...budgets].sort((a, b) => a - b)).toEqual(budgets);
  });
});