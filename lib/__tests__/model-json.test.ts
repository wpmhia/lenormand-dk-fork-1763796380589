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
  it("keeps every spread budget above the measured output tail", () => {
    const budgets = [1, 3, 5, 9, 36].map((cardCount) => getTokenBudget(cardCount));
    for (const budget of budgets) {
      expect(budget).toBeGreaterThanOrEqual(1_200);
    }
  });

  it("grows the budget with spread size", () => {
    const budgets = [1, 3, 5, 9, 36].map((cardCount) => getTokenBudget(cardCount));
    expect([...budgets].sort((a, b) => a - b)).toEqual(budgets);
  });
});