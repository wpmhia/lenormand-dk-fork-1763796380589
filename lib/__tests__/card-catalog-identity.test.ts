import { describe, it, expect } from "vitest";
import { CARD_CATALOG, CARD_NAME_TO_ID, getCardCatalogMap } from "@/lib/card-catalog";
import { CARD_TIMING_KNOWLEDGE, TIMING_CARDS } from "@/lib/timing";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSpreadFacts } from "@/lib/prompt-builder";

/**
 * The card catalog is the single source of truth for card identity.
 *
 * This file exists because card 22 drifted: cards.json calls it "Paths", while the
 * Grand Tableau house grid announced "Crossroads" and the alias table listed "paths" —
 * which duplicated the canonical name while omitting the traditional one. The model was
 * therefore handed two names for a single card. These tests make that divergence
 * impossible to reintroduce silently.
 */

describe("card catalog: canonical identity is single-sourced", () => {
  it("keeps card 22 canonical as Paths", () => {
    expect(CARD_CATALOG.find((card) => card.id === 22)?.name).toBe("Paths");
  });

  it("resolves both the canonical and the traditional name to the same id", () => {
    expect(CARD_NAME_TO_ID.get("paths")).toBe(22);
    expect(CARD_NAME_TO_ID.get("crossroads")).toBe(22);
  });

  it("does not list an alias that duplicates a canonical name", () => {
    const canonicalNames = new Set(CARD_CATALOG.map((card) => card.name.toLowerCase()));
    for (const [name, id] of CARD_NAME_TO_ID) {
      if (canonicalNames.has(name)) {
        expect(CARD_CATALOG.find((card) => card.id === id)?.name.toLowerCase(), `alias "${name}" duplicates a canonical name`).toBe(name);
      }
    }
  });

  it("maps every canonical card name to its own id", () => {
    for (const card of CARD_CATALOG) {
      expect(CARD_NAME_TO_ID.get(card.name.toLowerCase()), `${card.name} must resolve to ${card.id}`).toBe(card.id);
    }
  });

  it("has a unique id and a unique name for all 36 cards", () => {
    expect(CARD_CATALOG).toHaveLength(36);
    expect(new Set(CARD_CATALOG.map((card) => card.id)).size).toBe(36);
    expect(new Set(CARD_CATALOG.map((card) => card.name.toLowerCase())).size).toBe(36);
  });

  it("exposes the catalog map keyed by id", () => {
    const map = getCardCatalogMap();
    expect(map.size).toBe(36);
    expect(map.get(22)?.name).toBe("Paths");
  });
});

describe("card catalog: downstream registries use canonical names", () => {
  it("names card 22 canonically in the timing knowledge registry", () => {
    expect(CARD_TIMING_KNOWLEDGE[22]?.cardName).toBe("Paths");
  });

  it("keeps every timing knowledge cardName canonical", () => {
    const drifted = Object.entries(CARD_TIMING_KNOWLEDGE)
      .filter(([id, knowledge]) => CARD_CATALOG.find((card) => card.id === Number(id))?.name !== knowledge.cardName)
      .map(([id, knowledge]) => `${id}: ${knowledge.cardName}`);
    expect(drifted).toEqual([]);
  });

  it("keeps every timing card name canonical", () => {
    const drifted = Object.values(TIMING_CARDS)
      .filter((card) => CARD_CATALOG.find((entry) => entry.id === card.id)?.name !== card.name)
      .map((card) => `${card.id}: ${card.name}`);
    expect(drifted).toEqual([]);
  });

  it("announces Grand Tableau houses under the canonical deck names", () => {
    const cardsMap = getCardCatalogMap();
    const drawn = CARD_CATALOG.map((card) => ({ id: card.id, name: card.name, keywords: card.keywords }));
    const facts = buildSpreadFacts(buildReadingContext("grand-tableau", "Full picture?", drawn, cardsMap));

    const houseNames = facts
      .split("\n")
      .map((line) => line.match(/, ([^,]+) house$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => match[1]);

    expect(houseNames).toEqual(CARD_CATALOG.map((card) => card.name));
    // A deck that is shuffled must still name houses canonically.
    expect(facts).not.toContain("Crossroads house");
  });
});