import { describe, expect, it } from "vitest";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { buildReadingContext } from "@/lib/reading-context";
import type { NormalizedCard } from "@/lib/reading-contract";
import { SimpleAnswerSchema } from "@/lib/simple-answer";
import { buildVerifiedClusters, findPatternsOutsideVerifiedClusters } from "@/lib/verified-clusters";

const cardsMap = getCardCatalogMap();

function cards(ids: number[]): NormalizedCard[] {
  return ids.map((id) => {
    const card = cardsMap.get(id)!;
    return { id, name: card.name, keywords: card.keywords };
  });
}

function answer(cardSets: string[][]) {
  return SimpleAnswerSchema.parse({
    answer: "Answer.",
    reading: "Reading.",
    patterns: cardSets.map((cards) => ({ cards, meaning: "Interpretation." })),
    timing: null,
  });
}

describe("verified clusters: deterministic group selection only", () => {
  it("supplies a single card and bounded consecutive line groups", () => {
    const single = buildReadingContext("single-card", "Q?", cards([6]));
    expect(buildVerifiedClusters(single).map((item) => item.cards.map((card) => card.name))).toEqual([["Clouds"]]);

    const line3 = buildReadingContext("sentence-3", "Q?", cards([1, 2, 3]));
    expect(buildVerifiedClusters(line3).map((item) => item.cards.map((card) => card.name))).toEqual([
      ["Rider", "Clover"], ["Clover", "Ship"], ["Rider", "Clover", "Ship"],
    ]);

    const line5 = buildReadingContext("sentence-5", "Q?", cards([1, 2, 3, 4, 5]));
    expect(buildVerifiedClusters(line5)).toHaveLength(5);
  });

  it("selects Petit Tableau centre, corners and drawn person neighborhoods", () => {
    const context = buildReadingContext("comprehensive", "Q?", cards([28, 1, 2, 3, 4, 5, 6, 7, 29]));
    const clusters = buildVerifiedClusters(context);
    expect(clusters.map((item) => item.id)).toEqual([
      "person-28", "person-29", "petit-center", "petit-corners",
    ]);
    expect(clusters.find((item) => item.id === "petit-center")?.cards).toHaveLength(9);
    expect(clusters.find((item) => item.id === "person-28")?.facts).toContain("immediate neighbors");
  });

  it("provides four explicit Grand Tableau clusters and house/neighborhood facts", () => {
    const ids = Array.from({ length: 36 }, (_, index) => index + 1);
    const manIndex = ids.indexOf(28);
    [ids[manIndex], ids[13]] = [ids[13], ids[manIndex]]; // Put Man in the Fox house (position 14).
    const context = buildReadingContext("grand-tableau", "Q?", cards(ids));
    const clusters = buildVerifiedClusters(context);

    expect(clusters.map((item) => item.id)).toEqual([
      "person-28", "person-29", "grand-center", "grand-corners",
    ]);
    expect(clusters.find((item) => item.id === "person-28")?.facts).toContain("Man occupies the Fox house");
    expect(clusters.find((item) => item.id === "person-28")?.facts).toContain("immediate neighbors");
    expect(clusters.find((item) => item.id === "grand-center")?.positions).toEqual([5, 14, 23, 32]);
    expect(clusters.find((item) => item.id === "grand-corners")?.positions).toEqual([1, 9, 28, 36]);
  });

  it("accepts multi-card patterns only when their cards belong to a selected cluster", () => {
    const ids = Array.from({ length: 36 }, (_, index) => index + 1);
    const manIndex = ids.indexOf(28);
    [ids[manIndex], ids[13]] = [ids[13], ids[manIndex]];
    const context = buildReadingContext("grand-tableau", "Q?", cards(ids));
    const found = findPatternsOutsideVerifiedClusters(
      answer([["Man", "Fox"], ["Rider", "Ship"]]),
      context,
    );

    // Man+Fox is the person cluster; Rider+Ship are not in the same cluster.
    expect(found).toEqual([{ index: 1, cards: ["Rider", "Ship"] }]);
    expect(findPatternsOutsideVerifiedClusters(answer([["Man", "Fox"]]), context)).toEqual([]);
    expect(findPatternsOutsideVerifiedClusters(answer([["Rider", "Ship"]]), context)).toHaveLength(1);
  });
});
