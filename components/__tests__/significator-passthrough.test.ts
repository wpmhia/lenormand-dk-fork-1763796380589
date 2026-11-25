import { describe, expect, it } from "vitest";
import { significatorToPreference } from "@/lib/significator";
import { buildCopyForAIText } from "@/lib/copy-for-ai";
import { CARD_CATALOG } from "@/lib/card-catalog";

describe("significator choice: one mapping, carried into the copied prompt", () => {
  it("maps the UI choice to the reading preference", () => {
    expect(significatorToPreference("anima")).toBe("woman");
    expect(significatorToPreference("animus")).toBe("man");
    expect(significatorToPreference("none")).toBe("both");
  });

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
