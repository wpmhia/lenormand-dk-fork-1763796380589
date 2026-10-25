import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..", "..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const display = read("components/AIReadingDisplay.tsx");
const copy = read("components/CopyForAIButton.tsx");
const hook = read("hooks/useAIAnalysis.ts");

describe("prompt-first results: hierarchy and copy", () => {
  it("uses the approved heading and explanations", () => {
    expect(display).toContain("Your Reading Is Ready");
    expect(display).toContain(
      "Your question, cards, traditional meanings, combinations, and spread geometry have been prepared for AI interpretation.",
    );
    expect(display).toContain("Get an AI interpretation directly on Lenormand Intelligence.");
    expect(copy).toContain("Copy AI Prompt");
    expect(display).toContain("Copy the complete interpretation prompt and use it with ChatGPT, Claude, Gemini, or another AI.");
  });

  it("confirms a successful copy with the approved text and the AI links", () => {
    expect(copy).toContain('"Prompt Copied"');
    expect(copy).toContain("Open your preferred AI and paste the prompt to get your interpretation.");
    expect(copy).toContain("ChatGPT");
    expect(copy).toContain("Claude");
    expect(copy).toContain("Gemini");
  });

  it("the AI links open in a new tab and never put the question or cards in the URL", () => {
    const links = [...copy.matchAll(/href: "([^"]+)"/g)].map((m) => m[1]);
    expect(links.length).toBe(3);
    for (const href of links) {
      expect(href).toMatch(/^https:\/\//);
      expect(href).not.toMatch(/[?&](q|query|prompt|text)=/);
    }
    expect(copy).toContain('target="_blank"');
    expect(copy).toContain('rel="noopener noreferrer"');
  });

  it("the prompt transparency section lists only what the prompt actually contains", () => {
    expect(copy).toContain("What&apos;s Included in Your Prompt");
    expect(copy).toMatch(/exact question and the drawn cards/);
    expect(copy).toMatch(/spread geometry/);
    // Combinations are advertised only as instructions to weigh them, never as a written list.
    expect(copy).toMatch(/weigh the card combinations/);
    expect(copy).not.toMatch(/99%|accurate|guaranteed/i);
  });
});

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

describe("analytics: existing events kept, new outcome events carry no personal data", () => {
  it("keeps the existing event names", () => {
    expect(copy).toContain('"reading_copy_for_ai"');
    expect(display).toContain('"ai_interpretation_requested"');
  });

  it("tracks interpretation success and failure with the spread id only", () => {
    expect(hook).toMatch(/trackEvent\("ai_interpretation_succeeded", \{ spreadId: selectedSpreadId \}\)/);
    expect(hook).toMatch(/trackEvent\("ai_interpretation_failed", \{ spreadId: selectedSpreadId \}\)/);
  });

  it("never sends the question or card contents to analytics", () => {
    const copyCalls = copy.match(/trackEvent\([^;]*\);/g) ?? [];
    expect(copyCalls).toEqual(['trackEvent("reading_copy_for_ai", { spreadId, cardCount: drawn.length });']);
    const hookCalls = hook.match(/trackEvent\([^;]*\);/g) ?? [];
    for (const call of hookCalls) {
      expect(call).not.toMatch(/question|drawn|reading|cards:/i);
    }
  });
});

describe("results: keyword summary removed, completion tracked without personal data", () => {
  it("no longer shows the keyword 'themes' summary line in the results", () => {
    expect(display).not.toContain('data-testid="card-themes"');
  });

  it("tracks reading_completed with the spread and card count only", () => {
    expect(display).toMatch(/trackEvent\("reading_completed", \{ spreadId, cardCount \}\)/);
    const completed = display.match(/trackEvent\("reading_completed"[^;]*\);/g) ?? [];
    expect(completed).toEqual(['trackEvent("reading_completed", { spreadId, cardCount });']);
  });
});
