import { describe, expect, it } from "vitest";
import {
  gridLinks,
  resolveLinks,
  selectMostRelevant,
  sequenceLinks,
} from "@/lib/combination-engine";
import { CARD_CATALOG } from "@/lib/card-catalog";

const names = new Map(CARD_CATALOG.map((c) => [c.id, c.name]));
const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("combination engine: nothing is invented and order is part of the key", () => {
  it("reports every selected pair as unknown while the curated registry is empty", () => {
    const { resolved, unknown } = resolveLinks(sequenceLinks([14, 21, 26]), names, []);
    expect(resolved).toHaveLength(0);
    expect(unknown).toHaveLength(2);
    expect(unknown[0].fromName).toBe("Fox");
    expect(unknown[0].toName).toBe("Mountain");
  });

  it("resolves a cited pair only in the curated direction, not reversed", () => {
    const entries = [{
      first: 14,
      second: 21,
      meaning: "Forward reading.",
      tone: "challenging",
      sourceIds: ["fixture"],
      reviewStatus: "source-cited",
    }];
    const forward = resolveLinks([{ fromPosition: 1, toPosition: 2, fromId: 14, toId: 21, relation: "next in the line" }], names, entries);
    expect(forward.resolved[0].meaning).toBe("Forward reading.");
    expect(forward.resolved[0].tone).toBe("challenging");

    const reversed = resolveLinks([{ fromPosition: 1, toPosition: 2, fromId: 21, toId: 14, relation: "next in the line" }], names, entries);
    expect(reversed.resolved).toHaveLength(0);
    expect(reversed.unknown).toHaveLength(1);
  });

  it("reads lines as consecutive pairs and grids with bounded geometry, never a row wrap", () => {
    expect(sequenceLinks(ids(3)).map((l) => `${l.fromPosition}>${l.toPosition}`)).toEqual(["1>2", "2>3"]);
    expect(sequenceLinks(ids(5))).toHaveLength(4);

    const petit = gridLinks(ids(9), 3, 3);
    const centre = petit.filter((l) => l.relation === "centre with neighbour");
    expect(centre.map((l) => l.toPosition).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
    expect(petit.some((l) => l.fromPosition === 3 && l.toPosition === 4)).toBe(false);

    const grand = gridLinks(ids(36), 4, 9);
    expect(grand.some((l) => l.fromPosition === 9 && l.toPosition === 10)).toBe(false);
    expect(grand.some((l) => l.relation === "row 1" && l.fromPosition === 1 && l.toPosition === 2)).toBe(true);
    expect(grand.some((l) => l.relation === "column 1" && l.fromPosition === 1 && l.toPosition === 10)).toBe(true);
  });

  it("selects the most relevant links first, favouring the centre and significators", () => {
    const links = gridLinks(ids(9), 3, 3);
    const top = selectMostRelevant(links, [5], 4);
    expect(top.every((l) => l.fromPosition === 5 || l.toPosition === 5)).toBe(true);
  });
});
