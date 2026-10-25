import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LanguageModel } from "ai";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

import { generateModelText, generateReading } from "@/lib/reading-service";

const SECRET_KEY = "sk-test-SECRET-KEY-123456";
const PRIVATE_QUESTION = "PRIVATE-QUESTION-about-my-health";
const CARD_TEXT = "CARD-CONTENT-Mountain";

const validOutput = { answer: "A cautious opening.", reading: "A practical line with uncertainty." };

function options(overrides: Partial<Parameters<typeof generateModelText>[0]> = {}) {
  return {
    model: {} as LanguageModel,
    system: "system",
    prompt: `${PRIVATE_QUESTION} ${CARD_TEXT}`,
    maxTokens: 6144,
    timeoutMs: 45_000,
    logLabel: "reading" as const,
    requestId: "req-1234",
    ...overrides,
  };
}

function generationLogs(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls.filter(([message]) => message === "deepseek generation").map(([, fields]) => fields);
}

function allLogText(...spies: ReturnType<typeof vi.spyOn>[]) {
  return spies.flatMap((spy) => spy.mock.calls.map((call) => JSON.stringify(call))).join("\n");
}

describe("generation logging: structured timing and usage", () => {
  beforeEach(() => {
    generateText.mockReset();
  });

  it("logs a successful generation with request id, timing, limits, finish reason and usage", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    generateText.mockResolvedValueOnce({
      text: JSON.stringify(validOutput),
      finishReason: "stop",
      usage: { inputTokens: 500, outputTokens: 900, outputTokenDetails: { reasoningTokens: 700, textTokens: 200 } },
    });

    const result = await generateModelText(options());

    expect(result.ok).toBe(true);
    const [log] = generationLogs(infoSpy);
    expect(log).toEqual({
      label: "reading",
      requestId: "req-1234",
      model: expect.any(String),
      outcome: "ok",
      elapsedMs: expect.any(Number),
      timeoutMs: 45_000,
      maxTokens: 6144,
      finishReason: "stop",
      inputTokens: 500,
      outputTokens: 900,
      reasoningTokens: 700,
      textTokens: 200,
      error: undefined,
    });
    expect(errorSpy).not.toHaveBeenCalled();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("logs a failed generation with the error class and the configured timeout, not the message", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const timeout = Object.assign(new Error(`timed out for ${PRIVATE_QUESTION} with ${SECRET_KEY}`), { name: "TimeoutError" });
    generateText.mockRejectedValueOnce(timeout);

    await expect(generateModelText(options())).rejects.toThrow();

    const [log] = generationLogs(infoSpy);
    expect(log).toMatchObject({ outcome: "error", error: "TimeoutError", timeoutMs: 45_000, requestId: "req-1234" });
    expect(log.finishReason).toBeUndefined();
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("logs an empty output with its finish reason and token usage", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    generateText.mockResolvedValueOnce({
      text: "",
      finishReason: "length",
      usage: { outputTokens: 6144, outputTokenDetails: { reasoningTokens: 6000, textTokens: 144 } },
    });

    const result = await generateModelText(options());

    expect(result).toEqual({ ok: false, reason: "empty-output" });
    const [log] = generationLogs(infoSpy);
    expect(log).toMatchObject({ outcome: "empty", finishReason: "length", outputTokens: 6144, reasoningTokens: 6000 });
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("never logs the key, the private question, card text or the model output", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.DEEPSEEK_API = SECRET_KEY;
    generateText.mockResolvedValueOnce({
      text: `${PRIVATE_QUESTION} ${CARD_TEXT} ${JSON.stringify(validOutput)}`,
      finishReason: "stop",
      usage: { inputTokens: 1, outputTokens: 1 },
    });

    await generateReading(options());

    const logged = allLogText(infoSpy, errorSpy);
    expect(logged).not.toContain(SECRET_KEY);
    expect(logged).not.toContain(PRIVATE_QUESTION);
    expect(logged).not.toContain(CARD_TEXT);
    expect(logged).not.toContain("A cautious opening");
    delete process.env.DEEPSEEK_API;
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("keeps the thinking settings and timeout unchanged", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    generateText.mockResolvedValueOnce({ text: JSON.stringify(validOutput), finishReason: "stop", usage: {} });

    await generateModelText(options());

    const call = generateText.mock.calls[0][0];
    expect(call.providerOptions.deepseek).toEqual({ thinking: { type: "disabled" } });
    expect(call.timeout).toEqual({ totalMs: 45_000 });
    expect(call.maxOutputTokens).toBe(6144);
    infoSpy.mockRestore();
  });
});
