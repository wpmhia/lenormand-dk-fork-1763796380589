import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import {
  buildSimpleReadingPrompt,
  buildSpreadFacts,
  SIMPLE_LENORMAND_SYSTEM_PROMPT,
  getTokenBudget,
} from "@/lib/prompt-builder";
import { findInventedCards, findInventedCardReferences } from "@/lib/invented-cards";
import { SimpleAnswerSchema } from "@/lib/simple-answer";
import { generateReading } from "@/lib/reading-service";
import { SPREAD_IDS, type SpreadId } from "@/lib/spread-definitions";
import cardsData from "@/public/data/cards.json";
import type { Card } from "@/lib/types";
import type { ReadingContext } from "@/lib/reading-context";
import type { LanguageModel } from "ai";

/**
 * The model-first contract, in one suite:
 *
 *   input -> geometry -> prompt handoff -> model boundary -> factual validation -> render
 *
 * The server places the cards; the model reads them; the validator checks hard facts.
 * Tests are grouped by that pipeline rather than by the subsystem that once implemented it.
 *
 * Deliberately not duplicated: an invariant that is identical for a 1-card draw and a
 * 36-card tableau is asserted once. Invariants that genuinely differ by layout (roles,
 * coordinates, centres, houses) get their own case for each layout they differ in.
 */

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

const catalog = cardsData as Card[];
const cardsMap = new Map<number, Card>(catalog.map((c) => [c.id, c]));
const deck = [...catalog].sort((a, b) => a.id - b.id);

const CARD_COUNT: Record<SpreadId, number> = {
  "single-card": 1,
  "daily-card": 1,
  "sentence-3": 3,
  "sentence-5": 5,
  comprehensive: 9,
  "grand-tableau": 36,
};

/** Draws `count` cards starting at `offset`, wrapping so ids differ from positions. */
function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, position: i };
  });
}

function context(spreadId: SpreadId, question: string, cards = draw(CARD_COUNT[spreadId])): ReadingContext {
  return buildReadingContext(spreadId, question, cards, cardsMap);
}

function prompt(spreadId: SpreadId, question = "How will my relationship develop?", cards?: ReturnType<typeof draw>): string {
  return buildSimpleReadingPrompt(context(spreadId, question, cards ?? draw(CARD_COUNT[spreadId])));
}

// ======================================================================================
// INPUT -> PROMPT HANDOFF
// ======================================================================================

describe("prompt handoff: every drawn card and the raw question reach the model", () => {
  it("supplies every drawn card, in draw order, for every spread", () => {
    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const cards = draw(count, 13);
      const text = prompt(id, "Q?", cards);
      let cursor = -1;
      for (const card of cards) {
        const at = text.indexOf(card.name, cursor + 1);
        expect(at, `${id}: ${card.name} must reach the model, after the previous card`).toBeGreaterThan(cursor);
        cursor = at;
      }
    }
  });

  it("passes the raw question through without a server-parsed frame", () => {
    const text = prompt("grand-tableau", "Zal ik naar Nederland verhuizen?");
    expect(text).toContain("Zal ik naar Nederland verhuizen?");
    for (const parsed of ["domain=", "predicate=", "Question predicate:", "Question subjects:", "Semantic question frame"]) {
      expect(text).not.toContain(parsed);
    }
  });

  it("reaches the model without a server-side pair shortlist or card dictionary", () => {
    const ctx = context("grand-tableau", "Full picture?") as unknown as Record<string, unknown>;
    expect(ctx.adjacentPairs).toBeUndefined();

    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const text = prompt(id, "How will my relationship develop?", draw(count, 13));
      for (const leaked of [
        "traditionalMeaning",
        "canonical pair",
        "pair weight",
        "Narrative plan",
        "primaryPair",
        "supportingPair",
        "outcomeEvidence",
        "Question-scoped card senses",
        "Reviewed combination meanings",
        "Timing evidence",
        "Question frame (",
      ]) {
        expect(text, `${id} must not expose "${leaked}"`).not.toContain(leaked);
      }
      expect(text, `${id} must state the spread was not preselected`).toMatch(
        /The server has not ranked card meanings or chosen an outcome/,
      );
    }
  });
});

// ======================================================================================
// GEOMETRY IN THE PROMPT
// ======================================================================================

describe("geometry: the full grid is supplied, relations are not", () => {
  it("lays the Grand Tableau out as visual rows", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Geometry?", draw(36, 13)));
    expect(facts.split("\n").filter((line) => /^Row \d+: /.test(line))).toHaveLength(4);
  });

  it("precomputes no relation lists in any layout", () => {
    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const facts = buildSpreadFacts(context(id, "Geometry?", draw(count, 13)));
      expect(facts, id).not.toMatch(/^- \d+\+\d+: /m);
      expect(facts, id).not.toContain("- diagonal ");
      expect(facts, id).not.toContain("- knight: ");
      expect(facts, id).not.toContain("- column ");
      expect(facts, id).not.toContain("Adjacent pairs");
    }
  });

  it("tells the model to use only the supplied verified clusters", () => {
    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const text = prompt(id, "Geometry?", draw(count, 13));
      expect(text, id).toContain("Verified clusters");
      expect(text, id).toMatch(/Use only those clusters when describing how cards are physically related/);
      expect(text, id).not.toMatch(/Derive adjacency, rows, columns/);
    }
  });
});

describe("geometry: layout-specific facts", () => {
  it("keeps the sentence-3 roles the spread itself defines", () => {
    const ctx = context("sentence-3", "Will the deal close?", draw(3, 24));
    const facts = buildSpreadFacts(ctx);
    expect(ctx.layout.type).toBe("linear-sentence");
    for (const position of (ctx.layout as { positions: { index: number; role: string }[] }).positions) {
      expect(facts).toContain(`- position ${position.index + 1}: `);
      expect(facts).toContain(`(role defined by this spread: ${position.role})`);
    }
  });

  it("keeps all five sentence-5 roles present", () => {
    const facts = buildSpreadFacts(context("sentence-5", "Will I move?", draw(5, 10)));
    expect(facts.split("\n").filter((line) => line.includes("role defined by this spread:"))).toHaveLength(5);
  });

  it("names the Petit Tableau centre card", () => {
    const ctx = context("comprehensive", "What will the month bring?", draw(9, 5));
    expect((ctx.layout as { center: { index: number } }).center.index).toBe(4);
    expect(buildSpreadFacts(ctx)).toContain("Centre card:");
  });

  it("supplies all 36 houses with their occupants", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Full picture?", draw(36, 13)));
    expect(facts.split("\n").filter((line) => / house: /.test(line))).toHaveLength(36);
    const houseNames = facts
      .split("\n")
      .map((line) => line.match(/^- ([\w ]+) house: /))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => match[1]);
    expect(houseNames).toEqual(deck.map((card) => card.name));
    expect(facts).not.toContain("Crossroads house");
  });

  it("states person bindings without coordinates", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Will we stay together?", draw(36, 13)));
    expect(facts).not.toMatch(/- Man: position \d+, row \d, col \d/);
    expect(facts).not.toMatch(/- Woman: position \d+, row \d, col \d/);
    expect(facts).not.toContain("weigh their relation to each other from the coordinates above");
  });

  it("is stable across repeated builds", () => {
    const cards = draw(36, 13);
    expect(buildSpreadFacts(context("grand-tableau", "Geometry?", cards))).toBe(
      buildSpreadFacts(context("grand-tableau", "Geometry?", cards)),
    );
  });
});

// ======================================================================================
// MODEL BOUNDARY
// ======================================================================================

describe("model boundary: one contract for every spread", () => {
  it("tells the model to weigh the whole spread and never invent structure", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Consider the spread as a whole before reaching a conclusion/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Weigh supporting and conflicting indications/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/structural data supplied by the server is authoritative/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Do not invent cards, positions, spatial relationships, people, events, or facts/i);
  });

  /**
   * The prompt must not contradict itself. It used to say relations may be asserted "only
   * where the structural facts list it" while the facts deliberately list no relations,
   * later telling the model to derive them from coordinates instead. Both halves now say
   * the same thing.
   */
  it("grounds spatial claims in the verified clusters, not in a relation list", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Do not calculate or improvise geometry/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).not.toMatch(/only where the structural facts list it/i);
    // And the user prompt says the same thing, from the other direction.
    expect(buildSimpleReadingPrompt(context("grand-tableau", "Q?", draw(36)))).toMatch(
      /Use only those clusters when describing how cards are physically related/,
    );
  });

  it("scales the token budget with the spread", () => {
    const budgets = SPREAD_IDS.map((id) => getTokenBudget(CARD_COUNT[id]));
    for (let i = 1; i < budgets.length; i++) expect(budgets[i]).toBeGreaterThanOrEqual(budgets[i - 1]);
    expect(getTokenBudget(36)).toBeGreaterThan(getTokenBudget(3));
  });
});

// ======================================================================================
// THE UNIVERSAL PIPELINE: one it.each over every spread id
// ======================================================================================

describe("pipeline: one universal prompt for every spread", () => {
  it.each(SPREAD_IDS as SpreadId[])("%s uses the same skeleton and the same four-field contract", (id) => {
    const cards = draw(CARD_COUNT[id], 13);
    const text = prompt(id, "Will I move house?", cards);

    for (const skeleton of [
      "User question:",
      "Will I move house?",
      "Structural facts (deterministic; complete for this spread):",
      "Synthesis contract:",
      "Return only one JSON object",
    ]) {
      expect(text, id).toContain(skeleton);
    }

    // Person cards are named only when they were drawn; otherwise the block is absent.
    const presentIds = new Set(cards.map((card) => card.id));
    if (presentIds.has(28) || presentIds.has(29)) {
      expect(text, id).toContain("Person bindings:");
      expect(text, id).toContain(`- ${presentIds.has(28) ? "Man" : "Woman"}:`);
    } else {
      expect(text, id).not.toContain("Person bindings:");
    }

    for (const field of ['"answer": string', '"reading": string', '"patterns"', '"timing": string | null']) {
      expect(text, id).toContain(field);
    }

    // The model receives server-selected verified clusters and must not declare geometry.
    expect(text, id).toContain("Verified clusters");
    expect(text, id).not.toContain('"relation"');
    expect(text, id).not.toContain('"knight"');

    // Each removed field was a per-spread judgement about how much a spread had to say.
    for (const removed of ['"positiveFactors"', '"challenges"', '"development"', '"housesAndMirrors"', '"directAnswer"', '"keyPatterns"']) {
      expect(text, id).not.toContain(removed);
    }
  });

  it("embeds the structural layer verbatim rather than describing it separately", () => {
    const ctx = context("grand-tableau", "Full picture?", draw(36));
    expect(buildSimpleReadingPrompt(ctx)).toContain(buildSpreadFacts(ctx));
  });

  it("does not leak internal classification metadata into the prompt", () => {
    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const text = prompt(id, "Will the situation resolve?", draw(count, 13));
      expect(text, id).not.toMatch(/;\s*STRONG\b/);
      expect(text, id).not.toMatch(/;\s*NEUTRAL\b/);
      expect(text, id).not.toMatch(/;\s*WEAK\b/);
      expect(text, id).not.toMatch(/;\s*timing:/i);
    }
  });
});

// ======================================================================================
// FACTUAL VALIDATION: invented cards
// ======================================================================================

describe("factual validation: cards[] is the strict source, prose only explicit references", () => {
  const drawn = [2, 6, 24, 25]; // Clover, Clouds, Heart, Ring
  const base = {
    answer: "The situation stays open.",
    reading: "The spread shows movement without a firm conclusion.",
    patterns: [] as { cards: string[]; meaning: string }[],
    timing: null as string | null,
  };
  const answer = (overrides: Partial<typeof base> = {}) => SimpleAnswerSchema.parse({ ...base, ...overrides });
  const ids = (matches: ReturnType<typeof findInventedCards>) => matches.map((match) => match.id);

  it("accepts a reading that names only drawn cards", () => {
    expect(
      findInventedCards(
        answer({
          reading: "Clover beside Heart keeps a small emotional opening alive.",
          patterns: [{ cards: ["Clover", "Heart"], meaning: "a small favourable opening." }],
        }),
        drawn,
      ),
    ).toEqual([]);
  });

  it("flags an undrawn card in a pattern label with its field and fragment", () => {
    const matches = findInventedCards(answer({ patterns: [{ cards: ["Heart", "Tower"], meaning: "a collapse." }] }), drawn);
    expect(ids(matches)).toContain(19);
    expect(matches[0]).toMatchObject({ id: 19, name: "Tower", field: "pattern", patternIndex: 0 });
    expect(matches[0].fragment).toContain("Tower");
  });

  it("flags only unambiguous prose references to an undrawn card", () => {
    expect(ids(findInventedCards(answer({ reading: "The Clouds + Mice line points to erosion." }), drawn))).toContain(23);
    expect(ids(findInventedCards(answer({ reading: "The Scythe card closes the line." }), drawn))).toContain(10);
    expect(ids(findInventedCards(answer({ reading: "card Anchor sits apart." }), drawn))).toContain(35);
  });

  it("still flags an explicit combination that names an undrawn ordinary-word card", () => {
    const matches = findInventedCards(answer({ reading: "The Clouds + Anchor line holds." }), drawn);
    expect(ids(matches)).toEqual([35]);
    expect(matches[0].fragment).toContain("Clouds + Anchor");
  });

  it("grounds free-text follow-ups with the same unambiguous-reference rule", () => {
    // Explicit references to undrawn cards are flagged ...
    expect(findInventedCardReferences("The Scythe card cuts the line.", drawn)).toHaveLength(1);
    expect(findInventedCardReferences("The Clouds + Anchor line holds.", drawn)[0].id).toBe(35);
    // ... while ordinary prose, including a natural pairing, is not.
    expect(findInventedCardReferences("The man and woman should talk.", drawn)).toEqual([]);
    expect(findInventedCardReferences("Anchor and Crossroads are ordinary words here.", drawn)).toEqual([]);
  });

  // Regression: a bare card word is ordinary language, never a card reference. The old
  // detector scanned prose with a list of loose card words and rejected valid readings.
  it("never treats a bare card name as a reference, whatever the casing", () => {
    for (const mention of ["Rider", "rider", "The Rider", "Stork", "stork", "Scythe", "Coffin", "Clover", "Lily"]) {
      expect(findInventedCards(answer({ reading: `The line turns on ${mention} here.` }), drawn), mention).toEqual([]);
    }
  });

  it("does not mistake ordinary English words or natural pairings for cards", () => {
    expect(
      findInventedCards(
        answer({
          answer: "A man and a woman will have to talk about the key issue.",
          reading:
            "The heart of the matter is that their home feels heavy, and the letter they are waiting for crosses a line. Clouds gather before the anchor of the plan holds, and birds of a feather stick together.",
          timing: "soon",
        }),
        drawn,
      ),
    ).toEqual([]);
  });

  it("does not mistake ordinary Dutch prose for card references", () => {
    expect(
      findInventedCards(
        answer({
          answer: "De man en de vrouw moeten met elkaar praten.",
          reading:
            "Het hart van de zaak is dat hun huis zwaar voelt, en de brief waarop ze wachten kruist een grens. De zon en de maan doen allebei mee, en de hond blijft trouw.",
          timing: "binnenkort",
        }),
        drawn,
      ),
    ).toEqual([]);
  });

  it("reports field and fragment for a pattern-label rejection", () => {
    const matches = findInventedCards(
      answer({ patterns: [{ cards: ["Clover", "Scythe"], meaning: "a sudden cut." }] }),
      drawn,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ id: 10, field: "pattern", patternIndex: 0 });
  });

  it("keeps the language check plain for every spread without rejecting drawn cards", () => {
    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const cards = draw(count, 13).map((card, position) => ({
        id: card.id,
        name: card.name,
        keywords: card.keywords,
        position,
      }));
      const drawnIds = cards.map((card) => card.id);
      const undrawn = deck.find((card) => !drawnIds.includes(card.id));
      const prose = "A man and a woman should talk it through; the sun and moon both have a say.";
      const reading = answer({
        reading: prose,
        patterns: [
          { cards: [cards[0].name], meaning: "kept pattern" },
          ...(undrawn ? [{ cards: [undrawn.name], meaning: "invented pattern" }] : []),
        ],
      });

      const matches = findInventedCards(reading, drawnIds);
      expect(matches.every((match) => match.field === "pattern"), id).toBe(true);
      if (undrawn) {
        expect(ids(matches), id).toEqual([undrawn.id]);
        expect(matches[0].name, id).toBe(undrawn.name);
      } else {
        expect(matches, id).toEqual([]);
      }
    }
  });

  describe("through the production path", () => {
    const serviceOptions = (cards: { id: number; name: string }[]) => ({
      context: {
        cards,
        layout: cards.length === 1
          ? { type: "single" }
          : { type: "linear-sentence", positions: cards.map((_, index) => ({ index, role: `Card ${index + 1}` })) },
      } as unknown as ReadingContext,
      model: {} as LanguageModel,
      system: "system",
      prompt: "prompt",
      cardCount: cards.length,
      maxTokens: 500,
      timeoutMs: 5_000,
    });

    beforeEach(() => generateText.mockReset());

    it("drops a pattern that names an undrawn card in a single generation", async () => {
      generateText.mockResolvedValueOnce({
        text: JSON.stringify({
          answer: "It will not hold.",
          reading: "The spread points elsewhere.",
          patterns: [
            { cards: ["Clover", "Heart"], meaning: "kept pattern" },
            { cards: ["Clover", "Scythe"], meaning: "dropped pattern" },
          ],
        }),
        finishReason: "stop",
      });

      const result = await generateReading(
        serviceOptions([
          { id: 2, name: "Clover" },
          { id: 24, name: "Heart" },
          { id: 6, name: "Clouds" },
        ]),
      );

      expect(result.ok).toBe(true);
      expect(result.ok && result.reading).toContain("kept pattern");
      expect(result.ok && result.reading).not.toContain("dropped pattern");
      expect(result.ok && result.droppedInventedPatterns).toHaveLength(1);
      expect(generateText).toHaveBeenCalledTimes(1);
    });

    it("fails only on an explicit prose reference to an undrawn card, with field and fragment", async () => {
      generateText.mockResolvedValueOnce({
        text: JSON.stringify({
          answer: "It will not hold.",
          reading: "The Scythe card cuts the line short.",
          patterns: [],
        }),
        finishReason: "stop",
      });

      const result = await generateReading(
        serviceOptions([
          { id: 2, name: "Clover" },
          { id: 24, name: "Heart" },
        ]),
      );

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe("invented-card");
      expect(result.ok === false && result.issues[0]).toMatchObject({ type: "invented_card", field: "reading" });
      expect(result.ok === false && result.issues[0].fragment).toContain("Scythe card");
    });

    it("returns the reading when the model stays inside the drawn set", async () => {
      generateText.mockResolvedValueOnce({
        text: JSON.stringify({
          answer: "It stays open.",
          reading: "A small favourable opening remains.",
          patterns: [{ cards: ["Clover", "Heart"], meaning: "a small favourable opening." }],
        }),
        finishReason: "stop",
      });

      const result = await generateReading(
        serviceOptions([
          { id: 2, name: "Clover" },
          { id: 24, name: "Heart" },
        ]),
      );

      expect(result.ok).toBe(true);
      expect(result.ok && result.reading).toContain("It stays open.");
      expect(result.ok && result.droppedInventedPatterns).toEqual([]);
    });
  });
});

// ======================================================================================
// END-TO-END REGRESSION: 1, 3, 5, 9 AND 36 CARDS
// ======================================================================================

describe("pipeline: every spread size generates once and serves verified patterns", () => {
  beforeEach(() => generateText.mockReset());

  it.each(SPREAD_IDS as SpreadId[])("%s serves a valid reading in one provider call", async (id) => {
    const ctx = context(id, "Will I move?");
    const first = ctx.cards[0].name;

    generateText.mockResolvedValueOnce({
      text: JSON.stringify({
        answer: "Yes, movement is supported.",
        reading: "A steady movement runs through the spread.",
        patterns: [{ cards: [first], meaning: "a step forward" }],
        timing: null,
      }),
      finishReason: "stop",
    });

    const result = await generateReading({
      context: ctx,
      model: {} as LanguageModel,
      system: "system",
      prompt: "prompt",
      cardCount: ctx.cards.length,
      maxTokens: 500,
      timeoutMs: 5_000,
    });

    expect(result.ok, id).toBe(true);
    expect(result.ok && result.reading, id).toContain("step forward");
    expect(result.ok && result.droppedUnverifiedPatterns, id).toEqual([]);
    expect(result.ok && result.droppedInventedPatterns, id).toEqual([]);
    expect(generateText, id).toHaveBeenCalledTimes(1);
  });
});