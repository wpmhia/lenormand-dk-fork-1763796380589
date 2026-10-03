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
 * Regression suite for the model-first architecture.
 *
 * The invariant under test:
 *
 *   question + cards with coordinates + explicit bindings -> DeepSeek -> factual validation
 *
 * and not:
 *
 *   question + spread -> heuristic interpretation -> selected evidence -> DeepSeek
 *
 * The server places the cards. The model reads them. The validator checks hard facts.
 * These tests are about that contract, not about reading quality.
 */

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

const catalog = cardsData as Card[];
const cardsMap = new Map<number, Card>(catalog.map((c) => [c.id, c]));
const deck = [...catalog].sort((a, b) => a.id - b.id);

const ALL_SPREADS: { id: SpreadId; count: number }[] = [
  { id: "single-card", count: 1 },
  { id: "daily-card", count: 1 },
  { id: "sentence-3", count: 3 },
  { id: "sentence-5", count: 5 },
  { id: "comprehensive", count: 9 },
  { id: "grand-tableau", count: 36 },
];

/** Draws `count` cards starting at `offset`, wrapping so ids differ from positions. */
function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, position: i };
  });
}

function context(spreadId: SpreadId, question: string, cards = draw(36)): ReadingContext {
  return buildReadingContext(spreadId, question, cards, cardsMap);
}

function prompt(
  spreadId: SpreadId,
  question = "How will my relationship develop?",
  cards?: ReturnType<typeof draw>,
): string {
  const count = ALL_SPREADS.find((s) => s.id === spreadId)?.count ?? 36;
  return buildSimpleReadingPrompt(context(spreadId, question, cards ?? draw(count)));
}

// --------------------------------------------------------------------------------------
// 1. Every drawn card reaches the model
// --------------------------------------------------------------------------------------

describe("invariant 1: every drawn card reaches the model", () => {
  for (const { id, count } of ALL_SPREADS) {
    it(`supplies all ${count} card(s) of ${id} in the prompt`, () => {
      const cards = draw(count);
      const text = prompt(id, "How will my relationship develop?", cards);
      for (const card of cards) {
        expect(text, `${card.name} must reach the model`).toContain(card.name);
      }
    });
  }

  it("does not require a server-side pair shortlist at all", () => {
    // There is no longer any ranked pair list in the context to shrink.
    const ctx = context("grand-tableau", "Full picture?") as unknown as Record<string, unknown>;
    expect(ctx.adjacentPairs).toBeUndefined();
    const text = prompt("grand-tableau", "Full picture?");
    for (const card of draw(36)) expect(text).toContain(card.name);
  });
});

// --------------------------------------------------------------------------------------
// 2. Card order is preserved
// --------------------------------------------------------------------------------------

describe("invariant 2: card order is preserved", () => {
  it("lists Grand Tableau cards in draw order, not deck order", () => {
    const cards = draw(36, 13);
    const facts = buildSpreadFacts(context("grand-tableau", "Full picture?", cards));

    let cursor = -1;
    for (const card of cards) {
      const at = facts.indexOf(card.name, cursor + 1);
      expect(at, `${card.name} should appear after the previously drawn card`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("keeps Grand Tableau coordinate lines in ascending position order", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Full picture?", draw(36, 13)));
    const positions = facts
      .split("\n")
      .map((line) => line.match(/^- (\d+): /))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => Number(match[1]));
    expect(positions).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
  });

  it("renders a linear spread as one ordered line in draw order", () => {
    const cards = draw(3, 24);
    const facts = buildSpreadFacts(context("sentence-3", "Will the deal close?", cards));
    let cursor = -1;
    for (const card of cards) {
      const at = facts.indexOf(card.name, cursor + 1);
      expect(at).toBeGreaterThan(cursor);
      cursor = at;
    }
    expect(facts).toContain("read left to right");
  });
});

// --------------------------------------------------------------------------------------
// 3. No narrative-plan filtering remains
// --------------------------------------------------------------------------------------

describe("invariant 3: no narrative-plan filtering remains", () => {
  const PLAN_ARTIFACTS = [
    "Narrative plan",
    "Core / heart",
    "Main line",
    "Development line",
    "Outcome evidence",
    "Supporting evidence",
    "Primary outcome",
    "Strongest transition",
    "coreDriver",
    "primaryPair",
    "supportingPair",
    "strongestOutcome",
  ];

  for (const { id, count } of ALL_SPREADS) {
    it(`keeps ${id} free of narrative-plan vocabulary`, () => {
      const text = prompt(id, "How will my relationship develop?", draw(count));
      for (const artifact of PLAN_ARTIFACTS) {
        expect(text, `${id} must not contain "${artifact}"`).not.toContain(artifact);
      }
      expect(text).not.toMatch(/^- Focus:/m);
      expect(text).not.toMatch(/^- Outcome evidence/m);
    });
  }

  it("keeps the spread no longer preselected, in words the model can act on", () => {
    for (const { id, count } of ALL_SPREADS) {
      expect(prompt(id, "How will my relationship develop?", draw(count))).toMatch(
        /has deliberately not chosen a focus, a main line, supporting evidence or an outcome pair/,
      );
    }
  });

  it("never puts heuristic interpretation into the prompt", () => {
    // Behavioural check, not a source-code grep: whatever the internals get called, none
    // of the retired interpretation may reach the model.
    for (const { id, count } of ALL_SPREADS) {
      const text = prompt(id, "How will my relationship develop?", draw(count));
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
        "Semantic question frame",
        "Question frame (",
      ]) {
        expect(text, `${id} must not expose "${leaked}"`).not.toContain(leaked);
      }
    }
  });

  it("passes the raw question through without a server-parsed frame", () => {
    const text = prompt("grand-tableau", "Zal ik naar Nederland verhuizen?");
    expect(text).toContain("Zal ik naar Nederland verhuizen?");
    expect(text).not.toContain("domain=");
    expect(text).not.toContain("predicate=");
    expect(text).not.toContain("Question predicate:");
    expect(text).not.toContain("Question subjects:");
  });
});

// --------------------------------------------------------------------------------------
// 4. Intrinsic positional roles remain correct
// --------------------------------------------------------------------------------------

describe("invariant 4: intrinsic positional roles remain correct", () => {
  it("keeps the sentence-3 roles the spread itself defines", () => {
    const cards = draw(3, 24);
    const ctx = context("sentence-3", "Will the deal close?", cards);
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

  it("keeps the Petit Tableau geometric centre on position 5", () => {
    const ctx = context("comprehensive", "What will the month bring?", draw(9, 5));
    const facts = buildSpreadFacts(ctx);
    expect((ctx.layout as { center: { index: number } }).center.index).toBe(4);
    expect(facts).toContain("Geometric centre: position 5 (row 2, col 2).");
  });

  it("keeps Grand Tableau significator placement and binding state explicit", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Will we stay together?", draw(36, 13)));
    expect(facts).toContain("Significators:");
    expect(facts).toMatch(/- Man: position \d+, row \d, col \d, .+ house; (?:bound by .+|unbound)/);
    expect(facts).toMatch(/- Woman: position \d+, row \d, col \d, .+ house; (?:bound by .+|unbound)/);
  });

  /**
   * The server may state which relation two significators have. It may not forbid the
   * model from reading one: Man and Woman frequently sit a knight's move apart, and an
   * instruction not to treat them as related at all was suppressing a real spatial fact.
   */
  it("never forbids the model from weighing the significators' relation to each other", () => {
    for (const offset of [0, 5, 13, 27]) {
      const facts = buildSpreadFacts(context("grand-tableau", "Full picture?", draw(36, offset)));
      expect(facts).not.toContain("do not treat them as a pair");
      expect(facts).not.toMatch(/do not (?:read|interpret) .*(?:them|together)/i);
      expect(facts).toContain("weigh their relation to each other from the coordinates above");
    }
  });

  it("states the significator focus factually", () => {
    const manFacts = buildSpreadFacts(
      buildReadingContext("grand-tableau", "Full picture?", draw(36, 13), cardsMap, "man"),
    );
    expect(manFacts).toContain("Significator focus: Man");
    expect(manFacts).toContain("still present as an ordinary card");
  });
});

// --------------------------------------------------------------------------------------
// 5. Geometry is coordinates, and relations are derivable (not precomputed)
// --------------------------------------------------------------------------------------

describe("invariant 5: geometry is coordinates, relations are derivable not precomputed", () => {
  it("gives exact row/column coordinates for every grid card", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Geometry?", draw(36, 13)));
    for (let index = 0; index < 36; index++) {
      const line = facts.split("\n").find((entry) => entry.startsWith(`- ${index + 1}: `))!;
      expect(line).toContain(`row ${Math.floor(index / 9) + 1}, col ${(index % 9) + 1}`);
    }
  });

  it("never precomputes relation lists in any spread", () => {
    for (const { id, count } of ALL_SPREADS) {
      const facts = buildSpreadFacts(context(id, "Geometry?", draw(count)));
      expect(facts, id).not.toMatch(/^- \d+\+\d+: /m);
      expect(facts, id).not.toContain("- diagonal ");
      expect(facts, id).not.toContain("- knight: ");
      expect(facts, id).not.toContain("- column ");
      expect(facts, id).not.toContain("Mirrored across a significator");
      expect(facts, id).not.toContain("Adjacent pairs");
    }
  });

  it("tells the model the coordinates are authoritative and relations must be derived", () => {
    for (const { id, count } of ALL_SPREADS) {
      const text = prompt(id, "Geometry?", draw(count));
      expect(text, id).toMatch(/The coordinates above are authoritative/);
      expect(text, id).toMatch(
        /Derive adjacency, rows, columns, diagonals, knight's moves, mirroring and distances from them yourself/,
      );
      expect(text, id).toMatch(/Never invent a position, a house or a spatial relationship/);
    }
  });

  it("is stable across repeated builds of the same spread", () => {
    const cards = draw(36, 13);
    expect(buildSpreadFacts(context("grand-tableau", "Geometry?", cards))).toBe(
      buildSpreadFacts(context("grand-tableau", "Geometry?", cards)),
    );
  });
});

// --------------------------------------------------------------------------------------
// 6. Grand Tableau houses are all supplied
// --------------------------------------------------------------------------------------

describe("invariant 6: Grand Tableau houses are all supplied", () => {
  const ctx = context("grand-tableau", "Full picture?", draw(36, 13));
  const facts = buildSpreadFacts(ctx);

  it("supplies all 36 houses, one per card line", () => {
    expect(facts.split("\n").filter((line) => / house$/.test(line))).toHaveLength(36);
  });

  it("supplies every canonical house", () => {
    for (const house of deck) {
      expect(facts, `${house.name} house must be supplied`).toContain(`${house.name} house`);
    }
  });

  it("names each house after the canonical deck, never a divergent alias", () => {
    const houseNames = facts
      .split("\n")
      .map((line) => line.match(/, ([^,]+) house$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => match[1]);
    expect(houseNames).toEqual(deck.map((card) => card.name));
    expect(facts).not.toContain("Crossroads house");
  });
});

// --------------------------------------------------------------------------------------
// 7. Model output cannot introduce cards not drawn
// --------------------------------------------------------------------------------------

describe("invariant 7: model output cannot introduce cards not drawn", () => {
  const drawn = [2, 6, 24, 25]; // Clover, Clouds, Heart, Ring
  const base = {
    answer: "The situation stays open.",
    reading: "The spread shows movement without a firm conclusion.",
    patterns: [] as { cards: string; meaning: string }[],
    timing: null as string | null,
  };
  const answer = (overrides: Partial<typeof base> = {}) => SimpleAnswerSchema.parse({ ...base, ...overrides });

  it("accepts a reading that names only drawn cards", () => {
    expect(
      findInventedCards(
        answer({
          reading: "Clover beside Heart keeps a small emotional opening alive.",
          patterns: [{ cards: "Clover + Heart", meaning: "a small favourable opening." }],
        }),
        drawn,
      ),
    ).toEqual([]);
  });

  it("rejects an undrawn card named in a pattern label", () => {
    expect(
      findInventedCards(answer({ patterns: [{ cards: "Heart + Tower", meaning: "a collapse." }] }), drawn),
    ).toContain(19);
  });

  it("rejects an explicit card reference to an undrawn card in prose", () => {
    expect(findInventedCards(answer({ reading: "The Clouds + Mice line points to erosion." }), drawn)).toContain(23);
  });

  it("rejects an unambiguous undrawn card named bare in prose", () => {
    expect(findInventedCards(answer({ reading: "A Stork sits between the two people." }), drawn)).toContain(17);
  });

  it("does not mistake ordinary English words for card references", () => {
    expect(
      findInventedCards(
        answer({
          answer: "A man and a woman will have to talk about the key issue.",
          reading:
            "The heart of the matter is that their home feels heavy, and the letter they are waiting for crosses a line they drew for themselves.",
          timing: "soon",
        }),
        drawn,
      ),
    ).toEqual([]);
  });

  // Casing matrix. An earlier detector built its bare-mention pattern from the lowercase
  // keys of CARD_NAME_TO_ID without the `i` flag, so every capitalised mention of a
  // distinctive card silently slipped through.
  describe.each([
    ["Rider", 1],
    ["rider", 1],
    ["The Rider card", 1],
    ["the rider card", 1],
    ["Rider + Heart", 1],
    ["Stork", 17],
    ["stork", 17],
    ["Scythe", 10],
    ["scythe", 10],
  ])("rejects the undrawn card referenced as %j", (mention, expectedId) => {
    it("flags it in prose", () => {
      expect(findInventedCards(answer({ reading: `The line turns on ${mention} in this spread.` }), drawn)).toContain(
        expectedId,
      );
    });

    it("flags it in a pattern label", () => {
      expect(findInventedCards(answer({ patterns: [{ cards: mention, meaning: "a decisive turn." }] }), drawn)).toContain(
        expectedId,
      );
    });
  });

  it("does not flag lowercase everyday usage of ordinary-word card names", () => {
    expect(
      findInventedCards(
        answer({
          reading:
            "Clouds gather over the situation before the anchor of the plan holds. Birds of a feather stick together here, and a bouquet of small wins keeps the mood up.",
        }),
        drawn,
      ),
    ).toEqual([]);
  });

  it("does flag an explicit combination in prose", () => {
    expect(findInventedCards(answer({ reading: "The Clouds + Anchor line holds." }), drawn)).toEqual([35]);
  });

  describe("through the production generation path", () => {
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

    it("fails the reading when the model names an undrawn card", async () => {
      generateText.mockResolvedValueOnce({
        text: JSON.stringify({
          answer: "It will not hold.",
          reading: "The spread points elsewhere.",
          patterns: [{ cards: "Clover + Scythe", meaning: "a sudden cut." }],
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
          patterns: [{ cards: "Clover + Heart", meaning: "a small favourable opening." }],
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

// --------------------------------------------------------------------------------------
// 8. One universal pipeline and one contract for every spread
// --------------------------------------------------------------------------------------

describe("invariant 8: one universal pipeline handles every spread", () => {
  it("covers every declared spread id", () => {
    expect(ALL_SPREADS.map((s) => s.id).sort()).toEqual([...SPREAD_IDS].sort());
  });

  it("uses the same prompt skeleton for 1, 3, 5, 9 and 36 cards", () => {
    for (const { id, count } of ALL_SPREADS) {
      const text = prompt(id, "Will I move house?", draw(count));
      expect(text, id).toContain("User question:");
      expect(text, id).toContain("Will I move house?");
      expect(text, id).toContain("Structural facts (deterministic; complete for this spread):");
      expect(text, id).toContain("Person bindings:");
      expect(text, id).toContain("- Man:");
      expect(text, id).toContain("- Woman:");
      expect(text, id).toContain("Synthesis contract:");
      expect(text, id).toContain("Return only one JSON object");
    }
  });

  it("gives one small contract for every spread, with no server-chosen shape", () => {
    for (const { id, count } of ALL_SPREADS) {
      const text = prompt(id, "How will my relationship develop?", draw(count));
      expect(text, id).toContain('"answer": string');
      expect(text, id).toContain('"reading": string');
      expect(text, id).toContain('"patterns"');
      expect(text, id).toContain('"timing": string | null');
      // Each removed field was a per-spread judgement about how much a spread had to
      // say, and each produced restated conclusions.
      for (const removed of [
        '"positiveFactors"',
        '"challenges"',
        '"development"',
        '"housesAndMirrors"',
        '"directAnswer"',
        '"keyPatterns"',
        '"combination"',
      ]) {
        expect(text, id).not.toContain(removed);
      }
    }
  });

  it("keeps the structural layer the single source of spread description", () => {
    const ctx = context("grand-tableau", "Full picture?", draw(36));
    expect(buildSimpleReadingPrompt(ctx)).toContain(buildSpreadFacts(ctx));
  });

  it("scales the token budget with the spread", () => {
    const budgets = ALL_SPREADS.map((s) => getTokenBudget(s.count));
    for (let i = 1; i < budgets.length; i++) {
      expect(budgets[i]).toBeGreaterThanOrEqual(budgets[i - 1]);
    }
    expect(getTokenBudget(36)).toBeGreaterThan(getTokenBudget(3));
  });

  it("tells the model to weigh the whole spread and never invent structure", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Consider the spread as a whole before reaching a conclusion/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Weigh supporting and conflicting indications/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/structural data supplied by the server is authoritative/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(
      /Do not invent cards, positions, spatial relationships, people, events, or facts/i,
    );
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/houses and verified spatial relationships/i);
  });

  it("does not leak internal classification metadata into the prompt", () => {
    for (const { id, count } of ALL_SPREADS) {
      const text = prompt(id, "Will the situation resolve?", draw(count));
      expect(text).not.toMatch(/;\s*STRONG\b/);
      expect(text).not.toMatch(/;\s*NEUTRAL\b/);
      expect(text).not.toMatch(/;\s*WEAK\b/);
      expect(text).not.toMatch(/;\s*timing:/i);
    }
  });
});