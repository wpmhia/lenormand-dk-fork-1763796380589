import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { Card } from "@/lib/types";

function makeCard(id: number, name: string): Card {
  return {
    id,
    name,
    number: id,
    keywords: [name],
    uprightMeaning: `Meaning of ${name}`,
    meaning: { general: "", positive: [], negative: [] },
    combos: [],
    imageUrl: null,
  };
}

const cards: Card[] = Array.from({ length: 36 }, (_, i) => makeCard(i + 1, `Card ${i + 1}`));
const cardsMap = new Map<number, Card>(cards.map((c) => [c.id, c]));

function makeNormalizedCards(ids: number[]) {
  return ids.map((id) => ({
    id,
    name: `Card ${id}`,
    keywords: [`Card ${id}`],
  }));
}

describe("buildReadingContext", () => {
  describe("single-card", () => {
    it("builds single card layout", () => {
      const ctx = buildReadingContext("single-card", "Test question?", makeNormalizedCards([1]), cardsMap);
      expect(ctx.layout).toEqual({ type: "single" });
      expect(ctx.cards).toHaveLength(1);
      expect(ctx.adjacentPairs).toHaveLength(0);
    });
  });

  describe("sentence-3", () => {
    it("builds linear sentence layout with 3 positions", () => {
      const ctx = buildReadingContext("sentence-3", "What will happen?", makeNormalizedCards([1, 2, 3]), cardsMap);
      expect(ctx.layout.type).toBe("linear-sentence");
      if (ctx.layout.type === "linear-sentence") {
        expect(ctx.layout.positions).toHaveLength(3);
        expect(ctx.layout.positions[0].role).toBe("Opening card");
        expect(ctx.layout.positions[1].role).toBe("Central card");
        expect(ctx.layout.positions[2].role).toBe("Closing card");
      }
    });

    it("builds 2 adjacent pairs for 3 cards", () => {
      const ctx = buildReadingContext("sentence-3", "", makeNormalizedCards([1, 2, 3]), cardsMap);
      expect(ctx.adjacentPairs).toHaveLength(2);
      expect(ctx.adjacentPairs[0].cardA.id).toBe(1);
      expect(ctx.adjacentPairs[0].cardB.id).toBe(2);
      expect(ctx.adjacentPairs[1].cardA.id).toBe(2);
      expect(ctx.adjacentPairs[1].cardB.id).toBe(3);
    });
  });

  describe("sentence-5", () => {
    it("builds linear sentence layout with 5 positions", () => {
      const ctx = buildReadingContext("sentence-5", "", makeNormalizedCards([1, 2, 3, 4, 5]), cardsMap);
      expect(ctx.layout.type).toBe("linear-sentence");
      if (ctx.layout.type === "linear-sentence") {
        expect(ctx.layout.positions).toHaveLength(5);
      }
    });

    it("builds 4 adjacent pairs for 5 cards", () => {
      const ctx = buildReadingContext("sentence-5", "", makeNormalizedCards([1, 2, 3, 4, 5]), cardsMap);
      expect(ctx.adjacentPairs).toHaveLength(4);
    });
  });

  describe("petit-tableau (comprehensive)", () => {
    const petriIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    it("builds petit-tableau layout", () => {
      const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(petriIds), cardsMap);
      expect(ctx.layout.type).toBe("petit-tableau");
    });

    it("creates 3x3 grid", () => {
      const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(petriIds), cardsMap);
      if (ctx.layout.type === "petit-tableau") {
        expect(ctx.layout.grid).toHaveLength(3);
        expect(ctx.layout.grid[0]).toHaveLength(3);
        expect(ctx.layout.grid[1]).toHaveLength(3);
        expect(ctx.layout.grid[2]).toHaveLength(3);
      }
    });

    it("identifies center card at position 4 (grid[1][1])", () => {
      const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(petriIds), cardsMap);
      if (ctx.layout.type === "petit-tableau") {
        expect(ctx.layout.center.index).toBe(4);
        expect(ctx.layout.center.card.id).toBe(5);
      }
    });

    it("assigns correct card to each grid cell", () => {
      const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(petriIds), cardsMap);
      if (ctx.layout.type === "petit-tableau") {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const index = r * 3 + c;
            expect(ctx.layout.grid[r][c].card.id).toBe(petriIds[index]);
          }
        }
      }
    });

    it("builds rows, columns, and diagonals", () => {
      const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(petriIds), cardsMap);
      if (ctx.layout.type === "petit-tableau") {
        expect(ctx.layout.rows.top).toHaveLength(3);
        expect(ctx.layout.rows.middle).toHaveLength(3);
        expect(ctx.layout.rows.bottom).toHaveLength(3);

        expect(ctx.layout.columns.left).toHaveLength(3);
        expect(ctx.layout.columns.center).toHaveLength(3);
        expect(ctx.layout.columns.right).toHaveLength(3);

        expect(ctx.layout.diagonals.main).toHaveLength(3);
        expect(ctx.layout.diagonals.other).toHaveLength(3);
      }
    });

    it("includes grid adjacent pairs (horizontal + vertical + diagonal)", () => {
      const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(petriIds), cardsMap);
      expect(ctx.adjacentPairs.length).toBeGreaterThan(8);
    });
  });

  describe("grand-tableau", () => {
    const allIds = Array.from({ length: 36 }, (_, i) => i + 1);

    it("builds grand-tableau layout", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      expect(ctx.layout.type).toBe("grand-tableau");
    });

    it("creates 4x9 grid", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.grid).toHaveLength(4);
        expect(ctx.layout.grid[0]).toHaveLength(9);
        expect(ctx.layout.grid[1]).toHaveLength(9);
        expect(ctx.layout.grid[2]).toHaveLength(9);
        expect(ctx.layout.grid[3]).toHaveLength(9);
      }
    });

    it("assigns correct card to each grid cell", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 9; c++) {
            const index = r * 9 + c;
            expect(ctx.layout.grid[r][c].card.id).toBe(allIds[index]);
          }
        }
      }
    });

    it("builds 36 houses with correct names", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.houses).toHaveLength(36);
        expect(ctx.layout.houses[0].houseCardId).toBe(1);
        expect(ctx.layout.houses[0].houseName).toBe("Rider");
        expect(ctx.layout.houses[0].occupyingCard.id).toBe(1);
        expect(ctx.layout.houses[35].houseCardId).toBe(36);
        expect(ctx.layout.houses[35].occupyingCard.id).toBe(36);
      }
    });

    it("finds significator cards if present", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significators.man).toBeDefined();
        expect(ctx.layout.significators.man!.index).toBe(27);
        expect(ctx.layout.significators.man!.card.id).toBe(28);
        expect(ctx.layout.significators.woman).toBeDefined();
        expect(ctx.layout.significators.woman!.index).toBe(28);
        expect(ctx.layout.significators.woman!.card.id).toBe(29);
      }
    });

    it("has 4 corners", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.corners).toHaveLength(4);
      }
    });

    it("has 4 center cards", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.centerFour).toHaveLength(4);
      }
    });

    it("has 4 cards of fate", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.cardsOfFate).toHaveLength(4);
      }
    });

    it("finds topic cards", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.topicCards.length).toBeGreaterThan(0);
        const health = ctx.layout.topicCards.find((t) => t.topic === "health");
        expect(health).toBeDefined();
        expect(health!.card.id).toBe(5);
        const love = ctx.layout.topicCards.find((t) => t.topic === "love");
        expect(love).toBeDefined();
        expect(love!.card.id).toBe(24);
      }
    });

    it("builds 27 vertical pairs", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.verticalPairs).toHaveLength(27);
      }
    });

    it("builds mirror pairs when significator present", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.mirrors.length).toBeGreaterThan(0);
      }
    });

    it("builds adjacent pairs including vertical and signficator neighborhood", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      expect(ctx.adjacentPairs.length).toBeLessThanOrEqual(20);
      expect(ctx.adjacentPairs.length).toBeGreaterThan(5);
    });
  });

  describe("grand-tableau significator preference", () => {
    const sigIds = Array.from({ length: 36 }, (_, i) => i + 1);

    it("defaults to 'both' when preference not given", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(sigIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significatorPreference).toBe("both");
        expect(ctx.layout.primarySignificator).toBeUndefined();
      }
    });

    it("sets Woman as primary when preference is 'woman'", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(sigIds), cardsMap, "woman");
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significatorPreference).toBe("woman");
        expect(ctx.layout.primarySignificator).toBeDefined();
        expect(ctx.layout.primarySignificator!.card.id).toBe(29);
      }
    });

    it("sets Man as primary when preference is 'man'", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(sigIds), cardsMap, "man");
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significatorPreference).toBe("man");
        expect(ctx.layout.primarySignificator).toBeDefined();
        expect(ctx.layout.primarySignificator!.card.id).toBe(28);
      }
    });
  });

  describe("no significator in grand-tableau", () => {
    it("leaves significators empty when Man/Woman not present", () => {
      const noSigIds = Array.from({ length: 36 }, (_, i) => (i + 1 >= 28 ? i + 3 : i + 1));
      const normalized = noSigIds.map((id) => ({
        id,
        name: `Card ${id}`,
        keywords: [`Card ${id}`],
      }));
      const ctx = buildReadingContext("grand-tableau", "", normalized, cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significators.woman).toBeUndefined();
        expect(ctx.layout.significators.man).toBeUndefined();
        expect(ctx.layout.mirrors).toHaveLength(0);
      }
    });
  });
});
