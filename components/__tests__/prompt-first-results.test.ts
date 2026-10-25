import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..", "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const display = read("components/AIReadingDisplay.tsx");
const copy = read("components/CopyForAIButton.tsx");
const hook = read("hooks/useAIAnalysis.ts");

describe("cost control: no unintended API calls and no duplicate requests", () => {
  it("copying the prompt makes no request", () => {
    expect(copy).not.toMatch(/fetch\(|\/api\//);
  });

  it("the AI call is only started from the explicit button, never automatically", () => {
    expect(display).toMatch(/onClick=\{\(\) => \{[\s\S]*?trackEvent\("ai_interpretation_requested"[\s\S]*?onStartAI\(\)/);
    expect(display).not.toMatch(/useEffect[\s\S]{0,200}onStartAI/);
  });

  it("a second start while a request is running is ignored, not aborted and repeated", () => {
    expect(hook).toMatch(/if \(abortControllerRef\.current\) return;/);
  });
});

describe("analytics: event payloads never contain personal reading data", () => {
  it("tracks interpretation success and failure with the spread id only", () => {
    expect(hook).toMatch(/trackEvent\("ai_interpretation_succeeded", \{ spreadId: selectedSpreadId \}\)/);
    expect(hook).toMatch(/trackEvent\("ai_interpretation_failed", \{ spreadId: selectedSpreadId \}\)/);
  });

  it("the copy and interpretation events send no question or card content", () => {
    const copyCalls = copy.match(/trackEvent\([^;]*\);/g) ?? [];
    expect(copyCalls).toEqual(['trackEvent("reading_copy_for_ai", { spreadId, cardCount: drawn.length });']);
    const hookCalls = hook.match(/trackEvent\([^;]*\);/g) ?? [];
    for (const call of hookCalls) {
      expect(call).not.toMatch(/question|drawn|reading|cards:/i);
    }
  });

  it("reading_completed carries the spread and card count only", () => {
    const completed = display.match(/trackEvent\("reading_completed"[^;]*\);/g) ?? [];
    expect(completed).toEqual(['trackEvent("reading_completed", { spreadId, cardCount });']);
  });
});

describe("results: the keyword summary stays removed", () => {
  it("does not render the keyword themes line", () => {
    expect(display).not.toContain('data-testid="card-themes"');
  });
});
