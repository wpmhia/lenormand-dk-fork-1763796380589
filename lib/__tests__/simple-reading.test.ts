import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderSimpleAnswer, SimpleAnswerSchema } from "@/lib/simple-answer";
import { generateReading } from "@/lib/reading-service";
import type { ReadingContext } from "@/lib/reading-context";
import type { LanguageModel } from "ai";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));

vi.mock("ai", () => ({
  generateText,
  Output: {
    json: vi.fn(() => ({ type: "json" })),
    object: vi.fn(({ schema }) => ({ type: "object", schema })),
  },
}));

const validOutput = {
  directAnswer: "The cards support a cautious opening.",
  interpretation: "The line combines a practical opening with uncertainty.",
  cards: [{ combination: "Clover + Ring", meaning: "A small opening around a bond." }],
  timing: null,
  housesAndMirrors: [],
};

function options(overrides: Partial<Parameters<typeof generateReading>[0]> = {}) {
  return {
    context: {} as ReadingContext,
    model: {} as LanguageModel,
    system: "system",
    prompt: "prompt",
    cardCount: 3,
    maxTokens: 500,
    initialTimeoutMs: 5_000,
    repairTimeoutMs: 5_000,
    deadlineAt: Date.now() + 10_000,
    ...overrides,
  };
}

function malformedError(text = '{"directAnswer":"truncated"') {
  return Object.assign(new Error("No object generated"), {
    name: "AI_NoObjectGeneratedError",
    text,
  });
}

describe("simple reading contract", () => {
  it("renders the compact producer output without legacy Prediction fields", () => {
    const answer = SimpleAnswerSchema.parse({
      directAnswer: "The cards support a cautious opening.",
      interpretation: "The line combines a practical opening with uncertainty.",
      cards: [{ combination: "Clover + Ring", meaning: "A small opening around a bond." }],
      timing: null,
      housesAndMirrors: [],
    });
    const rendered = renderSimpleAnswer(answer);
    expect(rendered).toContain("## Answer");
    expect(rendered).toContain("The cards support a cautious opening.");
    expect(rendered).not.toContain("Most likely development");
  });
});

describe("simple reading JSON repair", () => {
  beforeEach(() => {
    generateText.mockReset();
  });

  it("repairs a malformed first response", async () => {
    generateText
      .mockRejectedValueOnce(malformedError())
      .mockResolvedValueOnce({ output: validOutput, text: JSON.stringify(validOutput) });

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(generateText.mock.calls[1][0].prompt).toContain("Previous response:");
  });

  it("returns schema-mismatch when the repair also fails", async () => {
    generateText
      .mockRejectedValueOnce(malformedError())
      .mockRejectedValueOnce(malformedError("still malformed"));

    const result = await generateReading(options());

    expect(result).toMatchObject({ ok: false, reason: "schema-mismatch" });
    expect(generateText).toHaveBeenCalledTimes(2);
  });

  it("does not retry when the repair budget is below one second", async () => {
    generateText.mockRejectedValueOnce(malformedError());

    const result = await generateReading(options({ repairTimeoutMs: 999 }));

    expect(result).toMatchObject({ ok: false, reason: "schema-mismatch" });
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("normalizes a legacy house string without retrying", async () => {
    const output = {
      ...validOutput,
      housesAndMirrors: ["House of Heart: relationship becomes central"],
    };
    generateText.mockResolvedValueOnce({ output, text: JSON.stringify(output) });

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).toContain("House of Heart");
    expect(generateText).toHaveBeenCalledTimes(1);
  });
});
