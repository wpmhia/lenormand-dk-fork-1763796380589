import { describe, it, expect } from "vitest";
import { SPREAD_DEFINITIONS, getDefinition, getCardCount, getLayoutType, type SpreadDefinition } from "@/lib/spread-definitions";
import { VALID_SPREADS, SpreadId } from "@/lib/reading-contract";
import { COMPREHENSIVE_SPREADS } from "@/lib/spreads";
import { getPositionInfo } from "@/components/reading/SpreadPositions";

describe("SPREAD_DEFINITIONS", () => {
  it("has unique ids, positive card counts and known layout types", () => {
    const ids = Object.values(SPREAD_DEFINITIONS).map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const validTypes = ["single", "linear-sentence", "petit-tableau", "grand-tableau"];
    for (const def of Object.values(SPREAD_DEFINITIONS) as SpreadDefinition[]) {
      expect(def.cardCount).toBeGreaterThan(0);
      expect(validTypes).toContain(def.layoutType);
    }
  });

  it("backs every spread used by the contract and the context builder", () => {
    for (const id of Object.keys(VALID_SPREADS)) expect(getDefinition(id)).toBeDefined();
    for (const def of Object.values(SPREAD_DEFINITIONS)) expect(getDefinition(def.id)).toBeDefined();
  });
});

describe("VALID_SPREADS and helpers are consistent with SPREAD_DEFINITIONS", () => {
  it("matches card counts and keys exactly", () => {
    const defKeys = Object.keys(SPREAD_DEFINITIONS).sort();
    expect(Object.keys(VALID_SPREADS).sort()).toEqual(defKeys);
    for (const id of Object.keys(VALID_SPREADS) as SpreadId[]) {
      expect(VALID_SPREADS[id]).toBe(SPREAD_DEFINITIONS[id].cardCount);
    }
  });

  it("keeps the count and layout helpers in sync with the definitions", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS)) {
      expect(getCardCount(def.id)).toBe(def.cardCount);
      expect(getLayoutType(def.id)).toBe(def.layoutType);
    }
  });
});

describe("UI spread list and positions", () => {
  it("COMPREHENSIVE_SPREADS card counts match SPREAD_DEFINITIONS", () => {
    for (const spread of COMPREHENSIVE_SPREADS) {
      const def = getDefinition(spread.id);
      expect(def).toBeDefined();
      expect(spread.cards).toBe(def!.cardCount);
    }
  });

  it("every spread has the right number of indexed positions, reachable via getPositionInfo", () => {
    for (const def of Object.values(SPREAD_DEFINITIONS) as SpreadDefinition[]) {
      if (def.positions) {
        expect(def.positions).toHaveLength(def.cardCount);
        expect(def.positions.map((p) => p.index)).toEqual(Array.from({ length: def.cardCount }, (_, i) => i));
        for (const pos of def.positions) {
          const info = getPositionInfo(pos.index, def.id);
          expect(info.label).toBe(pos.label);
          expect(info.meaning).toBe(pos.meaning);
        }
      } else {
        expect(getPositionInfo(0, def.id).label).toBe("Position 1");
      }
    }
  });
});
