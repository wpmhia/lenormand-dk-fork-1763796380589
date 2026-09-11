import { describe, expect, it } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { getStructuredReadingSchema, validateStructuredReading } from "@/lib/structured-reading";
import type { Card } from "@/lib/types";

const cardsMap = new Map<number, Card>();
for (let id = 1; id <= 36; id++) {
  cardsMap.set(id, {
    id,
    name: ["", "Rider", "Clover", "Ship", "House", "Tree", "Clouds", "Snake", "Coffin", "Bouquet", "Scythe", "Whip", "Birds", "Child", "Fox", "Bear", "Stars", "Stork", "Dog", "Tower", "Garden", "Mountain", "Paths", "Mice", "Heart"][id] || `Card ${id}`,
    number: id,
    keywords: [],
    uprightMeaning: "",
    meaning: { general: "", positive: [], negative: [] },
    combos: [],
    imageUrl: null,
  });
}

function reading(ids: number[], question: string, development: string) {
  const cards = ids.map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
  const context = buildReadingContext("sentence-3", question, cards, cardsMap);
  const value = getStructuredReadingSchema("sentence-3").parse({
    interpretation: "The cards describe a concrete situation developing through linked events.",
    evidence: [
      { pair: "first", evidenceIds: ["pair-1-2"] , implication: "The opening combination starts the situation." },
      { pair: "closing", evidenceIds: ["pair-2-3"], implication: "The closing combination describes the outcome." },
    ],
    prediction: { development, evidenceIds: ["card-1", "pair-2-3", "card-3"], timing: "Not clearly shown by these cards.", watchFor: null, practicalAction: null },
  });
  return validateStructuredReading(value, context);
}

describe("deterministic prediction semantic grounding", () => {
  it("rejects a younger-person claim for Child in a love question", () => {
    const issues = reading([13, 24, 31], "What develops in my relationship?", "A younger person becomes involved.");
    expect(issues.some((issue) => issue.type === "semantic_grounding")).toBe(true);
  });

  it("rejects transferring Clover's temporary benefit to the relationship", () => {
    const issues = reading([24, 2, 31], "What develops in my relationship?", "The relationship improves temporarily.");
    expect(issues.some((issue) => issue.message.includes("Clover"))).toBe(true);
  });

  it("rejects definitive Scythe severity without Coffin", () => {
    const issues = reading([10, 24, 31], "What develops in my relationship?", "The relationship ends definitively.");
    expect(issues.some((issue) => issue.message.includes("Scythe"))).toBe(true);
  });

  it("requires closing card and pair IDs in sentence predictions", () => {
    const cards = [1, 24, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops?", cards, cardsMap);
    const value = getStructuredReadingSchema("sentence-3").parse({
      interpretation: "The cards describe a concrete situation.",
      evidence: [{ pair: "opening", evidenceIds: ["pair-1-2"], implication: "The situation starts." }],
      prediction: { development: "A development follows.", evidenceIds: ["pair-1-2"], timing: "Not clearly shown by these cards.", watchFor: null, practicalAction: null },
    });
    const messages = validateStructuredReading(value, context).map((issue) => issue.message);
    expect(messages).toContain('Prediction must cite closing evidence "pair-2-3"');
    expect(messages).toContain('Prediction must cite closing evidence "card-3"');
  });
});
