import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..", "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/**
 * Architecture guard: DeepSeek must start only from an explicit user action. These checks read the
 * source so a future edit that restores an automatic model call fails the build.
 */
/** The body of every useEffect in the source, each read up to its own dependency list. */
function effectBodies(source: string): string[] {
  return source.split("useEffect(").slice(1).map((chunk) => chunk.split(/\}, \[/)[0]);
}

describe("no automatic AI generation", () => {
  it("the results page never starts analysis from an effect", () => {
    const source = read("app/read/new/page.tsx");
    for (const body of effectBodies(source)) {
      expect(body).not.toMatch(/startAnalysis\(/);
    }
    expect(source).toMatch(/const startAI = useCallback\(/);
    expect(source).toMatch(/onStartAI=\{startAI\}/);
  });

  it("the shared-reading page starts analysis only from its button or retry", () => {
    const source = read("app/read/shared/[encoded]/page.tsx");
    for (const body of effectBodies(source)) {
      expect(body).not.toMatch(/performAIAnalysis\(/);
    }
    expect(source).toMatch(/onStartAI=\{startSharedAI\}/);
  });

  it("the classic analysis module imports no model or network code", () => {
    const source = read("lib/classic-analysis.ts");
    expect(source).not.toMatch(/from ["']ai["']|@ai-sdk|fetch\(|reading-service|ai-model/);
  });

  it("every model route consults the central access gate before generating", () => {
    for (const route of ["app/api/readings/interpret/route.ts", "app/api/readings/followup/route.ts"]) {
      const source = read(route);
      expect(source).toMatch(/canGenerateAIReading\(/);
      const gateAt = source.indexOf("canGenerateAIReading(");
      const modelAt = source.search(/generateReading\(|generateModelText\(/);
      expect(gateAt, route).toBeGreaterThan(-1);
      expect(gateAt, route).toBeLessThan(modelAt);
    }
  });
});
