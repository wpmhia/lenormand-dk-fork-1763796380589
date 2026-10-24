import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(__dirname, "../AIReadingDisplay.tsx"), "utf8");

describe("AI click tracking", () => {
  it("tracks the actual button click with the spread only, never the question", () => {
    const handlerStart = source.indexOf("<Button onClick={() => {", source.indexOf("Discover what your cards mean"));
    const block = source.slice(handlerStart, source.indexOf("Get AI Interpretation", handlerStart));
    expect(block).toContain('trackEvent("ai_interpretation_requested"');
    expect(block).toMatch(/trackEvent\("ai_interpretation_requested", \{ spreadId: analysis\.spreadId \}\)/);
    expect(block).not.toMatch(/question/);
  });

  it("tracks before starting the request, so a click counts even if generation fails", () => {
    const at = source.indexOf('trackEvent("ai_interpretation_requested"');
    const start = source.indexOf("onStartAI();", at);
    expect(at).toBeGreaterThan(-1);
    expect(start).toBeGreaterThan(at);
  });
});
