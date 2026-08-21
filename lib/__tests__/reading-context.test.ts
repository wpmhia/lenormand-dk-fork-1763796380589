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

    it("keeps significator neighbours inside the grid at an edge", () => {
      const ids = [29, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36];
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(ids), cardsMap, "woman");
      const sigIndex = 0;
      const sigPairs = ctx.adjacentPairs.filter((p) => p.indexA === sigIndex || p.indexB === sigIndex);

      expect(sigPairs.length).toBeGreaterThan(0);
      for (const pair of sigPairs) {
        const other = pair.indexA === sigIndex ? pair.indexB : pair.indexA;
        const row = Math.floor(other / 9);
        const col = other % 9;
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThanOrEqual(1);
        expect(col).toBeLessThanOrEqual(1);
      }
    });

    it("does not use timing-card presence as GT timing evidence", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(allIds), cardsMap);
      expect(ctx.timingEvidence).toEqual([]);
    });
  });

  describe("grand-tableau significator preference", () => {
    const sigIds = Array.from({ length: 36 }, (_, i) => i + 1);

    it("defaults to 'both' when preference not given", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(sigIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significatorPreference).toBe("both");
        // With both drawn and no person referent, there is no invented primary.
        expect(ctx.layout.primarySignificator).toBeUndefined();
        expect(ctx.layout.primarySignificatorSource).toBeUndefined();
      }
    });

    it("does NOT infer Man from a job/career-oriented question (regression: gender stereotype)", () => {
      // A career question must not automatically anchor the GT around the Man card.
      // Previously the engine did this; the audit identified it as methodologically
      // indefensible.
      const ctx = buildReadingContext(
        "grand-tableau",
        "Will my career move forward this year?",
        makeNormalizedCards(sigIds),
        cardsMap,
      );
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.primarySignificator).toBeUndefined();
        expect(ctx.layout.primarySignificatorSource).toBeUndefined();
      }
    });

    it("does NOT infer Woman from a love-oriented question when 'both' is selected", () => {
      const ctx = buildReadingContext(
        "grand-tableau",
        "Will my relationship become more committed?",
        makeNormalizedCards(sigIds),
        cardsMap,
      );
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.primarySignificator).toBeUndefined();
        expect(ctx.layout.primarySignificatorSource).toBeUndefined();
      }
    });

    it("uses male referent pronouns (he/him/his/husband) to pick Man when 'both'", () => {
      const ctx = buildReadingContext(
        "grand-tableau",
        "Will he find work that suits him?",
        makeNormalizedCards(sigIds),
        cardsMap,
      );
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.primarySignificator!.card.id).toBe(28);
        expect(ctx.layout.primarySignificatorSource).toBe("referent");
      }
    });

    it("uses female referent pronouns (she/her/wife) to pick Woman when 'both'", () => {
      const ctx = buildReadingContext(
        "grand-tableau",
        "Will she be ready to take on a new role?",
        makeNormalizedCards(sigIds),
        cardsMap,
      );
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.primarySignificator!.card.id).toBe(29);
        expect(ctx.layout.primarySignificatorSource).toBe("referent");
      }
    });

    it("selects the only drawn significator when only one is present", () => {
      const onlyManIds = sigIds.map((id) => (id === 29 ? 30 : id));
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(onlyManIds), cardsMap);
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significators.woman).toBeUndefined();
        expect(ctx.layout.significators.man).toBeDefined();
        expect(ctx.layout.primarySignificator!.card.id).toBe(28);
        expect(ctx.layout.primarySignificatorSource).toBe("default");
      }
    });

    it("sets Woman as primary when preference is 'woman'", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(sigIds), cardsMap, "woman");
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significatorPreference).toBe("woman");
        expect(ctx.layout.primarySignificator).toBeDefined();
        expect(ctx.layout.primarySignificator!.card.id).toBe(29);
        expect(ctx.layout.primarySignificatorSource).toBe("explicit");
      }
    });

    it("sets Man as primary when preference is 'man'", () => {
      const ctx = buildReadingContext("grand-tableau", "", makeNormalizedCards(sigIds), cardsMap, "man");
      if (ctx.layout.type === "grand-tableau") {
        expect(ctx.layout.significatorPreference).toBe("man");
        expect(ctx.layout.primarySignificator).toBeDefined();
        expect(ctx.layout.primarySignificator!.card.id).toBe(28);
        expect(ctx.layout.primarySignificatorSource).toBe("explicit");
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

describe("Petit Tableau pair weights match the prose hierarchy", () => {
  it("middle line pairs (3+4, 4+5) and center column pairs (1+4, 4+7) are both weight 5", () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(ids), cardsMap);
    expect(ctx.adjacentPairs.length).toBeGreaterThan(0);
    const midLineClosing = ctx.adjacentPairs.find((p) => (p.indexA === 3 && p.indexB === 4) || (p.indexA === 4 && p.indexB === 3));
    const centerColTop = ctx.adjacentPairs.find((p) => (p.indexA === 1 && p.indexB === 4) || (p.indexA === 4 && p.indexB === 1));
    const centerColBottom = ctx.adjacentPairs.find((p) => (p.indexA === 4 && p.indexB === 7) || (p.indexA === 7 && p.indexB === 4));
    expect(midLineClosing).toBeDefined();
    expect(centerColTop).toBeDefined();
    expect(centerColBottom).toBeDefined();
    expect(midLineClosing!.weight).toBe(5);
    expect(centerColTop!.weight).toBe(5);
    expect(centerColBottom!.weight).toBe(5);
  });

  it("diagonal pairs (0+4, 4+8, 2+4, 4+6) are supporting axes (weight 3)", () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(ids), cardsMap);
    const mainDiag = ctx.adjacentPairs.find((p) => (p.indexA === 0 && p.indexB === 4) || (p.indexA === 4 && p.indexB === 0));
    expect(mainDiag).toBeDefined();
    expect(mainDiag!.weight).toBe(3);
  });

  it("outer-row pairs (0+1, 1+2, 6+7, 7+8) are qualifier pairs (weight 2)", () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const ctx = buildReadingContext("comprehensive", "", makeNormalizedCards(ids), cardsMap);
    const topRowPair = ctx.adjacentPairs.find((p) => (p.indexA === 0 && p.indexB === 1) || (p.indexA === 1 && p.indexB === 0));
    expect(topRowPair).toBeDefined();
    expect(topRowPair!.weight).toBe(2);
  });
});
