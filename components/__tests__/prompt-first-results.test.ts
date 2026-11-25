import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..", "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const display = read("components/AIReadingDisplay.tsx");
const copy = read("components/CopyForAIButton.tsx");
const hook = read("hooks/useAIAnalysis.ts");

describe("cost control and privacy: no unintended API calls, no personal data in analytics", () => {
  it("copying the prompt makes no request, and the AI call starts only from the explicit button", () => {
    expect(copy).not.toMatch(/fetch\(|\/api\//);
    expect(display).toMatch(/onClick=\{\(\) => \{[\s\S]*?trackEvent\("ai_interpretation_requested"[\s\S]*?onStartAI\(\)/);
    expect(display).not.toMatch(/useEffect[\s\S]{0,200}onStartAI/);
  });

  it("a second start while a request is running is ignored, not aborted and repeated", () => {
    expect(hook).toMatch(/if \(abortControllerRef\.current\) return;/);
  });

  it("analytics events carry the spread id and card count only, never question or card content", () => {
    expect(hook).toMatch(/trackEvent\("ai_interpretation_succeeded", \{ spreadId: selectedSpreadId \}\)/);
    expect(hook).toMatch(/trackEvent\("ai_interpretation_failed", \{ spreadId: selectedSpreadId \}\)/);
    const tracked = [copy.match(/trackEvent\([^;]*\);/g) ?? [], display.match(/trackEvent\("reading_completed"[^;]*\);/g) ?? [], hook.match(/trackEvent\([^;]*\);/g) ?? []].flat();
    expect(tracked).toContain('trackEvent("reading_copy_for_ai", { spreadId, cardCount: drawn.length });');
    expect(tracked).toContain('trackEvent("reading_completed", { spreadId, cardCount });');
    for (const call of tracked) {
      expect(call, call).not.toMatch(/question|drawn\.length > 0|cards:|reading: /i);
    }
  });
});
