import { describe, expect, it } from "vitest";
import {
  CURATED_PAIR_MEANINGS,
  gridLinks,
  indexPairs,
  resolveLinks,
  selectMostRelevant,
  sequenceLinks,
  type CuratedPairEntry,
} from "@/lib/combination-engine";
import { buildClassicAnalysis } from "@/lib/classic-analysis";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { ReadingCard } from "@/lib/types";

const names = new Map(CARD_CATALOG.map((c) => [c.id, c.name]));
const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("curated registry: nothing is invented", () => {
  it("ships with no pair meanings until a source cites them", () => {
    expect(CURATED_PAIR_MEANINGS).toHaveLength(0);
  });

  it("reports every selected pair as unknown when the registry is empty", () => {
    const { resolved, unknown } = resolveLinks(sequenceLinks([14, 21, 26]), names, []);
    expect(resolved).toHaveLength(0);
    expect(unknown).toHaveLength(2);
    expect(unknown[0].fromName).toBe("Fox");
    expect(unknown[0].toName).toBe("Mountain");
  });

  it("never reports a combination for a sourced-less or unreviewed entry", () => {
    const bad: CuratedPairEntry[] = [
      { first: 14, second: 21, meaning: "x", tone: "challenging", sourceIds: [], reviewStatus: "source-cited" },
      { first: 14, second: 21, meaning: "y", tone: "challenging", sourceIds: ["s"], reviewStatus: "expert-reviewed" as never },
    ];
    expect(indexPairs(bad).size).toBe(1);
    expect(indexPairs(bad).get("14>21")?.meaning).toBe("y");
  });
});

describe("pair order is part of the key", () => {
  const entries: CuratedPairEntry[] = [
    { first: 14, second: 21, meaning: "Forward reading.", tone: "challenging", sourceIds: ["fixture"], reviewStatus: "source-cited" },
  ];

  it("resolves the cited order", () => {
    const { resolved } = resolveLinks([{ fromPosition: 1, toPosition: 2, fromId: 14, toId: 21, relation: "next in the line" }], names, entries);
    expect(resolved[0].meaning).toBe("Forward reading.");
    expect(resolved[0].tone).toBe("challenging");
  });

  it("does not infer the reversed order from the forward entry", () => {
    const { resolved, unknown } = resolveLinks([{ fromPosition: 1, toPosition: 2, fromId: 21, toId: 14, relation: "next in the line" }], names, entries);
    expect(resolved).toHaveLength(0);
    expect(unknown).toHaveLength(1);
  });
});

describe("geometry: sequences and grids", () => {
  it("reads a 3- and 5-card line as consecutive pairs in drawn order", () => {
    expect(sequenceLinks(ids(3)).map((l) => `${l.fromPosition}>${l.toPosition}`)).toEqual(["1>2", "2>3"]);
    expect(sequenceLinks(ids(5))).toHaveLength(4);
  });

  it("gives the 3x3 centre its eight neighbours and no row wrap", () => {
    const links = gridLinks(ids(9), 3, 3);
    const centre = links.filter((l) => l.relation === "centre with neighbour");
    expect(centre.map((l) => l.toPosition).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 6, 7, 8, 9]);
    expect(links.some((l) => l.fromPosition === 3 && l.toPosition === 4)).toBe(false);
  });

  it("reads the 4x9 Grand Tableau with no wrap from the end of one row to the next", () => {
    const links = gridLinks(ids(36), 4, 9);
    expect(links.some((l) => l.fromPosition === 9 && l.toPosition === 10)).toBe(false);
    expect(links.some((l) => l.relation === "row 1" && l.fromPosition === 1 && l.toPosition === 2)).toBe(true);
    expect(links.some((l) => l.relation === "column 1" && l.fromPosition === 1 && l.toPosition === 10)).toBe(true);
  });

  it("selects the most relevant links first, favouring the centre and significators", () => {
    const links = gridLinks(ids(9), 3, 3);
    const top = selectMostRelevant(links, [5], 4);
    expect(top.every((l) => l.fromPosition === 5 || l.toPosition === 5)).toBe(true);
  });
});

describe("classic analysis: every spread size", () => {
  const drawn = (n: number): ReadingCard[] => Array.from({ length: n }, (_, i) => ({ id: CARD_CATALOG[i].id, position: i }));

  it.each([
    ["single-card", 1],
    ["sentence-3", 3],
    ["sentence-5", 5],
    ["comprehensive", 9],
    ["grand-tableau", 36],
  ] as const)("%s returns no invented combinations and lists unknown pairs", (spreadId, count) => {
    const analysis = buildClassicAnalysis(spreadId, "Q", drawn(count));
    expect(analysis.combinations).toHaveLength(0);
    expect(analysis.cards).toHaveLength(count);
    if (count > 1) expect(analysis.unknownCombinations.length).toBeGreaterThan(0);
  });

  it("lists the individual card meanings and positions when no combination is curated", () => {
    const analysis = buildClassicAnalysis("sentence-3", "Q", drawn(3));
    expect(analysis.cards[0].meaning.length).toBeGreaterThan(0);
    expect(analysis.cards.map((c) => c.position)).toEqual([1, 2, 3]);
  });
});
