import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { getDefinition } from "@/lib/spread-definitions";

/**
 * ReadingContext is deliberately small: cards, their layout, and explicit bindings.
 *
 * This suite checks the input invariants that must survive any refactor — order is
 * preserved, layout facts are positional and true — and asserts the fields that were
 * removed stay removed, so a heuristic cannot quietly reappear in the context layer.
 */

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, position: i };
  });
}

describe("reading-context: input invariants", () => {
  it("preserves the exact draw order it was given", () => {
    const cards = draw(5, 11);
    const ctx = buildReadingContext("sentence-5", "Will I move?", cards, cardsMap);
    expect(ctx.cards.map((card) => card.id)).toEqual(cards.map((card) => card.id));
  });

  it("keeps the exact question it was given", () => {
    const ctx = buildReadingContext("sentence-3", "Hoe ontwikkelt mijn relatie zich?", draw(3), cardsMap);
    expect(ctx.question).toBe("Hoe ontwikkelt mijn relatie zich?");
  });

  it("keeps the exact situation context it was given", () => {
    const ctx = buildReadingContext("sentence-3", "Q?", draw(3), cardsMap, "both", "We live apart.");
    expect(ctx.situationContext).toBe("We live apart.");
  });
});

describe("reading-context: layout is positional and factual", () => {
  it("gives a single-card spread a single layout", () => {
    expect(buildReadingContext("single-card", "Q?", draw(1), cardsMap).layout.type).toBe("single");
  });

  it("sources the 3-card roles from the canonical spread definition", () => {
    const ctx = buildReadingContext("sentence-3", "Q?", draw(3), cardsMap);
    expect(ctx.layout.type).toBe("linear-sentence");
    if (ctx.layout.type !== "linear-sentence") return;
    const defined = getDefinition("sentence-3")?.positions ?? [];
    expect(ctx.layout.positions.map((p) => p.role)).toEqual(defined.map((p) => p.label));
    expect(ctx.layout.positions.map((p) => p.role)).toEqual(["Opening", "Central", "Closing"]);
  });

  /**
   * The prompt and the UI must describe a line identically. If this ever fails, the
   * product is teaching one method while the model reads another.
   */
  it("sources every linear spread's roles from the canonical spread definition", () => {
    for (const id of ["sentence-3", "sentence-5"] as const) {
      const ctx = buildReadingContext(id, "Q?", draw(id === "sentence-3" ? 3 : 5), cardsMap);
      if (ctx.layout.type !== "linear-sentence") throw new Error("expected a line");
      const defined = getDefinition(id)?.positions ?? [];
      expect(ctx.layout.positions.map((p) => p.role), id).toEqual(defined.map((p) => p.label));
    }
  });

  it("gives the 5-card line neutral ordinal roles, not an outcome position", () => {
    const ctx = buildReadingContext("sentence-5", "Q?", draw(5), cardsMap);
    if (ctx.layout.type !== "linear-sentence") throw new Error("expected a line");
    expect(ctx.layout.positions.map((p) => p.role)).toEqual([
      "First card",
      "Second card",
      "Third card",
      "Fourth card",
      "Fifth card",
    ]);
    for (const position of ctx.layout.positions) {
      expect(position.role).not.toMatch(/outcome|result|answer|foundation|subject|focus/i);
    }
  });

  it("puts the Petit Tableau centre on position 5", () => {
    const ctx = buildReadingContext("comprehensive", "Q?", draw(9, 3), cardsMap);
    expect(ctx.layout.type).toBe("petit-tableau");
    if (ctx.layout.type !== "petit-tableau") return;
    expect(ctx.layout.center.index).toBe(4);
    expect(ctx.layout.center.card.id).toBe(draw(9, 3)[4].id);
  });

  it("supplies all 36 canonical houses for a Grand Tableau", () => {
    const ctx = buildReadingContext("grand-tableau", "Q?", draw(36, 7), cardsMap);
    if (ctx.layout.type !== "grand-tableau") throw new Error("expected a tableau");
    expect(ctx.layout.houses).toHaveLength(36);
    expect(ctx.layout.houses.map((house) => house.houseName)).toEqual(deck.map((card) => card.name));
  });

  it("locates the significators by their card id", () => {
    const cards = draw(36, 7);
    const ctx = buildReadingContext("grand-tableau", "Q?", cards, cardsMap);
    if (ctx.layout.type !== "grand-tableau") throw new Error("expected a tableau");
    const manIndex = cards.findIndex((card) => card.id === 28);
    const womanIndex = cards.findIndex((card) => card.id === 29);
    expect(ctx.layout.significators.man?.index).toBe(manIndex);
    expect(ctx.layout.significators.woman?.index).toBe(womanIndex);
  });
});

describe("reading-context: significator preference is focus metadata, not identity", () => {
  it("keeps the default preference without creating person bindings", () => {
    const ctx = buildReadingContext("sentence-3", "Will my husband and I stay together?", draw(3), cardsMap);
    expect(ctx.significatorPreference).toBe("both");
    expect(ctx).not.toHaveProperty("personBindings");
  });

  it("preserves an explicit preference as focus metadata only", () => {
    const ctx = buildReadingContext("grand-tableau", "Q?", draw(36, 7), cardsMap, "man");
    expect(ctx.significatorPreference).toBe("man");
    expect(ctx).not.toHaveProperty("personBindings");
  });
});

describe("reading-context: the removed heuristic fields stay removed", () => {
  it("carries no question domain, frame, semantic question, subjects, timing or topics", () => {
    const ctx = buildReadingContext("grand-tableau", "Will I move to the Netherlands?", draw(36), cardsMap) as unknown as Record<string, unknown>;
    for (const removed of [
      "questionDomain",
      "questionFrame",
      "semanticQuestion",
      "questionSubjects",
      "timingEvidence",
      "topicFocus",
      "adjacentPairs",
    ]) {
      expect(ctx[removed], `${removed} must not reappear`).toBeUndefined();
    }
  });

  it("carries no layout internals that only the retired evidence engine used", () => {
    const ctx = buildReadingContext("grand-tableau", "Q?", draw(36), cardsMap);
    const layout = ctx.layout as unknown as Record<string, unknown>;
    for (const removed of ["grid", "rows", "corners", "centerFour", "topicCards", "verticalPairs", "mirrors", "primarySignificator"]) {
      expect(layout[removed], `${removed} must not reappear`).toBeUndefined();
    }
  });
});
