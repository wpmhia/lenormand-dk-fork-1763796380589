import canonicalPairs from "@/public/data/canonical-pairs.json";
import { getCanonicalLenormandPairMeaning } from "@/lib/pair-meaning";
import { buildReadingContext } from "@/lib/reading-context";
import { buildEvidenceEnvelope, buildLenormandEvidencePack } from "@/lib/lenormand-evidence";
import { describe, expect, it } from "vitest";

describe("canonical Lenormand evidence registry", () => {
  it("contains every unordered card pair exactly once", () => {
    expect(canonicalPairs).toHaveLength(630);

    const keys = canonicalPairs.map((pair) => `${pair.cards[0]}:${pair.cards[1]}`);
    expect(new Set(keys).size).toBe(630);
    expect(canonicalPairs.every((pair) => pair.cards[0] < pair.cards[1])).toBe(true);
    expect(canonicalPairs.every((pair) => pair.cards[0] >= 1 && pair.cards[1] <= 36)).toBe(true);
    expect(canonicalPairs.filter((pair) => pair.reviewStatus === "researched")).toHaveLength(35);
  });

  it("returns only reviewed meanings and leaves gaps empty", () => {
    expect(getCanonicalLenormandPairMeaning(14, 35)).toContain("work problems");
    expect(getCanonicalLenormandPairMeaning(35, 14)).toContain("work problems");
    expect(getCanonicalLenormandPairMeaning(1, 36)).toBeUndefined();
  });

  it("keeps Heart-Fish-Sun-Bear-House evidence domain-scoped and non-causal", () => {
    const names = ["Heart", "Fish", "Sun", "Bear", "House"];
    const cards = [24, 34, 31, 15, 4].map((id, position) => ({ id, name: names[position], keywords: [], position }));
    const context = buildReadingContext("sentence-5", "Hoe ontwikkelt het contact tussen Mahican en mij zich de komende week?", cards, new Map());
    const pack = buildLenormandEvidencePack(context);

    expect(pack).toContain("Fish: resources, flow, or available capacity");
    expect(pack).toContain("Bear: power, strength, or authority");
    expect(pack).toContain("House: home, residence, or family setting");
    expect(pack).not.toContain("financially possible");
    expect(pack).not.toContain("third party");
    expect(pack).not.toContain("physical meeting");
  });

  it("keeps the observation window separate from independent card timing", () => {
    const cards = [24, 34, 31].map((id, position) => ({ id, name: ["Heart", "Fish", "Sun"][position], keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops during the coming month?", cards, new Map());
    const envelope = buildEvidenceEnvelope(context);

    expect(envelope.question.observationWindow).toContain("coming month");
    expect(envelope.timing.observationWindow).toContain("coming month");
    expect(envelope.timing.supported).toBe(false);
    expect(envelope.cards.find((card) => card.name === "Fish")?.supportedMeanings).toEqual(["resources, flow, or available capacity"]);
  });
});
