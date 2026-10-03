import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import {
  buildSimpleReadingPrompt,
  buildSpreadFacts,
  SIMPLE_LENORMAND_SYSTEM_PROMPT,
  getTokenBudget,
} from "@/lib/prompt-builder";
import { findInventedCards } from "@/lib/invented-cards";
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
        /has deliberately not chosen a focus, a main line, supporting evidence or an outcome pair/,
      );
    }
  });
});

// ======================================================================================
// GEOMETRY IN THE PROMPT
// ======================================================================================

describe("geometry: coordinates are supplied, relations are left to the model", () => {
  it("gives exact row/column coordinates for every grid card", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Geometry?", draw(36, 13)));
    for (let index = 0; index < 36; index++) {
      const line = facts.split("\n").find((entry) => entry.startsWith(`- ${index + 1}: `))!;
      expect(line).toContain(`row ${Math.floor(index / 9) + 1}, col ${(index % 9) + 1}`);
    }
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

  it("tells the model the coordinates are authoritative and relations must be derived", () => {
    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const text = prompt(id, "Geometry?", draw(count, 13));
      expect(text, id).toMatch(/The coordinates above are authoritative/);
      expect(text, id).toMatch(/Derive adjacency, rows, columns, diagonals, knight's moves, mirroring and distances/);
      expect(text, id).toMatch(/Never invent a position, a house or a spatial relationship/);
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

  it("puts the Petit Tableau geometric centre on position 5", () => {
    const ctx = context("comprehensive", "What will the month bring?", draw(9, 5));
    expect((ctx.layout as { center: { index: number } }).center.index).toBe(4);
    expect(buildSpreadFacts(ctx)).toContain("Geometric centre: position 5 (row 2, col 2).");
  });

  it("supplies all 36 houses, each named after the canonical deck", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Full picture?", draw(36, 13)));
    expect(facts.split("\n").filter((line) => / house$/.test(line))).toHaveLength(36);
    const houseNames = facts
      .split("\n")
      .map((line) => line.match(/, ([^,]+) house$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => match[1]);
    expect(houseNames).toEqual(deck.map((card) => card.name));
    expect(facts).not.toContain("Crossroads house");
  });

  it("states significator placement, binding state and exact relation", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Will we stay together?", draw(36, 13)));
    expect(facts).toMatch(/- Man: position \d+, row \d, col \d, .+ house; (?:bound by .+|unbound)/);
    expect(facts).toMatch(/- Woman: position \d+, row \d, col \d, .+ house; (?:bound by .+|unbound)/);
    // The server may state the relation; it may not forbid the model from reading it.
    expect(facts).not.toContain("do not treat them as a pair");
    expect(facts).toContain("weigh their relation to each other from the coordinates above");
  });

  it("states the significator focus factually", () => {
    const manFacts = buildSpreadFacts(
      buildReadingContext("grand-tableau", "Full picture?", draw(36, 13), cardsMap, "man"),
    );
    expect(manFacts).toContain("Significator focus: Man");
    expect(manFacts).toContain("still present as an ordinary card");
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
  it("grounds spatial claims in the coordinates, not in a relation list", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/only where the supplied coordinates support it/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).not.toMatch(/only where the structural facts list it/i);
    // And the user prompt says the same thing, from the other direction.
    expect(buildSimpleReadingPrompt(context("grand-tableau", "Q?", draw(36)))).toMatch(
      /The coordinates above are authoritative/,
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
    const text = prompt(id, "Will I move house?", draw(CARD_COUNT[id], 13));

    for (const skeleton of [
      "User question:",
      "Will I move house?",
      "Structural facts (deterministic; complete for this spread):",
      "Person bindings:",
      "- Man:",
      "- Woman:",
      "Synthesis contract:",
      "Return only one JSON object",
    ]) {
      expect(text, id).toContain(skeleton);
    }

    for (const field of ['"answer": string', '"reading": string', '"patterns"', '"timing": string | null']) {
      expect(text, id).toContain(field);
    }

    // The model must declare the relation it claims, because the validator checks the
    // declared relation rather than guessing it from prose.
    expect(text, id).toContain('"relation": string');
    expect(text, id).toContain('"combination"');
    expect(text, id).toContain('"knight"');
    expect(text, id).toContain("The server checks any non-");

    // Each removed field was a per-spread judgement about how much a spread had to say.
    // (`"combination"` is no longer listed: it is now a legitimate relation value.)
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

describe("factual validation: the model cannot introduce a card that was not drawn", () => {
  const drawn = [2, 6, 24, 25]; // Clover, Clouds, Heart, Ring
  const base = {
    answer: "The situation stays open.",
    reading: "The spread shows movement without a firm conclusion.",
    patterns: [] as { cards: string[]; meaning: string }[],
    timing: null as string | null,
  };
  const answer = (overrides: Partial<typeof base> = {}) => SimpleAnswerSchema.parse({ ...base, ...overrides });

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

  it("rejects an undrawn card in a pattern label or an explicit prose reference", () => {
    expect(findInventedCards(answer({ patterns: [{ cards: ["Heart", "Tower"], meaning: "a collapse." }] }), drawn)).toContain(19);
    expect(findInventedCards(answer({ reading: "The Clouds + Mice line points to erosion." }), drawn)).toContain(23);
    expect(findInventedCards(answer({ reading: "A Stork sits between the two people." }), drawn)).toContain(17);
  });

  // Casing bug guard: an earlier detector built its bare-mention pattern from lowercase
  // keys without the `i` flag, so every capitalised distinctive card slipped through.
  it("catches a distinctive card in any casing, in prose or a label", () => {
    for (const [mention, expectedId] of [
      ["Rider", 1],
      ["rider", 1],
      ["The Rider card", 1],
      ["the rider card", 1],
      ["Rider + Heart", 1],
      ["Stork", 17],
      ["stork", 17],
      ["Scythe", 10],
      ["scythe", 10],
    ] as [string, number][]) {
      expect(findInventedCards(answer({ reading: `The line turns on ${mention} here.` }), drawn), mention).toContain(expectedId);
      expect(findInventedCards(answer({ patterns: [{ cards: [mention], meaning: "a turn." }] }), drawn), mention).toContain(expectedId);
    }
  });

  it("does not mistake ordinary English words for card references", () => {
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

  it("still flags an explicit combination that names an undrawn ordinary-word card", () => {
    expect(findInventedCards(answer({ reading: "The Clouds + Anchor line holds." }), drawn)).toEqual([35]);
  });

  describe("through the production path", () => {
    const serviceOptions = (cards: { id: number; name: string }[]) => ({
      context: { cards, layout: { type: "single" } } as unknown as ReadingContext,
      model: {} as LanguageModel,
      system: "system",
      prompt: "prompt",
      cardCount: cards.length,
      maxTokens: 500,
      timeoutMs: 5_000,
    });

    beforeEach(() => generateText.mockReset());

    it("fails the reading when an undrawn card is named", async () => {
      generateText.mockResolvedValueOnce({
        text: JSON.stringify({
          answer: "It will not hold.",
          reading: "The spread points elsewhere.",
          patterns: [{ cards: ["Clover", "Scythe"], meaning: "a sudden cut." }],
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
      expect(result.ok === false && result.issues[0].type).toBe("invented_card");
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
    });
  });
});