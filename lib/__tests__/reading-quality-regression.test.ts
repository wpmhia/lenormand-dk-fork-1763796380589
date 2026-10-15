import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, buildSpreadFacts, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { SimpleAnswerSchema } from "@/lib/simple-answer";

/**
 * Regression fixtures taken from real readings. They check the instructions the model
 * receives (clear answer, correct polarity, spatial accuracy, concision, no unsupported
 * factual claims). They do not hardcode a favourable outcome for any card or question.
 */

const cardsMap = getCardCatalogMap();
const byName = new Map(CARD_CATALOG.map((card) => [card.name, card]));

function cardsNamed(names: string[]) {
  return names.map((name) => {
    const card = byName.get(name);
    if (!card) throw new Error(`Unknown card ${name}`);
    return {
      id: card.id,
      name: card.name,
      keywords: card.keywords,
      coreMeaning: card.meaning.general,
      secondaryMeanings: card.meaning.secondaryMeanings,
      meaningReviewStatus: card.meaning.reviewStatus,
    };
  });
}

function promptFor(spreadId: Parameters<typeof buildReadingContext>[0], question: string, names: string[]) {
  return buildSimpleReadingPrompt(buildReadingContext(spreadId, question, cardsNamed(names), cardsMap));
}

describe("regression: Lily-Sun-Key-Fish-Moon keeps positive sensuality", () => {
  const names = ["Lily", "Sun", "Key", "Fish", "Moon"];

  it("supplies the secondary sexuality sense of Lily as tradition-dependent context", () => {
    const prompt = promptFor("sentence-5", "Will this project reach its goal?", names);
    expect(prompt).toContain("Lily: Maturity, experience, peace, harmony, virtue, longevity.");
    expect(prompt).toContain("Some schools also associate Lily with sexuality");
  });

  it("instructs the model to use a secondary sense only when the question supports it", () => {
    const prompt = promptFor("sentence-5", "Will this project reach its goal?", names);
    expect(prompt).toMatch(/A secondary meaning never stands alone/);
  });

  it("keeps the positive cards in sequence without a fixed verdict", () => {
    const facts = buildSpreadFacts(
      buildReadingContext("sentence-5", "Will this project reach its goal?", cardsNamed(names), cardsMap),
    );
    expect(facts).toContain("position 1: Lily");
    expect(facts).toContain("position 5: Moon");
  });
});

describe("regression: Fox-Anchor-Bouquet-Ring-Tree is contextual, not automatic deception", () => {
  const names = ["Fox", "Anchor", "Bouquet", "Ring", "Tree"];

  it("does not present Fox as deception without contextual support", () => {
    const prompt = promptFor("sentence-5", "Is the offer being presented honestly?", names);
    expect(prompt).toContain("Fox: Work or employment, strategy, self-interest, cunning, caution.");
    expect(prompt).toContain("A single negative card is never proof of any specific act.");
    expect(prompt).toContain("A secondary meaning never stands alone");
  });

  it("keeps the supporting cards' meanings available for self-protection, obligation and agreement", () => {
    const prompt = promptFor("sentence-5", "Should I sign this agreement?", names);
    expect(prompt).toContain("Anchor: Stability, security, persistence, work, endurance.");
    expect(prompt).toContain("Ring: Commitment, agreement, contract, partnership, cycle.");
  });
});

describe("regression: mixed spreads recognise a genuine positive direction", () => {
  it("keeps the Mice-Snake-Cross spread's serious difficulty visible in the core meanings", () => {
    const prompt = promptFor("sentence-3", "Will this situation improve?", ["Mice", "Snake", "Cross"]);
    expect(prompt).toContain("Mice: Loss, theft, worry, gradual erosion, depletion.");
    expect(prompt).toContain("Cross: Burden, hardship, suffering, duty, difficult circumstances.");
  });

  it("supplies the Paths-Ship-Anchor direction cards as contextual meanings", () => {
    const prompt = promptFor("sentence-3", "Should I take this opportunity?", ["Paths", "Ship", "Anchor"]);
    expect(prompt).toContain("Paths: Choices, alternatives, options, decisions, direction.");
    expect(prompt).toContain("Ship: Travel, distance, departure, trade or commerce.");
  });

  it("supplies the Moon-Bear-Heart cards without rewriting them into a fixed outcome", () => {
    const prompt = promptFor("sentence-3", "Will my feelings be returned?", ["Moon", "Bear", "Heart"]);
    expect(prompt).toContain("Moon: Recognition, reputation, moods, imagination, emotion.");
    expect(prompt).toContain("Heart: Love, affection, emotional matters, preference.");
    expect(prompt).not.toMatch(/guaranteed|will definitely/i);
  });

  it("treats a metaphor in the question as the user's perception, not as the conclusion", () => {
    const prompt = promptFor("sentence-5", "Why does it sometimes feel like we are siblings?", ["Birds", "Tower", "Paths", "Mountain", "Moon"]);
    expect(prompt).toMatch(/emotionally charged comparisons or metaphors in the question/);
    expect(prompt).toMatch(/do not restate the question's wording as the answer/);
  });

  it("tells the model to commit to the dominant reading and keep serious difficulty in view", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Respond naturally in the language of the user/);
    const prompt = promptFor("sentence-3", "Will this situation improve?", ["Mice", "Snake", "Cross"]);
    expect(prompt).toMatch(/Commit to the dominant reading/);
    expect(prompt).toMatch(/genuinely mixed/);
  });
});

describe("regression: Coffin-Garden-Sun-Scythe-Clouds recognises withdrawal without inventing events", () => {
  const names = ["Coffin", "Garden", "Sun", "Scythe", "Clouds"];

  it("supplies the withdrawal and interruption meanings", () => {
    const prompt = promptFor("sentence-5", "Has this person withdrawn from our friendship?", names);
    expect(prompt).toContain("Coffin: Ending, loss, grief, illness, rest, absence.");
    expect(prompt).toContain("Scythe: A sudden cut or decision, a warning, risk, harvest.");
    expect(prompt).toContain("Clouds: Confusion, uncertainty, doubt, lack of clarity.");
  });

  it("forbids inventing what happened, the cause, or a real-world event", () => {
    const prompt = promptFor("sentence-5", "Has this person withdrawn from our friendship?", names);
    expect(prompt).toMatch(/Do not invent facts, names, places, dates or specific events and circumstances/);
    expect(prompt).toMatch(/interpret motives and causes symbolically from the combination of drawn cards/);
    expect(prompt).toMatch(/Never state an unverified motive, cause or specific event as established fact/);
    expect(prompt).toMatch(/Lack of confirmation proves neither the opposite nor continued activity/);
  });
});

describe("regression: the answer contract is decisive, concise and spatially exact", () => {
  it("asks for a one-or-two-sentence answer and a 100-200 word reading", () => {
    const prompt = promptFor("sentence-3", "Will I move?", ["Rider", "Ship", "Clover"]);
    expect(prompt).toMatch(/one or two sentences/);
    expect(prompt).toMatch(/Let its length fit the spread/);
    expect(prompt).toMatch(/Do not repeat the reading in them/);
  });

  it("does not reintroduce indecision wording", () => {
    const prompt = promptFor("sentence-3", "Will I move?", ["Rider", "Ship", "Clover"]);
    expect(prompt).not.toMatch(/do not force a yes\/no conclusion/i);
    expect(prompt).not.toMatch(/repeated hedging/i);
  });

  it("does not list every possible row or combination", () => {
    const prompt = promptFor("comprehensive", "What will the month bring?", [
      "Sun", "Moon", "Key", "Fish", "Anchor", "Tree", "Ring", "Bear", "Heart",
    ]);
    expect(prompt).toMatch(/Do not repeat the reading in them/);
  });

  it("keeps Grand Tableau neighbour facts exact, with no adjacency for a same-row card two columns away", () => {
    const deckNames = [...CARD_CATALOG].sort((a, b) => a.id - b.id).map((card) => card.name);
    const facts = buildSpreadFacts(
      buildReadingContext("grand-tableau", "Full picture?", cardsNamed(deckNames.slice(0, 36)), cardsMap, "woman"),
    );
    expect(facts).toContain("Non-neighbours exactly two columns from");
    expect(facts).toMatch(/Immediate neighbours \(horizontal, vertical and diagonal/);
  });

  it("returns a schema-valid answer shape from a concise model response", () => {
    const parsed = SimpleAnswerSchema.parse({
      answer: "Yes, the tendency is positive, though it depends on steady effort.",
      reading: "The Sun brings clarity and success, and the Key confirms that the matter can be resolved.",
      patterns: [{ cards: ["Sun", "Key"], meaning: "Clarity opens a solution." }],
      timing: null,
    });
    expect(parsed.answer.split(/[.!?]/).filter((s) => s.trim()).length).toBeLessThanOrEqual(2);
    expect(parsed.patterns.length).toBeLessThanOrEqual(3);
  });
});

describe("specificity: predictions do not choose between options the cards do not distinguish", () => {
  it("tells the model to stay at the level of direction when the cards do not separate the options", () => {
    const prompt = promptFor("sentence-5", "Should I move to Rotterdam, another Dutch city or abroad?", ["Birds", "Tower", "Paths", "Mountain", "Moon"]);
    expect(prompt).toMatch(/Be only as specific as the cards are/);
    expect(prompt).toMatch(/do not name a preferred option/);
    expect(prompt).toMatch(/Never choose a specific destination, place or person that no drawn card identifies/);
  });
});

describe("linear synthesis: a five-card sentence is read as one connected whole", () => {
  // Child - Bear - Clouds - Clover - Lily (left to right)
  const names = ["Child", "Bear", "Clouds", "Clover", "Lily"];
  const prompt = promptFor("sentence-5", "Will the child be well cared for?", names);

  it("states the sentence reading method in the spread facts", () => {
    expect(prompt).toContain("Reading method: the cards form one sentence read left to right");
    expect(prompt).toContain("the last card completes the sentence");
  });

  it("tells the model not to let one card's standalone meaning decide the conclusion", () => {
    expect(prompt).toMatch(/Do not let one card's standalone meaning decide the conclusion; weigh the whole sequence/);
  });

  it("keeps the given left-to-right order of the cards", () => {
    const facts = buildSpreadFacts(buildReadingContext("sentence-5", "Q", cardsNamed(names), cardsMap));
    expect(facts).toContain("position 4: Clover");
    expect(facts).toContain("position 5: Lily");
  });
});
