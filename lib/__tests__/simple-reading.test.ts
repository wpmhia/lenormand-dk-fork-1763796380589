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
  answer: "The cards support a cautious opening.",
  reading: "The line combines a practical opening with uncertainty.",
  patterns: [{ cards: ["Clover", "Ring"], meaning: "A small opening around a bond." }],
  timing: null,
};

/**
 * `generateReading` checks the reading against the drawn set, so the fixture has to carry
 * a real card list rather than `{}`. Clover and Ring are drawn because `validOutput`
 * names them.
 */
const drawnCards = [
  { id: 2, name: "Clover", keywords: [] },
  { id: 6, name: "Clouds", keywords: [] },
  { id: 24, name: "Heart", keywords: [] },
  { id: 25, name: "Ring", keywords: [] },
];

function options(overrides: Partial<Parameters<typeof generateReading>[0]> = {}) {
  return {
    context: { cards: drawnCards, layout: { type: "single" } } as unknown as ReadingContext,
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
  it("renders the four-field output with no legacy Prediction fields", () => {
    const answer = SimpleAnswerSchema.parse({
      answer: "The cards support a cautious opening.",
      reading: "The line combines a practical opening with uncertainty.",
      patterns: [{ cards: ["Clover", "Ring"], meaning: "A small opening around a bond." }],
      timing: null,
    });
    const rendered = renderSimpleAnswer(answer);
    expect(rendered).toContain("## Answer");
    expect(rendered).toContain("The cards support a cautious opening.");
    expect(rendered).toContain("## Patterns");
    expect(rendered).not.toContain("Most likely development");
    expect(rendered).not.toContain("## Positive factors");
    expect(rendered).not.toContain("## Challenges");
    expect(rendered).not.toContain("## Development");
    expect(rendered).not.toContain("## Houses and mirrors");
  });

  it("defaults the optional fields instead of failing the reading", () => {
    const answer = SimpleAnswerSchema.parse({
      answer: "The cards support a cautious opening.",
      reading: "The line combines a practical opening with uncertainty.",
    });
    expect(answer.patterns).toEqual([]);
    expect(answer.timing).toBeNull();
  });

  it("renders the answer before the reading and omits empty patterns", () => {
    const answer = SimpleAnswerSchema.parse({
      answer: "The relationship can develop steadily.",
      reading: "The cards show a gradual opening.",
    });
    const rendered = renderSimpleAnswer(answer);

    expect(rendered.indexOf("## Answer")).toBeLessThan(rendered.indexOf("## Reading"));
    expect(rendered).not.toContain("## Patterns");
    expect(rendered).not.toContain("## Timing");
  });

  it("rejects internal coordinates in user-facing prose", () => {
    const answer = SimpleAnswerSchema.parse({
      answer: "The Tree at position 5 supports growth.",
      reading: "The relationship develops gradually.",
    });

    expect(findProseInvariantViolation(answer)).not.toBeNull();
  });

  it("does not reject ordinary natural language causality", () => {
    const answer = SimpleAnswerSchema.parse({
      answer: "You must be cautious with this transition.",
      reading: "The cards show a positive direction.",
    });

    expect(findProseInvariantViolation(answer)).toBeNull();
  });
});

describe("simple reading single-call output handling", () => {
  beforeEach(() => {
    generateText.mockReset();
  });

  it("returns a schema failure for truncated output without a second provider call", async () => {
    generateText.mockResolvedValueOnce(textOutput('{"answer":"A cautious week ahead', "aborted"));

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
    expect(result.ok && result.reading).toContain(validOutput.answer);
  });

  it("recovers locally parseable output without retrying", async () => {
    const locallyRecoverable = {
      answer: validOutput.answer,
      reading: validOutput.reading,
      patterns: "not an array",
    };
    generateText.mockResolvedValueOnce(textOutput(locallyRecoverable));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).toContain(validOutput.answer);
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

  it("drops a legacy string pattern without failing the reading", async () => {
    // A pattern whose `cards` is not an array is malformed under the array contract.
    // It is dropped rather than parsed from a combined string, and never fails the reading.
    generateText.mockResolvedValueOnce(textOutput({ ...validOutput, patterns: ["Clover + Ring: a small opening"] }));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).not.toContain("Clover + Ring");
    expect(result.ok && result.reading).toContain(validOutput.answer);
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["pattern object", { patterns: [{ cards: ["Clover", "Ring"], meaning: "A small opening." }] }],
    ["malformed pattern", { patterns: [{ cards: ["Clover"] }] }],
    ["missing timing", {}],
    ["null timing", { timing: null }],
    ["extra legacy fields are ignored", {
      positiveFactors: ["a"],
      challenges: ["b"],
      development: "c",
      housesAndMirrors: [{ house: "Heart house", meaning: "d" }],
      cards: [{ combination: "Clover + Ring", meaning: "e" }],
      directAnswer: "legacy",
      interpretation: "legacy",
    }],
  ])("accepts %s without retrying", async (_, overrides) => {
    generateText.mockResolvedValueOnce(textOutput({ ...validOutput, ...overrides }));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("drops an unsupported geometry pattern and keeps the rest of the reading", async () => {
    const cards = [
      { id: 1, name: "Rider" },
      { id: 2, name: "Clover" },
      { id: 3, name: "Ship" },
    ];
    const context = { cards, layout: { type: "linear-sentence", positions: [] } } as unknown as ReadingContext;

    generateText.mockResolvedValueOnce(
      textOutput({
        answer: "The line reads as one movement.",
        reading: "A connected sentence.",
        patterns: [
          { cards: ["Rider", "Clover"], relation: "combination", meaning: "kept pattern" },
          { cards: ["Rider", "Ship"], relation: "row", meaning: "dropped pattern" },
        ],
      }),
    );

    const result = await generateReading(options({ context }));

    // The reading is returned; only the pattern that made a false claim is removed.
    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).toContain("kept pattern");
    expect(result.ok && result.reading).not.toContain("dropped pattern");
    expect(result.ok && result.droppedGeometryPatterns).toHaveLength(1);
  });

  it("does not leak the removed legacy sections into the rendered reading", async () => {
    generateText.mockResolvedValueOnce(
      textOutput({
        ...validOutput,
        positiveFactors: ["a legacy positive"],
        challenges: ["a legacy challenge"],
        development: "a legacy development",
        housesAndMirrors: [{ house: "Heart house", meaning: "a legacy house" }],
      }),
    );

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    const reading = result.ok ? result.reading : "";
    expect(reading).not.toContain("a legacy positive");
    expect(reading).not.toContain("a legacy challenge");
    expect(reading).not.toContain("a legacy development");
    expect(reading).not.toContain("a legacy house");
    expect(reading).not.toContain("Key combinations");
  });
});