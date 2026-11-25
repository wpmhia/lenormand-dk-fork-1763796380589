import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const shared = readFileSync(resolve(__dirname, "../../app/read/shared/[encoded]/page.tsx"), "utf8");
const newPage = readFileSync(resolve(__dirname, "../../app/read/new/page.tsx"), "utf8");

describe("shared reading: safety", () => {
  it("shows no paywall on errors and offers a plain retry", () => {
    expect(shared).not.toContain("Premium Spread");
    expect(shared).not.toContain("Unlock with Support Code");
    expect(shared).not.toMatch(/window\.location\.href = "\/support"/);
    expect(shared).toContain("We couldn&apos;t generate this interpretation");
  });

  it("a timed-out or superseded request cannot apply late", () => {
    expect(shared).toContain("const controller = new AbortController();");
    expect(shared).toMatch(/fetch\("\/api\/readings\/interpret"[\s\S]*?signal: controller\.signal/);
    const timeout = shared.slice(shared.indexOf("timeoutRef.current = setTimeout"), shared.indexOf("}, 59000);"));
    expect(timeout).toContain("controller.abort();");
    expect(shared).toMatch(/if \(mountedRef\.current && requestRef\.current === controller\)/);
    expect(shared).toMatch(/if \(controller\.signal\.aborted\) return;/);
  });

  it("maps only the supported layouts 1, 3, 5, 9 and 36, with no silent reinterpretation", () => {
    const mapping = shared.slice(shared.indexOf("function getSpreadIdFromLayoutType"), shared.indexOf("export default function SharedReadingPage"));
    for (const layout of [1, 3, 5, 9, 36]) expect(mapping).toContain(`case ${layout}:`);
    expect(mapping).not.toContain("case 7:");
    expect(mapping).toMatch(/default:\s*return null;/);
    expect(shared).toMatch(/const spreadId = getSpreadIdFromLayoutType\(reading\.layoutType\);\s*if \(!spreadId\) return null;/);
  });

  it("going back on the new-reading page resets the AI request state", () => {
    const back = newPage.slice(newPage.indexOf("const handleBack"), newPage.indexOf("// Handle virtual deck draw"));
    expect(back).toContain("resetAnalysis();");
    expect(back).toContain("setAiRequested(false);");
  });
});
