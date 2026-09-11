import { describe, expect, it } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { getStructuredReadingSchema, validateStructuredReading } from "@/lib/structured-reading";
import { getCardRelations, validatePredictionSemantics } from "@/lib/semantic-grounding";
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

  it("does not infer the outcome of either option from Paths", () => {
    const issues = reading([22, 24, 31], "What develops next?", "Neither path leads to commitment.");
    expect(issues.some((issue) => issue.type === "semantic_grounding")).toBe(true);
  });

  it("does not infer that a Key solution was not acted on", () => {
    const issues = reading([33, 24, 31], "What develops next?", "A solution is available but not yet taken.");
    expect(issues.some((issue) => issue.message.includes("Key"))).toBe(true);
  });

  it("does not turn Key-Scythe-Moon into an unsupported negative answer", () => {
    const issues = reading([33, 10, 32], "Will intimacy happen soon?", "Intimacy is unlikely to happen quickly and separation is required.");
    expect(issues.some((issue) => issue.message.includes("outcome polarity"))).toBe(true);

    const qualified = reading([33, 10, 32], "Will intimacy happen soon?", "A sudden turning point around intimacy is likely, but these cards do not clearly establish its direction.");
    expect(qualified.some((issue) => issue.message.includes("outcome polarity"))).toBe(false);
  });

  it("requires a generated GT relation for card-to-card influence", () => {
    const names = ["Rider", "Clover", "Ship", "House", "Tree", "Clouds", "Snake", "Coffin", "Bouquet", "Scythe", "Whip", "Birds", "Child", "Fox", "Bear", "Stars", "Stork", "Dog", "Tower", "Garden", "Mountain", "Paths", "Mice", "Heart", "Ring", "Book", "Letter", "Man", "Woman", "Lily", "Sun", "Moon", "Key", "Fish", "Anchor", "Cross"];
    const fullMap = new Map<number, Card>();
    for (let id = 1; id <= 36; id++) {
      fullMap.set(id, { ...cardsMap.get(id)!, name: names[id - 1] });
    }
    const makeGrand = (related: boolean) => {
      const ids = Array.from({ length: 36 }, (_, index) => index + 1);
      const place = (id: number, target: number) => {
        const current = ids.indexOf(id);
        [ids[current], ids[target]] = [ids[target], ids[current]];
      };
      place(31, related ? 25 : 0);
      place(6, related ? 26 : 20);
      const cards = ids.map((id, position) => ({ id, name: fullMap.get(id)!.name, keywords: [], position }));
      return buildReadingContext("grand-tableau", "What develops next?", cards, fullMap);
    };

    const unrelated = makeGrand(false);
    expect(validatePredictionSemantics("The Sun's clarity is dimmed by the surrounding Clouds.", unrelated)).toHaveLength(1);

    const related = makeGrand(true);
    expect(getCardRelations(related)).toContainEqual({ cardA: 31, cardB: 6, relation: "adjacent" });
    expect(validatePredictionSemantics("The Sun's clarity is dimmed by the surrounding Clouds.", related)).toEqual([]);
  });
});
