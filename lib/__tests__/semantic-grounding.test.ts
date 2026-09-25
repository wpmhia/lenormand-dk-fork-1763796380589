import { describe, expect, it } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { getStructuredReadingSchema, validateStructuredReading } from "@/lib/structured-reading";
import { getCardRelations, validateEntityEvidenceBinding, validatePredictionSemantics, validateQuestionSubjectPreservation } from "@/lib/semantic-grounding";
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
      { claimId: "pair-1-2", pair: "first", evidenceIds: ["pair-1-2"] , implication: "The opening combination starts the situation." },
      { claimId: "pair-2-3", pair: "closing", evidenceIds: ["pair-2-3"], implication: "The closing combination describes the outcome." },
    ],
    prediction: { development, evidenceIds: ["card-1", "pair-2-3", "card-3"], claimIds: ["question-predicate", "pair-2-3"], timing: "Not clearly shown by these cards.", watchFor: null, practicalAction: null },
  });
  return validateStructuredReading(value, context);
}

describe("deterministic prediction semantic grounding", () => {
  it("requires closing card and pair IDs in sentence predictions", () => {
    const cards = [1, 24, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops?", cards, cardsMap);
    const value = getStructuredReadingSchema("sentence-3").parse({
      interpretation: "The cards describe a concrete situation.",
      evidence: [{ claimId: "pair-1-2", pair: "opening", evidenceIds: ["pair-1-2"], implication: "The situation starts." }],
      prediction: { development: "A development follows.", evidenceIds: ["pair-1-2"], claimIds: ["question-predicate"], timing: "Not clearly shown by these cards.", watchFor: null, practicalAction: null },
    });
    const messages = validateStructuredReading(value, context).map((issue) => issue.message);
    expect(messages).toContain('Prediction must cite closing evidence "pair-2-3"');
    expect(messages).toContain('Prediction must cite closing evidence "card-3"');
  });

  it("does not turn Key-Scythe-Moon into an unsupported negative answer", () => {
    const issues = reading([33, 10, 32], "Will intimacy happen soon?", "Intimacy is unlikely to happen quickly and separation is required.");
    expect(issues.some((issue) => issue.message.includes("outcome polarity"))).toBe(true);

    const qualified = reading([33, 10, 32], "Will intimacy happen soon?", "A sudden turning point around intimacy is likely, but these cards do not clearly establish its direction.");
    expect(qualified.some((issue) => issue.message.includes("outcome polarity"))).toBe(false);
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

  it("does not turn polarity support into certainty about hidden behavior", () => {
    const cards = [31, 4, 35].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Gaat Alex nog steeds vreemd?", cards, cardsMap);
    const categorical = validatePredictionSemantics("Alex gaat niet langer vreemd.", context);
    expect(categorical.some((issue) => issue.code === "unsupported_certainty")).toBe(true);

    const qualified = validatePredictionSemantics("De kaarten wijzen eerder tegen voortgaand vreemdgaan.", context);
    expect(qualified.some((issue) => issue.code === "unsupported_certainty")).toBe(false);
  });

  it("requires epistemic framing for external factual states, not just infidelity", () => {
    const cases = [
      ["Does he have contact with me?", "He has no contact anymore."],
      ["Will I get the job?", "I will get the job."],
      ["Is she honest?", "She is honest."],
      ["Will he return?", "He will return."],
    ] as const;
    for (const [question, development] of cases) {
      const context = buildReadingContext("sentence-3", question, [31, 4, 35].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position })), cardsMap);
      expect(validatePredictionSemantics(development, context).some((issue) => issue.code === "unsupported_certainty")).toBe(true);
    }

    const qualified = buildReadingContext("sentence-3", "Will he return?", [31, 4, 35].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position })), cardsMap);
    expect(validatePredictionSemantics("The cards strongly indicate that he will return.", qualified).some((issue) => issue.code === "unsupported_certainty")).toBe(false);

    expect(validatePredictionSemantics("Alex is no longer unfaithful.", qualified, undefined, { validateEpistemicCertainty: false })).toEqual([]);
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
    const generic = reading([30, 35, 31], "Will I have sex with Alex?", "The situation will reach a successful or clear outcome.");
    expect(generic.some((issue) => issue.message.includes("explicit sexual-intimacy question"))).toBe(true);

    const broadened = reading([30, 35, 31], "Will I have sex with Alex?", "Emotional intimacy is supported, but the exact physical outcome remains unresolved.");
    expect(broadened.some((issue) => issue.message.includes("exact sex predicate"))).toBe(true);

    const specific = reading([30, 35, 31], "Will I have sex with Alex?", "Sex with Alex is supported as the likely outcome.");
    expect(specific.some((issue) => issue.message.includes("explicit sexual-intimacy question"))).toBe(false);
  });

  it("does not bind Man to an explicitly female question subject", () => {
    const cards = [29, 28, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Blijft mijn vrouwelijke partner Alex bij mij?", cards, cardsMap);
    expect(context.personBindings.map((binding) => binding.cardId)).toEqual([29]);
    const issues = validatePredictionSemantics("The man in your life will remain connected to your home life.", context);
    expect(issues.some((issue) => issue.message.includes("Man is unbound"))).toBe(true);
  });

  it("keeps Man unbound for a named subject without significator metadata", () => {
    const cards = [28, 24, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Blijft Alex bij mij?", cards, cardsMap, "both");
    expect(context.personBindings).toEqual([]);
    const issues = validateEntityEvidenceBinding("The Man card appears, but it is not identified as Alex.", new Set(["card-1"]), context);
    expect(issues).toEqual([]);
  });

  it("rejects a named subject attributed to an unbound person card in cited evidence", () => {
    const cards = [8, 28, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Will Alex stay?", cards, cardsMap);
    const issues = validateEntityEvidenceBinding("Coffin + Man shows the end of a phase with Alex.", new Set(["pair-1-2"]), context);
    expect(issues.some((issue) => issue.code === "unsupported_entity_binding")).toBe(true);
  });

  it("preserves a named question subject instead of allowing Man to become the grammatical subject", () => {
    const cards = [28, 24, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Blijft Alex bij mij?", cards, cardsMap);
    const issues = validateQuestionSubjectPreservation("The man will remain connected to your home life.", context, "prediction");
    expect(issues.some((issue) => issue.message.includes('Question subject "Alex"'))).toBe(true);

    const valid = validateQuestionSubjectPreservation("Alex's long-term decision is not clearly established.", context, "prediction");
    expect(valid).toEqual([]);
  });

  it("allows an implicit continuation of the established subject", () => {
    const cards = [12, 6, 24].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "How will the contact between Alex and me develop?", cards, cardsMap);
    const issues = validateQuestionSubjectPreservation("The cards show continued communication, although uncertainty remains.", context, "interpretation");
    expect(issues).toEqual([]);
  });

  it("does not reject natural pronouns for a descriptive subject phrase", () => {
    const cards = [24, 29, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Will my partner come back to me?", cards, cardsMap);
    const issues = validateQuestionSubjectPreservation("She may return, while the relationship remains under pressure.", context, "prediction");
    expect(issues).toEqual([]);
  });

  it("does not bind Woman to an explicitly male question subject", () => {
    const cards = [28, 29, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Will my male partner stay with me?", cards, cardsMap);
    const issues = validatePredictionSemantics("She will remain connected to my home life.", context);
    expect(issues.some((issue) => issue.message.includes("Woman is unbound"))).toBe(true);
  });

  it("allows bare Man and Woman card labels without binding people", () => {
    const cards = [28, 29, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops?", cards, cardsMap);
    expect(validatePredictionSemantics("Man and Woman cards appear in the spread.", context)).toEqual([]);
  });

  it("keeps unbound Man and Woman from becoming invented partners or third parties", () => {
    const cards = [28, 29, 15].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops in this situation?", cards, cardsMap);
    const issues = validatePredictionSemantics("The man and woman are partners.", context);
    expect(issues.filter((issue) => issue.message.includes("unbound")).length).toBe(2);
    expect(issues.some((issue) => issue.message.includes("Bear supports"))).toBe(false);
  });

  it("keeps explicit significator binding available", () => {
    const cards = [29, 28, 31].map((id, position) => ({ id, name: cardsMap.get(id)!.name, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "What develops in this situation?", cards, cardsMap, "woman");
    expect(context.personBindings).toEqual([{ cardId: 29, source: "explicit-significator", evidence: "The request explicitly selected Woman as the significator." }]);
    expect(validatePredictionSemantics("The woman remains connected to the situation.", context).some((issue) => issue.message.includes("Woman is unbound"))).toBe(false);
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
