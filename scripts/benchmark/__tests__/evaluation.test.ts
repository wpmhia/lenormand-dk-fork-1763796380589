import { describe, expect, it } from "vitest";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { buildReadingContext } from "@/lib/reading-context";
import type { NormalizedCard } from "@/lib/reading-contract";
import { evaluateOutput } from "../evaluate";
import { buildQualityJudgePrompt } from "../quality-judge";
import type { BenchmarkCase } from "../cases";

function normalized(ids: number[]): NormalizedCard[] {
  return ids.map((id) => {
    const card = CARD_CATALOG.find((candidate) => candidate.id === id)!;
    return { id, name: card.name, keywords: card.keywords };
  });
}

describe("benchmark factual evaluation", () => {
  it("separates an unknown label, an undrawn canonical card, and false geometry", () => {
    const context = buildReadingContext("sentence-3", "Will this plan progress?", normalized([1, 2, 3]));
    const result = evaluateOutput(JSON.stringify({
      answer: "The plan may progress.",
      reading: "The line points to movement.",
      patterns: [
        { cards: ["Rider", "Clover"], relation: "row", meaning: "row assertion" },
        { cards: ["Rider", "Scythe"], relation: "combination", meaning: "undrawn card" },
        { cards: ["Rider", "ImaginaryCard"], relation: "combination", meaning: "unknown label" },
      ],
      timing: null,
    }), "stop", context);

    expect(result.schemaValid).toBe(true);
    expect(result.falseGeometry).toHaveLength(1);
    expect(result.inventedCards.some((match) => match.card === "Scythe" && match.field === "pattern")).toBe(true);
    expect(result.unknownCardLabels).toEqual([{ patternIndex: 2, label: "ImaginaryCard" }]);
    expect(result.deliveredPatterns).toHaveLength(0);
  });

  it("counts explicit undrawn references in prose but not ordinary English", () => {
    const context = buildReadingContext("sentence-3", "Will this plan progress?", normalized([1, 2, 3]));
    const innocent = evaluateOutput(JSON.stringify({
      answer: "The man and woman should discuss the key issue.",
      reading: "The heart of the matter is to talk.",
      patterns: [],
      timing: null,
    }), "stop", context);
    expect(innocent.proseCardMentions).toEqual([]);

    const explicit = evaluateOutput(JSON.stringify({
      answer: "The Scythe card marks a cut.",
      reading: "The line points to change.",
      patterns: [],
      timing: null,
    }), "stop", context);
    expect(explicit.proseCardMentions).toHaveLength(1);
    expect(explicit.proseCardMentions[0].card).toBe("Scythe");
  });

  it("checks a declared Grand Tableau house against actual occupancy", () => {
    const ids = Array.from({ length: 36 }, (_, index) => index + 1);
    const context = buildReadingContext("grand-tableau", "How will this develop?", normalized(ids));
    const result = evaluateOutput(JSON.stringify({
      answer: "The situation is active.",
      reading: "A continuing process.",
      patterns: [{ cards: ["Man"], relation: "house", house: "Rider", meaning: "house claim" }],
      timing: null,
    }), "stop", context);
    expect(result.falseGeometry).toHaveLength(1);
    expect(result.falseGeometry[0].relation).toBe("house");
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
    expect(prompt).toContain("Blind review");
    expect(prompt).toContain("Will my project progress?");
    expect(prompt).not.toContain("falseGeometry");
    expect(prompt).not.toContain("validator finding");
  });
});
