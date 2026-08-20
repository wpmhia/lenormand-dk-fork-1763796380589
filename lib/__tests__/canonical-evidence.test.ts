import canonicalPairs from "@/public/data/canonical-pairs.json";
import { getCanonicalLenormandPairMeaning } from "@/lib/pair-meaning";
import { describe, expect, it } from "vitest";

describe("canonical Lenormand evidence registry", () => {
  it("contains every unordered card pair exactly once", () => {
    expect(canonicalPairs).toHaveLength(630);

    const keys = canonicalPairs.map((pair) => `${pair.cards[0]}:${pair.cards[1]}`);
    expect(new Set(keys).size).toBe(630);
    expect(canonicalPairs.every((pair) => pair.cards[0] < pair.cards[1])).toBe(true);
    expect(canonicalPairs.every((pair) => pair.cards[0] >= 1 && pair.cards[1] <= 36)).toBe(true);
  });

  it("returns only reviewed meanings and leaves gaps empty", () => {
    expect(getCanonicalLenormandPairMeaning(14, 35)).toContain("work or employment");
    expect(getCanonicalLenormandPairMeaning(35, 14)).toContain("work or employment");
    expect(getCanonicalLenormandPairMeaning(1, 36)).toBeUndefined();
  });
});
