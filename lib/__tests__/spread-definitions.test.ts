import { describe, it, expect } from "vitest";
import { SPREAD_DEFINITIONS, SPREAD_IDS, getDefinition, getCardCount, getLayoutType } from "@/lib/spread-definitions";
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
    for (const def of Object.values(SPREAD_DEFINITIONS)) {
      if (def.positions) {
        expect(def.positions).toHaveLength(def.cardCount);
        const indices = def.positions.map((p) => p.index);
        expect(indices).toEqual(Array.from({ length: def.cardCount }, (_, i) => i));
      }
    }
  });

  it("every position in SPREAD_DEFINITIONS is accessible via getPositionInfo", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS)) {
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
    for (const def of Object.values(SPREAD_DEFINITIONS)) {
      if (!def.positions) {
        const info = getPositionInfo(0, def.id);
        expect(info.label).toBe("Position 1");
      }
    }
  });
});
