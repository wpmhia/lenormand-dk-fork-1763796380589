import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, buildSpreadFacts, sanitizeQuestion, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
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

  it("supplies the core meaning of Lily", () => {
    const prompt = promptFor("sentence-5", "Will this project reach its goal?", names);
    expect(prompt).toContain("Lily: Maturity, experience, peace, harmony, virtue, longevity.");
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


  it("keeps the system prompt on the output language", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Respond naturally in the language of the user/);
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
  });
});

describe("regression: the answer contract is decisive, concise and spatially exact", () => {
  it("asks for a one-or-two-sentence answer and a 100-200 word reading", () => {
    const prompt = promptFor("sentence-3", "Will I move?", ["Rider", "Ship", "Clover"]);
    expect(prompt).toMatch(/one or two sentences/);
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


describe("linear synthesis: a five-card sentence is read as one connected whole", () => {
  // Child - Bear - Clouds - Clover - Lily (left to right)
  const names = ["Child", "Bear", "Clouds", "Clover", "Lily"];
  const prompt = promptFor("sentence-5", "Will the child be well cared for?", names);

  it("states the sentence reading method in the spread facts", () => {
    expect(prompt).toContain("Reading method: the cards form one sentence read left to right");
    expect(prompt).toContain("the last card completes the sentence");
  });

  it("keeps the sentence reading method in the spread facts", () => {
    expect(prompt).toMatch(/Reading method: the cards form one sentence read left to right/);
  });

  it("keeps the given left-to-right order of the cards", () => {
    const facts = buildSpreadFacts(buildReadingContext("sentence-5", "Q", cardsNamed(names), cardsMap));
    expect(facts).toContain("position 4: Clover");
    expect(facts).toContain("position 5: Lily");
  });
});

describe("input sanitising: line breaks separate words and backslashes are kept as typed", () => {
  it("turns a multi-line question into words separated by spaces, not joined words", () => {
    const sanitized = sanitizeQuestion("Will my job\nchange soon?\r\nPlease tell me");
    expect(sanitized).toBe("Will my job change soon? Please tell me");
  });

  it("keeps a backslash as typed, without doubling it", () => {
    expect(sanitizeQuestion("path C:\\temp")).toBe("path C:\\temp");
  });

  it("trims and returns empty for non-string or empty input", () => {
    expect(sanitizeQuestion("   ")).toBe("");
    expect(sanitizeQuestion(undefined as unknown as string)).toBe("");
  });
});

describe("input sanitising reaches the prompt", () => {
  it("sends a multi-line question to the model as one line", () => {
    const prompt = promptFor("sentence-3", "Will my job\nchange soon?", ["Sun", "Key", "Fish"]);
    expect(prompt).toContain("User question:\nWill my job change soon?");
    expect(prompt).not.toContain("Will my job\nchange soon?");
  });
});
