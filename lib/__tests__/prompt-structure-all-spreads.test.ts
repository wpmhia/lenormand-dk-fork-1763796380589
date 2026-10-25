import { describe, expect, it } from "vitest";
import { buildCopyForAIText } from "@/lib/copy-for-ai";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { SPREAD_DEFINITIONS, type SpreadId } from "@/lib/spread-definitions";

const SPREADS: [SpreadId, number][] = [
  ["single-card", 1],
  ["sentence-3", 3],
  ["sentence-5", 5],
  ["comprehensive", 9],
  ["grand-tableau", 36],
];

const drawn = (count: number) => CARD_CATALOG.slice(0, count).map((c, i) => ({ id: c.id, position: i }));
const nameOf = (id: number) => CARD_CATALOG.find((c) => c.id === id)!.name;

describe("prompt structure: every spread carries the same canonical facts", () => {
  it.each(SPREADS)("%s (%i cards) has the header, the sections and the response format", (spread, count) => {
    const text = buildCopyForAIText(spread, "Will this move forward?", drawn(count));
    expect(text.startsWith("LENORMAND INTELLIGENCE\n")).toBe(true);
    expect(text).toContain("## Instructions");
    expect(text).toContain("## Reading facts");
    expect(text).toContain("## Output format");
    expect(text).toContain("Will this move forward?");
  });

  it.each(SPREADS)("%s states the spread label from the definition", (spread) => {
    const text = buildCopyForAIText(spread, "Q", drawn(SPREAD_DEFINITIONS[spread].cardCount));
    expect(text).toContain(SPREAD_DEFINITIONS[spread].label);
  });

  it.each(SPREADS)("%s names every drawn card at least once in the copied text", (spread, count) => {
    const cards = drawn(count);
    const text = buildCopyForAIText(spread, "Q", cards);
    // Petit Tableau and Grand Tableau are supplied as grids, so every card still appears by name.
    for (const card of cards) {
      expect(text, `${spread}: ${nameOf(card.id)}`).toContain(nameOf(card.id));
    }
  });

  it.each(SPREADS)("%s uses the same instructions as the API path, except the one work-order sentence", (spread, count) => {
    const text = buildCopyForAIText(spread, "Q", drawn(count));
    expect(text).toContain("Interpret the supplied card geometry literally.");
    expect(text).toContain("Keep symbolic indications distinct from verified facts.");
  });

  it("the copied text makes no unsupported accuracy or model-ranking claim", () => {
    for (const [spread, count] of SPREADS) {
      const text = buildCopyForAIText(spread, "Q", drawn(count));
      expect(text).not.toMatch(/99%|guaranteed|most accurate|best model|accurate reading/i);
    }
  });

  it("the copied text never refers to the app, an API or an internal route", () => {
    for (const [spread, count] of SPREADS) {
      const text = buildCopyForAIText(spread, "Q", drawn(count));
      expect(text).not.toMatch(/\bAPI\b|\bendpoint\b|\broute\b|\bcookie\b|localStorage|deepseek/i);
    }
  });
});
