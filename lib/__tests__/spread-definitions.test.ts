import { describe, it, expect } from "vitest";
import { SPREAD_DEFINITIONS, SPREAD_IDS, getDefinition, getCardCount, getLayoutType, type SpreadDefinition } from "@/lib/spread-definitions";
import { VALID_SPREADS, SpreadId } from "@/lib/reading-contract";
import { COMPREHENSIVE_SPREADS } from "@/lib/spreads";
import { getPositionInfo } from "@/components/reading/SpreadPositions";

describe("SPREAD_DEFINITIONS", () => {
  it("all definitions have unique ids", () => {
    const ids = Object.values(SPREAD_DEFINITIONS).map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all definitions have positive cardCount", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS)) {
      expect(def.cardCount).toBeGreaterThan(0);
    }
  });

  it("every definition has a known layoutType", () => {
    const validTypes = ["single", "linear-sentence", "petit-tableau", "grand-tableau"];
    for (const def of Object.values(SPREAD_DEFINITIONS)) {
      expect(validTypes).toContain(def.layoutType);
    }
  });

  it("every spread used by reading-contract has a definition", () => {
    for (const id of Object.keys(VALID_SPREADS)) {
      expect(getDefinition(id)).toBeDefined();
    }
  });

  it("every spread used by context has a definition", () => {
    for (const id of SPREAD_IDS) {
      expect(getDefinition(id)).toBeDefined();
    }
  });
});

describe("SPREAD_DEFINITIONS is the canonical spread method", () => {
  /**
   * The UI explains a spread from this file and the prompt lays it out from this file, so
   * they cannot describe different methods. If pedagogy asserts an outcome slot or a main
   * line that the model is deliberately free to weigh itself, the product teaches one
   * method while the model reads another.
   */
  it("never asserts a deterministic outcome, focus or hierarchy in any spread text", () => {
    const forbidden = /\b(outcome|resolution|verdict|focus|main line|underlying|subject|action slot)\b/i;
    for (const def of Object.values(SPREAD_DEFINITIONS) as SpreadDefinition[]) {
      expect(def.description, `${def.id} description`).not.toMatch(forbidden);
      for (const position of def.positions ?? []) {
        expect(position.label, `${def.id} position ${position.index} label`).not.toMatch(forbidden);
        expect(position.meaning, `${def.id} position ${position.index} meaning`).not.toMatch(forbidden);
      }
    }
  });

  it("marks `tradition` explicitly and drops the misleading isAuthentic flag", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS) as SpreadDefinition[]) {
      expect(["traditional", "modern"]).toContain(def.tradition);
      expect(def as unknown as Record<string, unknown>).not.toHaveProperty("isAuthentic");
    }
    expect(getDefinition("sentence-5")?.tradition).toBe("modern");
    expect(getDefinition("grand-tableau")?.tradition).toBe("traditional");
  });

  it("describes the 5-card spread as a neutral sequential line", () => {
    const def = getDefinition("sentence-5")!;
    const labels = (def.positions ?? []).map((p) => p.label);
    expect(labels).toEqual(["First card", "Second card", "Third card", "Fourth card", "Fifth card"]);
  });
});

describe("VALID_SPREADS consistency", () => {
  it("VALID_SPREADS card counts exactly match SPREAD_DEFINITIONS", () => {
    for (const id of Object.keys(VALID_SPREADS) as SpreadId[]) {
      expect(VALID_SPREADS[id]).toBe(SPREAD_DEFINITIONS[id].cardCount);
    }
  });

  it("VALID_SPREADS has the same keys as SPREAD_DEFINITIONS", () => {
    const defKeys = Object.keys(SPREAD_DEFINITIONS).sort();
    const validKeys = Object.keys(VALID_SPREADS).sort();
    expect(validKeys).toEqual(defKeys);
  });

  it("getCardCount helper matches definition", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS)) {
      expect(getCardCount(def.id)).toBe(def.cardCount);
    }
  });

  it("getLayoutType helper matches definition", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS)) {
      expect(getLayoutType(def.id)).toBe(def.layoutType);
    }
  });
});

describe("UI spread list consistency", () => {
  it("COMPREHENSIVE_SPREADS card counts match SPREAD_DEFINITIONS", () => {
    for (const spread of COMPREHENSIVE_SPREADS) {
      const def = getDefinition(spread.id);
      expect(def).toBeDefined();
      expect(spread.cards).toBe(def!.cardCount);
    }
  });

  it("COMPREHENSIVE_SPREADS has no past/present/future labels for comprehensive positions", () => {
    for (const pos of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
      const info = getPositionInfo(pos, "comprehensive");
      expect(info.label.toLowerCase()).not.toMatch(/past|present|future/);
    }
  });
});

describe("position consistency", () => {
  it("every spread with positions has correct count of positions", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS) as SpreadDefinition[]) {
      if (def.positions) {
        expect(def.positions).toHaveLength(def.cardCount);
        const indices = def.positions.map((p) => p.index);
        expect(indices).toEqual(Array.from({ length: def.cardCount }, (_, i) => i));
      }
    }
  });

  it("every position in SPREAD_DEFINITIONS is accessible via getPositionInfo", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS) as SpreadDefinition[]) {
      if (def.positions) {
        for (const pos of def.positions) {
          const info = getPositionInfo(pos.index, def.id);
          expect(info.label).toBe(pos.label);
          expect(info.meaning).toBe(pos.meaning);
        }
      }
    }
  });

  it("spread without positions falls back to Position N label", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS) as SpreadDefinition[]) {
      if (!def.positions) {
        const info = getPositionInfo(0, def.id);
        expect(info.label).toBe("Position 1");
      }
    }
  });
});
