import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { significatorToPreference } from "@/lib/significator";
import { buildCopyForAIText } from "@/lib/copy-for-ai";
import { CARD_CATALOG } from "@/lib/card-catalog";

const read = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf8");

describe("significator choice: one mapping for every path", () => {
  it("maps the UI choice to the reading preference", () => {
    expect(significatorToPreference("anima")).toBe("woman");
    expect(significatorToPreference("animus")).toBe("man");
    expect(significatorToPreference("none")).toBe("both");
  });

  it("the AI hook uses the shared mapping, not a private copy", () => {
    const hook = read("hooks/useAIAnalysis.ts");
    expect(hook).toContain('from "@/lib/significator"');
    expect(hook).not.toMatch(/function significatorToPreference/);
  });
});

describe("significator choice: reaches the AI prompt from the results page", () => {
  it("the results page passes the mapped preference to the result component", () => {
    expect(read("app/read/new/page.tsx")).toMatch(/significatorPreference=\{significatorToPreference\(significatorType\)\}/);
  });

  it("the result component uses it in the prompt it builds for the provider picker", () => {
    const component = read("components/AIReadingDisplay.tsx");
    expect(component).toMatch(/significatorPreference=\{props\.significatorPreference\}/);
    expect(component).toMatch(/buildCopyForAIText\(spreadId, question, drawn, significatorPreference\)/);
  });

  it("the copy panel builds the shared prompt with the selected focus", () => {
    expect(read("components/AIReadingDisplay.tsx")).toMatch(
      /getPromptText=\{\(\) => buildCopyForAIText\(spreadId, question, drawn, significatorPreference\)\}/,
    );
  });
});

describe("significator choice: the copied text carries the selected focus", () => {
  const woman = CARD_CATALOG.find((c) => c.name === "Woman")!.id;
  const rider = CARD_CATALOG.find((c) => c.name === "Rider")!.id;
  const clover = CARD_CATALOG.find((c) => c.name === "Clover")!.id;
  const cards = [
    { id: woman, position: 0 },
    { id: rider, position: 1 },
    { id: clover, position: 2 },
  ];

  it("includes 'Reading focus: Woman.' when the woman focus is chosen", () => {
    const text = buildCopyForAIText("sentence-3", "Q", cards, significatorToPreference("anima"));
    expect(text).toContain("Reading focus: Woman.");
  });

  it("includes no focus line when no significator is chosen", () => {
    const text = buildCopyForAIText("sentence-3", "Q", cards, significatorToPreference("none"));
    expect(text).not.toContain("Reading focus");
  });
});
