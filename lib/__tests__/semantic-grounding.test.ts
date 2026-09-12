import { describe, expect, it } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { getStructuredReadingSchema, validateStructuredReading } from "@/lib/structured-reading";
import { getCardRelations, validatePredictionSemantics, validateQuestionSubjectPreservation } from "@/lib/semantic-grounding";
import { buildLenormandEvidencePack } from "@/lib/lenormand-evidence";
import type { Card } from "@/lib/types";

const cardsMap = new Map<number, Card>();
for (let id = 1; id <= 36; id++) {
  cardsMap.set(id, {
    id,
    name: ["", "Rider", "Clover", "Ship", "House", "Tree", "Clouds", "Snake", "Coffin", "Bouquet", "Scythe", "Whip", "Birds", "Child", "Fox", "Bear", "Stars", "Stork", "Dog", "Tower", "Garden", "Mountain", "Paths", "Mice", "Heart", "Ring"][id] || `Card ${id}`,
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

  it("does not turn Ship into a prerequisite that overrides Ring and Bouquet", () => {
    const cards = [20, 28, 3, 25, 9].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-5", "Will intimacy develop soon?", cards, cardsMap);
    const issues = validatePredictionSemantics(
      "Intimacy is not imminent because distance is an obstacle that must first be resolved.",
      context,
      new Set(["card-1", "card-3", "pair-4-5", "card-5"]),
    );
    expect(issues.some((issue) => issue.message.includes("obstacle or prerequisite"))).toBe(true);
    expect(issues.some((issue) => issue.message.includes("closing pair and closing card"))).toBe(true);
  });

  it("allows a qualified possibility without treating 'can happen' as positive polarity", () => {
    const issues = reading([3, 24, 32], "What will happen?", "A sudden change can happen, but these cards do not establish which direction it takes.");
    expect(issues.some((issue) => issue.message.includes("outcome polarity"))).toBe(false);
  });

  it("keeps possibility distinct from confirmation", () => {
    const possible = reading([22, 24, 32], "Will this happen?", "This could happen, but the cards do not confirm it.");
    expect(possible.some((issue) => issue.message.includes("outcome polarity"))).toBe(false);

    const affirmative = reading([22, 24, 32], "Will this happen?", "Yes, it will happen.");
    expect(affirmative.some((issue) => issue.message.includes("outcome polarity"))).toBe(true);
  });

  it("does not turn missing seven-day timing confirmation into a negative outcome", () => {
    const cards = [17, 9, 4].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Will intimacy happen within 7 days?", cards, cardsMap);
    const issues = validatePredictionSemantics("Intimacy is not likely within 7 days.", context, new Set(["pair-2-3", "card-3"]));
    expect(issues.some((issue) => issue.message.includes("timing confirmation"))).toBe(true);

    const qualified = validatePredictionSemantics("The cards support intimacy, but they do not clearly establish whether it occurs within seven days.", context, new Set(["pair-2-3", "card-3"]));
    expect(qualified.some((issue) => issue.message.includes("timing confirmation"))).toBe(false);

    const delayedContext = buildReadingContext("sentence-3", "Will intimacy happen within 7 days?", [21, 9, 4].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position })), cardsMap);
    expect(validatePredictionSemantics("Intimacy is unlikely within 7 days because the blockage delays movement.", delayedContext).some((issue) => issue.message.includes("timing confirmation"))).toBe(false);
  });

  it("requires an explicit sexual outcome for an explicit sex question", () => {
    const generic = reading([30, 35, 31], "Will I have sex with Mahican?", "The situation will reach a successful or clear outcome.");
    expect(generic.some((issue) => issue.message.includes("explicit sexual-intimacy question"))).toBe(true);

    const broadened = reading([30, 35, 31], "Will I have sex with Mahican?", "Emotional intimacy is supported, but the exact physical outcome remains unresolved.");
    expect(broadened.some((issue) => issue.message.includes("exact sex predicate"))).toBe(true);

    const specific = reading([30, 35, 31], "Will I have sex with Mahican?", "Sex with Mahican is supported as the likely outcome.");
    expect(specific.some((issue) => issue.message.includes("explicit sexual-intimacy question"))).toBe(false);
  });

  it("keeps Clover + Ring evidence scoped to an opening or bond, not a meeting", () => {
    const cards = [2, 25, 24].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops in this relationship?", cards, cardsMap);
    const pack = buildLenormandEvidencePack(context);
    expect(pack).toContain("Clover + Ring: relationship present; no canonical pair meaning supplied");
    expect(pack).toContain("card-2: Position 2 Ring: commitment, agreement, or a relationship bond");
    expect(pack).not.toContain("planned meeting");

    const issues = validatePredictionSemantics("The small opportunity leads to a planned meeting.", context);
    expect(issues.some((issue) => issue.message.includes("planned meeting"))).toBe(true);
  });

  it("does not turn Paths into a prerequisite in Dutch phrasing", () => {
    const cards = [22, 24, 25].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Ontstaat er toenadering?", cards, cardsMap);
    const issues = validatePredictionSemantics("Het hangt af van een keuze die nog gemaakt moet worden.", context);
    expect(issues.some((issue) => issue.message.includes("must first be made"))).toBe(true);
  });

  it("does not bind Man to an explicitly female question subject", () => {
    const cards = [29, 28, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Blijft mijn vrouwelijke partner Mahican bij mij?", cards, cardsMap);
    expect(context.personBindings.map((binding) => binding.cardId)).toEqual([29]);
    const issues = validatePredictionSemantics("The man in your life will remain connected to your home life.", context);
    expect(issues.some((issue) => issue.message.includes("Man is unbound"))).toBe(true);
  });

  it("preserves a named question subject instead of allowing Man to become the grammatical subject", () => {
    const cards = [28, 24, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Blijft Mahican bij mij?", cards, cardsMap);
    const issues = validateQuestionSubjectPreservation("The man will remain connected to your home life.", context, "prediction");
    expect(issues.some((issue) => issue.message.includes('Question subject "Mahican"'))).toBe(true);

    const valid = validateQuestionSubjectPreservation("Mahican's long-term decision is not clearly established.", context, "prediction");
    expect(valid).toEqual([]);
  });

  it("does not bind Woman to an explicitly male question subject", () => {
    const cards = [28, 29, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Will my male partner stay with me?", cards, cardsMap);
    const issues = validatePredictionSemantics("She will remain connected to my home life.", context);
    expect(issues.some((issue) => issue.message.includes("Woman is unbound"))).toBe(true);
  });

  it("keeps unbound Man and Woman from becoming invented partners or third parties", () => {
    const cards = [28, 29, 15].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops in this situation?", cards, cardsMap);
    const issues = validatePredictionSemantics("The man and woman are partners.", context);
    expect(issues.filter((issue) => issue.message.includes("unbound")).length).toBe(2);
    expect(issues.some((issue) => issue.message.includes("Bear supports"))).toBe(false);
  });

  it("does not turn Bear's authority sense into a boss without entity evidence", () => {
    const cards = [15, 24, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops in this relationship?", cards, cardsMap);
    const issues = validatePredictionSemantics("A boss or authority figure is influencing the dynamics.", context);
    expect(issues.some((issue) => issue.message.includes("Bear supports"))).toBe(true);

    const supported = buildReadingContext("sentence-3", "Will my boss support me?", cards, cardsMap);
    expect(validatePredictionSemantics("The boss's influence is central.", supported).some((issue) => issue.message.includes("Bear supports"))).toBe(false);
  });

  it("keeps explicit significator binding available", () => {
    const cards = [29, 28, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops in this situation?", cards, cardsMap, "woman");
    expect(context.personBindings).toEqual([{ cardId: 29, source: "explicit-significator", evidence: "The request explicitly selected Woman as the significator." }]);
    expect(validatePredictionSemantics("The woman remains connected to the situation.", context).some((issue) => issue.message.includes("Woman is unbound"))).toBe(false);
  });

  it("does not expand Paths + Tree into lasting stability without qualifying evidence", () => {
    const cards = [22, 5, 24].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops?", cards, cardsMap);
    const issues = validatePredictionSemantics("This creates lasting consequences for your well-being and stability.", context);
    expect(issues.some((issue) => issue.message.includes("Paths + Tree"))).toBe(true);
  });

  it("does not invent first-then ordering from Ship and Paths", () => {
    const issues = reading([3, 22, 25], "What develops next?", "First a journey and decision must happen, then the relationship can move forward.");
    expect(issues.some((issue) => issue.message.includes("first/then"))).toBe(true);
  });

  it("blocks unsupported causal, duration, persistence, and severity inflation", () => {
    const issues = reading([6, 24, 31], "What develops next?", "Because of the Clouds, a major blockage will last several weeks and continue indefinitely.");
    expect(issues.some((issue) => issue.message.includes("causal relationship"))).toBe(true);
    expect(issues.some((issue) => issue.message.includes("duration"))).toBe(true);
    expect(issues.some((issue) => issue.message.includes("persistence"))).toBe(true);
    expect(issues.some((issue) => issue.message.includes("severity"))).toBe(true);
  });

  it("does not turn Snake into a female rival without entity evidence", () => {
    const issues = reading([7, 24, 31], "What develops in this relationship?", "A female rival influences the relationship.");
    expect(issues.some((issue) => issue.message.includes("Snake supports"))).toBe(true);
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
