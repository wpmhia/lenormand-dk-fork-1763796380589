import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Exercises the real follow-up route handler. Only the model call and the rate limiter are
 * replaced; validation, prompt building and the response mapping run as in production.
 */

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    rateLimit: vi.fn(async () => ({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60_000 })),
  };
});

const body = {
  followUpQuestion: "What does the centre card mean for the coming weeks?",
  originalQuestion: "How will the next months develop for my work?",
  spreadId: "sentence-3",
  significatorPreference: "both",
  cards: [
    { id: 1, name: "Rider" },
    { id: 2, name: "Clover" },
    { id: 3, name: "Ship" },
  ],
};

function request(payload: unknown = body) {
  return new Request("http://localhost/api/readings/followup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("follow-up route: real handler with a mocked model", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPSEEK_API", "test-key");
    generateText.mockReset();
  });

  it("returns the follow-up text as plain text with HTTP 200 on success", async () => {
    generateText.mockResolvedValueOnce({
      text: "The centre card points to a decision in the coming weeks.",
      finishReason: "stop",
      usage: { outputTokens: 300, outputTokenDetails: { reasoningTokens: 200, textTokens: 100 } },
    });
    const { POST } = await import("@/app/api/readings/followup/route");

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe("The centre card points to a decision in the coming weeks.");
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it("returns a generation failure with HTTP 502 for empty model output, never 200", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    generateText.mockResolvedValueOnce({
      text: "   ",
      finishReason: "length",
      usage: { outputTokens: 12288, outputTokenDetails: { reasoningTokens: 12200, textTokens: 88 } },
    });
    const { POST } = await import("@/app/api/readings/followup/route");

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Generation failed", reason: "empty-output" });
    expect(generateText).toHaveBeenCalledTimes(1);
    const [, fields] = errorSpy.mock.calls[0];
    expect(fields).toMatchObject({ cause: "output-budget-exhausted", finishReason: "length", reasoningTokens: 12200 });
    errorSpy.mockRestore();
  });

  it("maps an SDK total timeout to HTTP 504, not 499, while the client is still connected", async () => {
    const timeout = Object.assign(new Error("The operation was aborted due to timeout"), { name: "AbortError" });
    generateText.mockRejectedValueOnce(timeout);
    const { POST } = await import("@/app/api/readings/followup/route");

    const response = await POST(request());

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: "Response timed out" });
  });

  it("maps a real client abort to HTTP 499", async () => {
    const controller = new AbortController();
    generateText.mockImplementationOnce(async () => {
      controller.abort();
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    });
    const { POST } = await import("@/app/api/readings/followup/route");

    const response = await POST(
      new Request("http://localhost/api/readings/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }),
    );

    expect(response.status).toBe(499);
  });

  it("generates through the shared model service with the same thinking settings as readings", async () => {
    generateText.mockResolvedValueOnce({
      text: "The centre card points to a decision in the coming weeks.",
      finishReason: "stop",
      usage: { outputTokens: 300, outputTokenDetails: { reasoningTokens: 200, textTokens: 100 } },
    });
    const { POST } = await import("@/app/api/readings/followup/route");

    const response = await POST(request());
    expect(response.status).toBe(200);

    const call = generateText.mock.calls[0][0];
    expect(call.providerOptions.deepseek.thinking).toEqual({ type: "enabled" });
    expect(call.providerOptions.deepseek.reasoningEffort).toBe("low");
    expect(call.timeout).toEqual({ totalMs: 45_000 });
    expect(call.maxRetries).toBe(0);
  });
});
