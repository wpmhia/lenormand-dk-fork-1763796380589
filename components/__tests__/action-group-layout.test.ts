import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const component = readFileSync(resolve(__dirname, "../AIReadingDisplay.tsx"), "utf8");
const copy = readFileSync(resolve(__dirname, "../CopyForAIButton.tsx"), "utf8");

describe("results action group: one centred row on desktop, stacked full width on mobile", () => {
  const groupStart = component.indexOf("Explore how the cards connect to your question.");
  const group = component.slice(groupStart - 400, component.indexOf("<ClassicAnalysisDisclosure", groupStart));

  it("centres the introduction above the buttons", () => {
    expect(component).toMatch(/flex flex-col items-center gap-4 border-t border-border\/60 pt-6 text-center/);
    expect(group.indexOf("Explore how the cards")).toBeLessThan(group.indexOf("Get AI Interpretation"));
  });

  it("puts both buttons in one row on desktop, centred, and stacks them full width on mobile", () => {
    expect(group).toMatch(/flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center/);
  });

  it("gives both buttons the same height", () => {
    expect(group).toMatch(/Get AI Interpretation/);
    expect(group).toMatch(/className="h-12 w-full sm:w-auto"/);
    expect(copy).toMatch(/className="h-12 w-full gap-2 sm:w-auto"/);
  });

  it("keeps the failure message out of the row so the buttons stay level", () => {
    expect(copy).toMatch(/basis-full/);
    expect(copy).toMatch(/sm:order-last/);
  });

  it("keeps the AI button as the primary variant and the copy button as outline", () => {
    expect(group).not.toMatch(/variant="outline"/);
    expect(copy).toMatch(/variant="outline"/);
  });
});
