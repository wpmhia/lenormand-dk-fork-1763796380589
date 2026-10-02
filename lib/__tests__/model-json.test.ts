import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractJsonObject } from "@/lib/model-json";
import { parseQuestionFrame } from "@/lib/question-frame";
import { getTokenBudget } from "@/lib/prompt-builder";
import type { LanguageModel } from "ai";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));

vi.mock("ai", () => ({ generateText }));

const frame = {
  domain: "career",
  subject: "I",
  counterparty: null,
  predicate: "receive a job offer",
  mode: "forecast",
  timeframe: { value: 3, unit: "month" },
};

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
    ["truncated object", '{"directAnswer":"cut off'],
    ["json array", "[1,2,3]"],
  ])("returns null for %s", (_, raw) => {
    expect(extractJsonObject(raw)).toBeNull();
  });
});

describe("question frame parsing", () => {
  beforeEach(() => {
    generateText.mockReset();
  });

  it("parses the frame from plain model text", async () => {
    generateText.mockResolvedValueOnce({ text: JSON.stringify(frame), finishReason: "stop" });

    const result = await parseQuestionFrame("Will I get a job offer?", {} as LanguageModel);

    expect(result).toMatchObject({ domain: "career", mode: "forecast" });
    expect(generateText.mock.calls[0][0].output).toBeUndefined();
  });

  it("states the field contract in the system prompt", async () => {
    generateText.mockResolvedValueOnce({ text: JSON.stringify(frame), finishReason: "stop" });

    await parseQuestionFrame("Will I get a job offer?", {} as LanguageModel);

    expect(generateText.mock.calls[0][0].system).toContain('"predicate": string');
  });

  it("throws when the model returns no usable object", async () => {
    generateText.mockResolvedValueOnce({ text: "I cannot parse that", finishReason: "stop" });

    await expect(parseQuestionFrame("Will I get a job offer?", {} as LanguageModel)).rejects.toThrow(
      "Question frame was not generated",
    );
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
