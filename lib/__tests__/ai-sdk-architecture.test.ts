import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("interpret route uses AI SDK correctly", () => {
  const src = read("app/api/readings/interpret/route.ts");

  it("uses generateText, not streamText, for initial readings", () => {
    expect(src).toMatch(/import \{ generateText \} from "ai"/);
    expect(src).not.toMatch(/import \{ streamText \} from "ai"/);
  });

  it("does not buffer a server-side textStream and rewrap as SSE", () => {
    expect(src).not.toMatch(/result\.textStream/);
    expect(src).not.toMatch(/Content-Type.*text\/event-stream/);
    expect(src).not.toMatch(/function streamTextAsSSE/);
  });

  it("uses SDK timeout and abortSignal, not a manual AbortController", () => {
    expect(src).toMatch(/abortSignal: request\.signal/);
    expect(src).toMatch(/timeout: \{ totalMs:/);
    expect(src).not.toMatch(/new AbortController\(\)/);
    expect(src).not.toMatch(/setTimeout\(\(\) => abortController\.abort/);
  });

  it("caps server-side retries at 1 (no 3x3 outer/SDK retry stacking)", () => {
    expect(src).toMatch(/maxRetries: 1/);
  });

  it("returns a single JSON response with the final reading", () => {
    expect(src).toMatch(/JSON\.stringify\(\{\s*reading,/);
    expect(src).toMatch(/Content-Type.*application\/json/);
  });
});

describe("followup route uses AI SDK correctly", () => {
  const src = read("app/api/readings/followup/route.ts");

  it("uses streamText for follow-ups (the conversational path)", () => {
    expect(src).toMatch(/import \{ streamText \} from "ai"/);
    expect(src).toMatch(/streamText\(/);
  });

  it("returns the response via toTextStreamResponse (no custom SSE wrapping)", () => {
    expect(src).toMatch(/toTextStreamResponse\(/);
    expect(src).not.toMatch(/text\/event-stream/);
    expect(src).not.toMatch(/new ReadableStream/);
  });

  it("uses SDK timeout and abortSignal, not a manual AbortController", () => {
    expect(src).toMatch(/abortSignal: request\.signal/);
    expect(src).toMatch(/timeout: \{ totalMs:/);
    expect(src).not.toMatch(/new AbortController\(\)/);
  });

  it("caps retries at 1", () => {
    expect(src).toMatch(/maxRetries: 1/);
  });
});

describe("client-side retry duplication is removed", () => {
  it("does not export a streamReadingResponse helper any more", () => {
    expect(() => readFileSync("lib/stream-reading.ts", "utf8")).toThrow();
  });

  it("does not export an sse-parser helper any more", () => {
    expect(() => readFileSync("lib/sse-parser.ts", "utf8")).toThrow();
  });

  it("useAIAnalysis no longer retries the entire request from the browser", () => {
    const src = read("hooks/useAIAnalysis.ts");
    expect(src).not.toMatch(/onRetry/);
    expect(src).not.toMatch(/maxRetries/);
  });
});

describe("interpret route: validation failures fail closed, not via fallback", () => {
  const src = read("app/api/readings/interpret/route.ts");

  it("does NOT call buildDeterministicFallback on validation failure", () => {
    // The deterministic fallback was a defensive engineering measure, but for a product
    // whose value is the quality of the interpretation, a bad fallback is worse than an
    // explicit retryable error.
    expect(src).not.toMatch(/buildDeterministicFallback/);
  });

  it("returns HTTP 502 with retryable: true when the validator rejects the answer", () => {
    expect(src).toMatch(/generationFailedResponse/);
    expect(src).toMatch(/retryable: true/);
    expect(src).toMatch(/status: 502/);
  });

  it("logs the validator's critical issues to the server console (so we can debug)", () => {
    expect(src).toMatch(/console\.error\(\"interpret: reading rejected by validator\"/);
  });
});
