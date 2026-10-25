import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const component = readFileSync(resolve(__dirname, "../AIReadingDisplay.tsx"), "utf8");
const picker = readFileSync(resolve(__dirname, "../AIProviderPicker.tsx"), "utf8");

describe("results: provider picker first, universal copy action, DeepSeek secondary below a divider", () => {
  const start = component.indexOf("Interpret your cards with AI");
  const section = component.slice(start, component.indexOf("<ClassicAnalysisDisclosure", start));

  it("places the provider picker before the DeepSeek action", () => {
    expect(section.indexOf("<AIProviderPicker")).toBeLessThan(section.indexOf("Get AI Interpretation"));
  });

});
