import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..", "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

/**
 * Architecture guard: the model must start only from an explicit user action, behind the
 * central access gate. These checks read the source so a future edit that restores an
 * automatic model call fails the build.
 */

/** The body of every useEffect in the source, each read up to its own dependency list. */
function effectBodies(source: string): string[] {
  return source.split("useEffect(").slice(1).map((chunk) => chunk.split(/\}, \[/)[0]);
}

describe("no automatic AI generation", () => {
  it("never starts analysis from an effect on the results page or the shared-reading page", () => {
    for (const source of [read("app/read/new/page.tsx"), read("app/read/shared/[encoded]/page.tsx")]) {
      for (const body of effectBodies(source)) {
        expect(body).not.toMatch(/startAnalysis\(|performAIAnalysis\(/);
      }
    }
    expect(read("app/read/new/page.tsx")).toMatch(/onStartAI=\{startAI\}/);
    expect(read("app/read/shared/[encoded]/page.tsx")).toMatch(/onStartAI=\{startSharedAI\}/);
  });

  it("keeps the classic analysis model-free and puts every model route behind the central access gate first", () => {
    expect(read("lib/classic-analysis.ts")).not.toMatch(/from ["']ai["']|@ai-sdk|fetch\(|reading-service|ai-model/);
    for (const route of ["app/api/readings/interpret/route.ts", "app/api/readings/followup/route.ts"]) {
      const source = read(route);
      const gateAt = source.indexOf("canGenerateAIReading(");
      const modelAt = source.search(/generateReading\(|generateModelText\(/);
      expect(gateAt, route).toBeGreaterThan(-1);
      expect(gateAt, route).toBeLessThan(modelAt);
    }
  });
});
