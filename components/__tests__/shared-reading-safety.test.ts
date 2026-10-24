import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const shared = readFileSync(resolve(__dirname, "../../app/read/shared/[encoded]/page.tsx"), "utf8");
const newPage = readFileSync(resolve(__dirname, "../../app/read/new/page.tsx"), "utf8");

describe("shared reading: errors never show a paywall", () => {
  it("contains no premium, unlock or support-code wording", () => {
    expect(shared).not.toContain("Premium Spread");
    expect(shared).not.toContain("Unlock with Support Code");
    expect(shared).not.toMatch(/window\.location\.href = "\/support"/);
  });

  it("offers a plain retry for a failed interpretation", () => {
    expect(shared).toContain("We couldn&apos;t generate this interpretation");
    expect(shared).toMatch(/onClick=\{\(\) => reading\?\.cards && performAIAnalysis\(reading\.cards\)\}/);
  });
});

describe("shared reading: a timed-out or superseded request cannot apply late", () => {
  it("creates an AbortController per request and passes its signal to fetch", () => {
    expect(shared).toContain("const controller = new AbortController();");
    expect(shared).toMatch(/fetch\("\/api\/readings\/interpret"[\s\S]*?signal: controller\.signal/);
  });

  it("aborts the in-flight request when the timeout fires", () => {
    const timeout = shared.slice(shared.indexOf("timeoutRef.current = setTimeout"), shared.indexOf("}, 59000);"));
    expect(timeout).toContain("controller.abort();");
  });

  it("applies a result only while its request is still the current one", () => {
    expect(shared).toMatch(/if \(mountedRef\.current && requestRef\.current === controller\)/);
  });

  it("does not report an aborted request as an error", () => {
    expect(shared).toMatch(/if \(controller\.signal\.aborted\) return;/);
  });
});

describe("shared reading: layouts are never silently reinterpreted", () => {
  const mapping = shared.slice(shared.indexOf("function getSpreadIdFromLayoutType"), shared.indexOf("export default function SharedReadingPage"));

  it("maps only the supported layouts 1, 3, 5, 9 and 36", () => {
    for (const layout of [1, 3, 5, 9, 36]) expect(mapping).toContain(`case ${layout}:`);
  });

  it("has no 7-card or default-to-3 branch", () => {
    expect(mapping).not.toContain("case 7:");
    expect(mapping).not.toContain('return "sentence-3"; // default');
    expect(mapping).toMatch(/default:\s*return null;/);
  });

  it("shows no classic analysis for an unknown layout", () => {
    expect(shared).toMatch(/const spreadId = getSpreadIdFromLayoutType\(reading\.layoutType\);\s*if \(!spreadId\) return null;/);
  });
});

describe("new reading: going back resets the AI request state", () => {
  it("clears aiRequested when leaving the results step", () => {
    const back = newPage.slice(newPage.indexOf("const handleBack"), newPage.indexOf("// Handle virtual deck draw"));
    expect(back).toContain("resetAnalysis();");
    expect(back).toContain("setAiRequested(false);");
  });
});
