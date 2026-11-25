import { describe, it, expect } from "vitest";
import { CARD_CATALOG, CARD_NAME_TO_ID, getCardCatalogMap } from "@/lib/card-catalog";
import { CARD_TIMING_KNOWLEDGE, TIMING_CARDS } from "@/lib/timing";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSpreadFacts } from "@/lib/prompt-builder";
import { getCanonicalPairMeaning } from "@/lib/data";

/**
 * The card catalog is the single source of truth for card identity. Card 22 once drifted
 * ("Paths" vs "Crossroads"); these tests make that divergence impossible to reintroduce.
 */

describe("card catalog: canonical identity is single-sourced", () => {
  it("keeps card 22 canonical as Paths and resolves both spellings to the same id", () => {
    expect(CARD_CATALOG.find((card) => card.id === 22)?.name).toBe("Paths");
    expect(CARD_NAME_TO_ID.get("paths")).toBe(22);
    expect(CARD_NAME_TO_ID.get("crossroads")).toBe(22);
  });

  it("has 36 cards with unique ids and names, every name resolving to its own id", () => {
    expect(CARD_CATALOG).toHaveLength(36);
    expect(new Set(CARD_CATALOG.map((card) => card.id)).size).toBe(36);
    expect(new Set(CARD_CATALOG.map((card) => card.name.toLowerCase())).size).toBe(36);
    for (const card of CARD_CATALOG) {
      expect(CARD_NAME_TO_ID.get(card.name.toLowerCase()), `${card.name} must resolve to ${card.id}`).toBe(card.id);
    }
  });

  it("tracks sources for every core entry without claiming expert sign-off", () => {
    for (const card of CARD_CATALOG) {
      expect(card.meaning.reviewStatus).toMatch(/source-compared; expert review pending/);
      expect(card.meaning.sourceIds?.length, `${card.name} needs source references`).toBeGreaterThan(0);
    }
  });

  it("keeps Cross and Paths distinct and avoids single-card relationship verdicts", () => {
    const cross = CARD_CATALOG.find((card) => card.id === 36)!;
    const paths = CARD_CATALOG.find((card) => card.id === 22)!;
    const fox = CARD_CATALOG.find((card) => card.id === 14)!;
    const fish = CARD_CATALOG.find((card) => card.id === 34)!;

    expect(cross.meaning.general).toMatch(/burden.*hardship.*suffering.*duty/i);
    expect(cross.meaning.general).not.toMatch(/choice|crossroads/i);
    expect(paths.meaning.general).toMatch(/choices.*alternatives.*options.*decisions/i);
    expect(fox.meaning.general).toMatch(/work.*employment.*strategy.*self-interest/i);
    expect(fox.meaning.general).not.toMatch(/infidelity|affair/i);
    expect(fox.meaning.secondaryMeanings?.join(" ")).toMatch(/not proof of infidelity/i);
    expect(fish.meaning.general).toMatch(/money.*business.*commerce.*resources/i);
  });

  it("promotes no legacy pair text and treats pair reversal as a different key", () => {
    expect(CARD_CATALOG.every((card) => card.combos.length === 0)).toBe(true);
    const reviewedPair = [{
      firstCardId: 36,
      secondCardId: 22,
      meaning: "test fixture only",
      sourceIds: ["test-source"],
      reviewStatus: "test",
    }];
    expect(getCanonicalPairMeaning(36, 22, reviewedPair as never)).toBe("test fixture only");
    expect(getCanonicalPairMeaning(22, 36, reviewedPair as never)).toBeNull();
  });
});

describe("card catalog: downstream registries use canonical names", () => {
  it("keeps timing registries canonical", () => {
    const driftedTiming = Object.entries(CARD_TIMING_KNOWLEDGE)
      .filter(([id, knowledge]) => CARD_CATALOG.find((card) => card.id === Number(id))?.name !== knowledge.cardName)
      .map(([id, knowledge]) => `${id}: ${knowledge.cardName}`);
    expect(driftedTiming).toEqual([]);
    const driftedCards = Object.values(TIMING_CARDS)
      .filter((card) => CARD_CATALOG.find((entry) => entry.id === card.id)?.name !== card.name)
      .map((card) => `${card.id}: ${card.name}`);
    expect(driftedCards).toEqual([]);
  });

  it("announces Grand Tableau houses under the canonical deck names, also for a shuffled deck", () => {
    const cardsMap = getCardCatalogMap();
    const shuffled = [...CARD_CATALOG].sort((a, b) => (b.id * 7) % 36 - (a.id * 7) % 36);
    const drawn = shuffled.map((card) => ({
      id: card.id,
      name: card.name,
      keywords: card.keywords,
      coreMeaning: card.meaning.general,
      secondaryMeanings: card.meaning.secondaryMeanings,
    }));
    const facts = buildSpreadFacts(buildReadingContext("grand-tableau", "Full picture?", drawn, cardsMap));

    const houseNames = facts
      .split("\n")
      .map((line) => line.match(/ — ([\w ]+) house$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => match[1]);

    expect(houseNames).toEqual(CARD_CATALOG.map((card) => card.name));
    expect(facts).not.toContain("Crossroads house");
  });
});
