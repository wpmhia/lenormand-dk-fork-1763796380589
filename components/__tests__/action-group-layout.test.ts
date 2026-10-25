import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const component = readFileSync(resolve(__dirname, "../AIReadingDisplay.tsx"), "utf8");
const picker = readFileSync(resolve(__dirname, "../AIProviderPicker.tsx"), "utf8");

describe("results: provider picker first, universal copy action, DeepSeek secondary below a divider", () => {
  const start = component.indexOf("Interpret with Your AI");
  const section = component.slice(start, component.indexOf("<ClassicAnalysisDisclosure", start));

  it("centres the section above the actions", () => {
    expect(component).toMatch(/flex flex-col items-center gap-6 border-t border-border\/60 pt-6 text-center/);
  });

  it("places the provider picker before the DeepSeek action", () => {
    expect(section.indexOf("<AIProviderPicker")).toBeLessThan(section.indexOf("Get AI Interpretation"));
  });

  it("separates the DeepSeek action with a divider and makes it the outline variant", () => {
    expect(section).toMatch(/border-t border-border\/60 pt-6/);
    expect(section).toMatch(/variant="outline"[\s\S]*?Get AI Interpretation/);
  });

  it("the universal copy action is the default (gold) primary variant and full width on mobile", () => {
    expect(picker).toMatch(/<Button\s+onClick=\{handleAny\}/);
    expect(picker).toMatch(/className="h-12 w-full gap-2 sm:w-auto"/);
    expect(picker).not.toMatch(/variant="outline"\s+onClick=\{handleAny\}/);
  });

  it("the provider buttons are a three-column grid on mobile", () => {
    expect(picker).toMatch(/grid w-full grid-cols-3/);
  });
});
