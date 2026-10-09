import { describe, expect, it } from "vitest";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { buildReadingContext } from "@/lib/reading-context";
import type { NormalizedCard } from "@/lib/reading-contract";
import { evaluateOutput } from "../evaluate";
import { buildQualityJudgePrompt } from "../quality-judge";
import { createContentRegressionCases, type BenchmarkCase } from "../cases";

function normalized(ids: number[]): NormalizedCard[] {
  return ids.map((id) => {
    const card = CARD_CATALOG.find((candidate) => candidate.id === id)!;
    return { id, name: card.name, keywords: card.keywords };
  });
}

describe("benchmark factual evaluation", () => {
  it("separates an unknown label and an undrawn canonical card", () => {
    const context = buildReadingContext("sentence-3", "Will this plan progress?", normalized([1, 2, 3]));
    const result = evaluateOutput(JSON.stringify({
      answer: "The plan may progress.",
      reading: "The line points to movement.",
      patterns: [
        { cards: ["Rider", "Clover"], meaning: "drawn combination" },
        { cards: ["Rider", "Scythe"], meaning: "undrawn card" },
        { cards: ["Rider", "ImaginaryCard"], meaning: "unknown label" },
      ],
      timing: null,
    }), "stop", context);

    expect(result.schemaValid).toBe(true);
    expect(result.inventedCards.some((match) => match.card === "Scythe" && match.field === "pattern")).toBe(true);
    expect(result.unknownCardLabels).toEqual([{ patternIndex: 2, label: "ImaginaryCard" }]);
    expect(result.deliveredPatterns).toHaveLength(1);
  });

  it("does not treat prose mentions as validation failures", () => {
    const context = buildReadingContext("sentence-3", "Will this plan progress?", normalized([1, 2, 3]));
    const explicit = evaluateOutput(JSON.stringify({
      answer: "The Scythe card was not drawn in this spread.",
      reading: "It appeared in the previous reading.",
      patterns: [],
      timing: null,
    }), "stop", context);
    expect(explicit.appWouldServe).toBe(true);
    expect(explicit.inventedCards).toEqual([]);
  });

  it("flags a Grand Tableau pattern that names an undrawn card", () => {
    const drawn = Array.from({ length: 36 }, (_, index) => index + 1).filter((id) => id !== 14);
    const context = buildReadingContext("grand-tableau", "How will this develop?", normalized(drawn));
    const result = evaluateOutput(JSON.stringify({
      answer: "The situation is active.",
      reading: "A continuing process.",
      patterns: [{ cards: ["Man", "Fox"], meaning: "Fox was not drawn" }],
      timing: null,
    }), "stop", context);
    expect(result.inventedCards).toContainEqual(expect.objectContaining({ card: "Fox", field: "pattern" }));
    expect(result.deliveredPatterns).toEqual([]);
  });

  it("classifies malformed JSON and non-stop provider finish reasons distinctly", () => {
    const context = buildReadingContext("single-card", "What should I know?", normalized([1]));
    expect(evaluateOutput("not JSON", "stop", context).outputFailure).toBe("no_json_object");
    const truncated = evaluateOutput(JSON.stringify({
      answer: "An answer.", reading: "A reading.", patterns: [], timing: null,
    }), "length", context);
    expect(truncated.outputFailure).toBe("finish_reason_length");
  });

  it("matches production's tolerant recovery path for malformed pattern containers", () => {
    const context = buildReadingContext("sentence-3", "Will my plan progress?", normalized([1, 2, 3]));
    const recovered = evaluateOutput(JSON.stringify({
      answer: "The plan may progress.",
      reading: "The spread shows a gradual process.",
      patterns: "not-an-array",
    }), "stop", context);
    expect(recovered.schemaValid).toBe(true);
    expect(recovered.parseMode).toBe("recovered");
    expect(recovered.appWouldServe).toBe(true);
    expect(recovered.deliveredPatterns).toEqual([]);
  });

  it("builds a blind judge prompt without exposing validator results", () => {
    const benchmarkCase: BenchmarkCase = {
      id: "sentence-3-001", seed: 1, spreadId: "sentence-3", spreadLabel: "3-Card Sentence",
      cardCount: 3, question: "Will my project progress?", language: "en", cardIdsByPosition: [1, 2, 3],
      significatorPreference: "both",
    };
    const context = buildReadingContext("sentence-3", benchmarkCase.question, normalized([1, 2, 3]));
    const evaluation = evaluateOutput(JSON.stringify({
      answer: "Likely, with a gradual development.", reading: "The line suggests a process.", patterns: [], timing: null,
    }), "stop", context);
    const prompt = buildQualityJudgePrompt(benchmarkCase, context, evaluation);
    expect(prompt).toContain("Independent review");
    expect(prompt).toContain("Will my project progress?");
    expect(prompt).toContain("unsupportedConclusions");
    expect(prompt).toContain("at most 3 highest-confidence examples");
    expect(prompt).not.toContain("verified cluster");
    expect(prompt).not.toContain("validator finding");
  });

  it("feeds the observed unsupported-contact claims into the content-regression judge", () => {
    const benchmarkCase = createContentRegressionCases().find((item) => item.id === "content-assumption-suggestive-nl-001")!;
    const context = buildReadingContext(
      benchmarkCase.spreadId,
      benchmarkCase.question,
      normalized(benchmarkCase.cardIdsByPosition),
      getCardCatalogMap(),
      benchmarkCase.significatorPreference,
    );
    const evaluation = evaluateOutput(JSON.stringify({
      answer: "Deze persoon communiceert nog met buitenechtelijke mannen via een zichtbaar kanaal.",
      reading: "Het contact verloopt eerst zichtbaar, wordt bevestigd in een afspraak, verandert van vorm en loopt uiteindelijk vast.",
      patterns: [
        { cards: ["Sun", "Paths"], meaning: "Contact verloopt openlijk via een kanaal." },
        { cards: ["Paths", "Ring"], meaning: "De route wordt bevestigd in een afspraak." },
        { cards: ["Ring", "Stork"], meaning: "De afspraak verandert." },
        { cards: ["Stork", "Mountain"], meaning: "De verandering loopt vast." },
      ],
      timing: null,
    }), "stop", context);
    const prompt = buildQualityJudgePrompt(benchmarkCase, context, evaluation);

    expect(prompt).toContain(benchmarkCase.question);
    expect(prompt).toContain("Deze persoon communiceert nog met buitenechtelijke mannen");
    expect(prompt).toContain("Regression target");
    expect(prompt).toMatch(/ongoing contact.*extramarital.*communication channel/i);
  });

  it("gives the spatial judge the exact Grand Tableau regression map", () => {
    const benchmarkCase = createContentRegressionCases().find((item) => item.id === "content-grand-tableau-neighbour-map-en-001")!;
    const context = buildReadingContext(
      benchmarkCase.spreadId,
      benchmarkCase.question,
      normalized(benchmarkCase.cardIdsByPosition),
      getCardCatalogMap(),
      benchmarkCase.significatorPreference,
    );
    const evaluation = evaluateOutput(JSON.stringify({
      answer: "The spread has a mixed direction.",
      reading: "The cards support a nuanced interpretation.",
      patterns: [],
      timing: null,
    }), "stop", context);
    const prompt = buildQualityJudgePrompt(benchmarkCase, context, evaluation);

    expect(prompt).toContain("Will my marriage with Mahican work out?");
    expect(prompt).toContain("position 1: Man, row 1, column 1");
    expect(prompt).toContain("position 18: Woman, row 2, column 9");
    expect(prompt).toContain("position 18 is the Dog house; occupant=Woman");
    expect(prompt).toContain("Man is row 1, column 1, with immediate neighbours Snake, Key, Book");
    expect(prompt).toContain("Woman is row 2, column 9, with immediate neighbours Bear, Dog, Whip, Fish, Clover");
    expect(prompt).toContain("Assess spatial accuracy only, not the desired positive or negative interpretation");
  });
});
