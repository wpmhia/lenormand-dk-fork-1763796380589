import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(__dirname, "..", "..");
const ROOTS = ["app", "components", "hooks", "lib"];

function sourceFiles(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(root, dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(join(dir, name));
    return /\.(tsx|ts|css)$/.test(name) && !/\.test\./.test(name) ? [join(dir, name)] : [];
  });
}

describe("visual polish: no decorative sparkle, glow or pulse in user-facing code", () => {
  const files = ROOTS.flatMap(sourceFiles);

  it("contains no sparkle emoji in any user-facing source file", () => {
    for (const file of files) {
      expect(readFileSync(join(root, file), "utf8"), file).not.toContain("✨");
    }
  });

  it("imports no Sparkles icon", () => {
    for (const file of files) {
      expect(readFileSync(join(root, file), "utf8"), file).not.toMatch(/\bSparkles\b/);
    }
  });

  it("uses no AI glow class on the reading path", () => {
    for (const file of files) {
      expect(readFileSync(join(root, file), "utf8"), file).not.toContain("consulting-glow");
    }
  });

  it("keeps the AI button on the shared Button primary variant with no icon", () => {
    const source = readFileSync(join(root, "components/AIReadingDisplay.tsx"), "utf8");
    const button = source.match(/<Button\s+onClick=\{\(\) => \{[\s\S]*?\}\}\s+className="[^"]*"\s*>([\s\S]*?)<\/Button>/);
    expect(button).not.toBeNull();
    expect(button![0]).not.toMatch(/variant=/);
    expect(button![0]).not.toMatch(/<[A-Z][A-Za-z]*\s+className="h-/);
    expect(button![1].trim()).toBe("Get AI Interpretation");
  });
});
