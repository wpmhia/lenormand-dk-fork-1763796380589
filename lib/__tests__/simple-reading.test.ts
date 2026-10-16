import { beforeEach, describe, expect, it, vi } from "vitest";
import { isReadingComplete, renderSimpleAnswer, SimpleAnswerSchema } from "@/lib/simple-answer";
import { generateReading } from "@/lib/reading-service";
import type { LanguageModel } from "ai";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

const validOutput = {
  answer: "The cards support a cautious opening.",
  reading: "The line combines a practical opening with uncertainty.",
};

function options() {
  return {
    model: {} as LanguageModel,
    system: "system",
    prompt: "prompt",
    maxTokens: 500,
    timeoutMs: 5_000,
  };
}

function textOutput(value: unknown, finishReason = "stop") {
  return { text: typeof value === "string" ? value : JSON.stringify(value), finishReason };
}

describe("rendering: the answer and reading as saved Markdown", () => {
  it("renders the answer before the reading under the same headings saved readings use", () => {
    const rendered = renderSimpleAnswer(SimpleAnswerSchema.parse(validOutput));
    expect(rendered).toBe(
      "## Answer\nThe cards support a cautious opening.\n\n## Reading\nThe line combines a practical opening with uncertainty.",
    );
  });

  it("treats a rendered reading as complete for auto-save and an empty one as not", () => {
    expect(isReadingComplete(renderSimpleAnswer(SimpleAnswerSchema.parse(validOutput)))).toBe(true);
    expect(isReadingComplete("")).toBe(false);
    expect(isReadingComplete("   \n  ")).toBe(false);
  });

  it("rejects an answer or reading that is empty after trimming", () => {
    expect(SimpleAnswerSchema.safeParse({ answer: "   ", reading: "x" }).success).toBe(false);
    expect(SimpleAnswerSchema.safeParse({ answer: "x", reading: "" }).success).toBe(false);
  });
});

describe("generation: one model call, one parse path", () => {
  beforeEach(() => generateText.mockReset());

  it("parses a valid JSON answer and renders it", async () => {
    generateText.mockResolvedValueOnce(textOutput(validOutput));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).toBe(renderSimpleAnswer(validOutput));
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("accepts a JSON answer wrapped in a Markdown code fence", async () => {
    generateText.mockResolvedValueOnce(textOutput("```json\n" + JSON.stringify(validOutput) + "\n```"));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
  });

  it("reports empty provider output without a second call", async () => {
    generateText.mockResolvedValueOnce(textOutput("   "));

    const result = await generateReading(options());

    expect(result).toEqual({ ok: false, reason: "empty-output" });
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("logs budget exhaustion with token counts and no content when reasoning consumed the output", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    generateText.mockResolvedValueOnce({
      text: "",
      finishReason: "length",
      usage: { outputTokens: 12288, outputTokenDetails: { reasoningTokens: 12200, textTokens: 88 } },
    });

    const result = await generateReading({ ...options(), maxTokens: 12288 });

    expect(result).toEqual({ ok: false, reason: "empty-output" });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [message, fields] = errorSpy.mock.calls[0];
    expect(message).toBe("reading: empty model output");
    expect(fields).toEqual({
      cause: "output-budget-exhausted",
      finishReason: "length",
      maxTokens: 12288,
      outputTokens: 12288,
      reasoningTokens: 12200,
      textTokens: 88,
      elapsedMs: expect.any(Number),
    });
    errorSpy.mockRestore();
  });

  it("returns a normal successful reading without logging an empty-output error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    generateText.mockResolvedValueOnce({
      text: JSON.stringify(validOutput),
      finishReason: "stop",
      usage: { outputTokens: 900, outputTokenDetails: { reasoningTokens: 700, textTokens: 200 } },
    });

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).toBe(renderSimpleAnswer(validOutput));
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("reports truncated output as invalid without a second call", async () => {
    generateText.mockResolvedValueOnce(textOutput('{"answer":"A cautious week ahead', "length"));

    const result = await generateReading(options());

    expect(result).toEqual({ ok: false, reason: "invalid-output" });
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("reports output that is not a JSON object with both fields as invalid", async () => {
    for (const bad of ["still malformed", JSON.stringify({ answer: "only an answer" }), JSON.stringify(["a", "b"])]) {
      generateText.mockResolvedValueOnce(textOutput(bad));
      const result = await generateReading(options());
      expect(result, bad).toEqual({ ok: false, reason: "invalid-output" });
    }
  });

  it("ignores extra fields the model may add, since only answer and reading are rendered", async () => {
    generateText.mockResolvedValueOnce(textOutput({ ...validOutput, patterns: [], timing: null }));

    const result = await generateReading(options());

    expect(result.ok).toBe(true);
    expect(result.ok && result.reading).not.toContain("## Patterns");
    expect(result.ok && result.reading).not.toContain("## Timing");
  });

  it("requests thinking and a bounded timeout on the single call", async () => {
    generateText.mockResolvedValueOnce(textOutput(validOutput));

    await generateReading(options());

    const call = generateText.mock.calls[0][0];
    expect(call.providerOptions.deepseek.thinking).toEqual({ type: "enabled" });
    expect(call.providerOptions.deepseek.reasoningEffort).toBe("low");
    expect(call.timeout).toEqual({ totalMs: 5_000 });
    expect(call.maxRetries).toBe(0);
  });
});
