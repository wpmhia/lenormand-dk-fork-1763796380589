import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const component = readFileSync(resolve(__dirname, "../AIReadingDisplay.tsx"), "utf8");
const copy = readFileSync(resolve(__dirname, "../CopyForAIButton.tsx"), "utf8");

describe("results: one clear primary action (Copy AI Prompt), AI interpretation secondary", () => {
  const groupStart = component.indexOf("Your Reading Is Ready");
  const group = component.slice(groupStart, component.indexOf("<ClassicAnalysisDisclosure", groupStart));

  it("centres the heading and the explanation above the actions", () => {
    expect(component).toMatch(/flex flex-col items-center gap-4 border-t border-border\/60 pt-6 text-center/);
    expect(group.indexOf("Your Reading Is Ready")).toBeLessThan(group.indexOf("<CopyForAIButton"));
  });

  it("places the copy prompt action before the AI interpretation action", () => {
    expect(group.indexOf("<CopyForAIButton")).toBeLessThan(group.indexOf("Get AI Interpretation"));
  });

  it("gives the primary copy action the default (gold) variant and the AI action the outline variant", () => {
    expect(copy).toMatch(/<Button\s+onClick=\{handleCopy\}/);
    expect(copy).not.toMatch(/variant="outline"\s+onClick=\{handleCopy\}/);
    expect(group).toMatch(/variant="outline"[\s\S]*?Get AI Interpretation/);
  });

  it("keeps the failure message out of the row so the buttons stay level", () => {
    expect(copy).toMatch(/basis-full/);
    expect(copy).toMatch(/sm:order-last/);
  });

  it("gives the primary action the same height and full width on mobile", () => {
    expect(copy).toMatch(/className="h-12 w-full gap-2 sm:w-auto"/);
    expect(group).toMatch(/className="h-12 w-full sm:w-auto"/);
  });
});
