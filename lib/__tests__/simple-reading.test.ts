import { beforeEach, describe, expect, it, vi } from "vitest";
import { findProseInvariantViolation, renderSimpleAnswer, SimpleAnswerSchema } from "@/lib/simple-answer";
import { generateReading } from "@/lib/reading-service";
import type { ReadingContext } from "@/lib/reading-context";
import type { LanguageModel } from "ai";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));

vi.mock("ai", () => ({
  generateText,
}));

const validOutput = {
  directAnswer: "The cards support a cautious opening.",
  interpretation: "The line combines a practical opening with uncertainty.",
  cards: [{ combination: "Clover + Ring", meaning: "A small opening around a bond." }],
  timing: null,
  housesAndMirrors: [],
};

/**
 * `generateReading` checks the reading against the drawn set, so the fixture has to
 * carry a real card list rather than `{}`. Clover, Ring and Heart are drawn here
 * because `validOutput` and the legacy house-string case name them.
 */
const drawnCards = [
  { id: 2, name: "Clover", keywords: [] },
  { id: 6, name: "Clouds", keywords: [] },
  { id: 24, name: "Heart", keywords: [] },
  { id: 25, name: "Ring", keywords: [] },
];

function options(overrides: Partial<Parameters<typeof generateReading>[0]> = {}) {
  return {
    context: { cards: drawnCards } as unknown as ReadingContext,
    model: {} as LanguageModel,
    system: "system",
    prompt: "prompt",
    cardCount: 3,
    maxTokens: 500,
    timeoutMs: 5_000,
    ...overrides,
  };
}

function textOutput(value: unknown, finishReason = "stop") {
  return { text: typeof value === "string" ? value : JSON.stringify(value), finishReason };
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

  it("keeps the compact output focused on the natural-language answer", () => {
    const answer = SimpleAnswerSchema.parse({
      directAnswer: "The cards support a cautious opening.",
      interpretation: "The line combines a practical opening with uncertainty.",
    });

    expect(answer).not.toHaveProperty("direction");
  });

  it("renders the answer before the reading and omits empty combinations", () => {
    const answer = SimpleAnswerSchema.parse({
      directAnswer: "The relationship can develop steadily.",
      interpretation: "The cards show a gradual opening.",
      cards: [],
      timing: null,
      housesAndMirrors: [],
    });
    const rendered = renderSimpleAnswer(answer);

    expect(rendered.indexOf("## Answer")).toBeLessThan(rendered.indexOf("## Reading"));
    expect(rendered).not.toContain("## Key combinations");
    expect(rendered).not.toContain("No card commentary");
  });

  it("rejects internal coordinates in user-facing prose", () => {
    const answer = SimpleAnswerSchema.parse({
      directAnswer: "The Tree at position 5 supports growth.",
      interpretation: "The relationship develops gradually.",
      cards: [],
      timing: null,
      housesAndMirrors: [],
    });

    expect(findProseInvariantViolation(answer)).not.toBeNull();
  });

  it("does not reject ordinary natural language causality", () => {
    const answer = SimpleAnswerSchema.parse({
      directAnswer: "You must be cautious with this transition.",
      interpretation: "The cards show a positive direction.",
      cards: [],
      timing: null,
      housesAndMirrors: [],
    });

    expect(findProseInvariantViolation(answer)).toBeNull();
  });
});

describe("simple reading single-call output handling", () => {
  beforeEach(() => {
    generateText.mockReset();
  });

  it("returns a schema failure for truncated output without a second provider call", async () => {
    generateText.mockResolvedValueOnce(textOutput('{"directAnswer":"A cautious week ahead','aborted'));

    const result = await generateReading(options());

    expect(result).toMatchObject({ ok: false, reason: "schema-mismatch" });
    expect(result.ok === false && result.diagnostics?.finishReason).toBe("aborted");
    expect(generateText).toHaveBeenCalledTimes(1);
    expect(generateText.mock.calls[0][0].timeout).toEqual({ totalMs: 5_000 });
  });

  it("parses plain model text into a valid reading", async () => {
    generateText.mockResolvedValueOnce(textOutput(validOutput));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).toContain(validOutput.directAnswer);
  });

  it("recovers locally parseable output without retrying", async () => {
    const locallyRecoverable = {
      directAnswer: validOutput.directAnswer,
      interpretation: validOutput.interpretation,
      cards: "not an array",
    };
    generateText.mockResolvedValueOnce(textOutput(locallyRecoverable));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).toContain(validOutput.directAnswer);
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("returns schema-mismatch when local recovery cannot parse the response", async () => {
    generateText.mockResolvedValueOnce(textOutput("still malformed"));

    const result = await generateReading(options());

    expect(result).toMatchObject({ ok: false, reason: "schema-mismatch" });
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("reports empty provider output", async () => {
    generateText.mockResolvedValueOnce(textOutput("   "));

    const result = await generateReading(options());

    expect(result).toMatchObject({ ok: false, reason: "empty-output" });
  });

  it("normalizes a legacy house string without retrying", async () => {
    const output = {
      ...validOutput,
      housesAndMirrors: ["House of Heart: relationship becomes central"],
    };
    generateText.mockResolvedValueOnce(textOutput(output));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).toContain("House of Heart");
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["house object", { housesAndMirrors: [{ house: "House of Heart", meaning: "Relationships matter." }] }],
    ["malformed house", { housesAndMirrors: [{ house: 4 }] }],
    ["card string", { cards: ["Clover + Ring: a small opening"] }],
    ["card object", { cards: [{ combination: "Clover + Ring", meaning: "A small opening." }] }],
    ["malformed card", { cards: [{ combination: "Clover" }] }],
    ["missing timing", {}],
    ["null timing", { timing: null }],
  ])("accepts %s without retrying", async (_, overrides) => {
    generateText.mockResolvedValueOnce(textOutput({ ...validOutput, ...overrides }));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(generateText).toHaveBeenCalledTimes(1);
  });
});
