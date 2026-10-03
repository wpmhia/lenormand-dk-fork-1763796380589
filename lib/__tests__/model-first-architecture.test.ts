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
 *   question + complete spread + deterministic structure -> DeepSeek -> validated output
 *
 * and not:
 *
 *   question + spread -> heuristic interpretation -> selected evidence -> DeepSeek
 *
 * These tests are deliberately about the *prompt contract*, not about reading quality:
 * they prove the server hands over the whole spread, preserves what it was given, adds
 * no interpretation of its own, and rejects a reading that invents a card.
 */

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

const catalog = cardsData as Card[];
const cardsMap = new Map<number, Card>(catalog.map((c) => [c.id, c]));
const deck = [...catalog].sort((a, b) => a.id - b.id);

const ALL_SPREADS: { id: SpreadId; count: number; expectedPairs: number }[] = [
  { id: "single-card", count: 1, expectedPairs: 0 },
  { id: "daily-card", count: 1, expectedPairs: 0 },
  { id: "sentence-3", count: 3, expectedPairs: 2 },
  { id: "sentence-5", count: 5, expectedPairs: 4 },
  { id: "comprehensive", count: 9, expectedPairs: 12 },
  { id: "grand-tableau", count: 36, expectedPairs: 59 },
];

/** Draws `count` cards starting at `offset`, wrapping the deck so ids differ from positions. */
function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, position: i };
  });
}

function context(spreadId: SpreadId, question: string, cards = draw(36)): ReadingContext {
  return buildReadingContext(spreadId, question, cards, cardsMap);
}

/** Adjacent-pair lines emitted by the structural layer, as "a+b" index pairs. */
function adjacentPairLines(facts: string): { a: number; b: number }[] {
  return facts
    .split("\n")
    .map((line) => line.match(/^- (\d+)\+(\d+): /))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => ({ a: Number(match[1]), b: Number(match[2]) }));
}

function prompt(spreadId: SpreadId, question = "How will my relationship develop?", cards = draw(36)): string {
  return buildSimpleReadingPrompt(context(spreadId, question, cards));
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

  it("supplies all 36 Grand Tableau cards, none dropped by a server-side shortlist", () => {
    const cards = draw(36);
    const text = prompt("grand-tableau", "Full picture?", cards);
    for (const card of cards) {
      expect(text, `${card.name} must reach the model`).toMatch(new RegExp(`\\d+ ${card.name.replace(/[()]/g, "\\$&")}`));
    }
  });

  it("does not silently shrink the Grand Tableau to the weighted top-20 pair shortlist", () => {
    const ctx = context("grand-tableau", "Full picture?");
    // The context layer still computes a ranked shortlist; the structural layer must ignore it.
    expect(ctx.adjacentPairs.length).toBeLessThanOrEqual(20);
    expect(adjacentPairLines(buildSpreadFacts(ctx))).toHaveLength(59);
  });
});

// --------------------------------------------------------------------------------------
// 2. Card order is preserved
// --------------------------------------------------------------------------------------

describe("invariant 2: card order is preserved", () => {
  it("lists Grand Tableau cards in draw order, not deck order", () => {
    // Rotating the deck guarantees every card id differs from its position, so a
    // prompt that silently sorted by id would be caught here.
    const cards = draw(36, 13);
    const facts = buildSpreadFacts(context("grand-tableau", "Full picture?", cards));

    let cursor = -1;
    for (const card of cards) {
      const at = facts.indexOf(card.name, cursor + 1);
      expect(at, `${card.name} should appear after the previously drawn card`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("renders a linear spread as one ordered line in draw order", () => {
    const cards = draw(3, 24);
    const facts = buildSpreadFacts(context("sentence-3", "Will the deal close?", cards));
    const header = facts.split("\n").find((line) => line.startsWith("Linear sentence spread"))!;
    expect(header).toContain(" | ");
    const segments = header.split(": ").slice(1).join(": ").split(" | ");
    expect(segments).toHaveLength(3);
    segments.forEach((segment, index) => {
      expect(segment.trim().startsWith(`${index + 1} `)).toBe(true);
      expect(segment).toContain(cards[index].name);
    });
  });

  it("keeps Grand Tableau rows row-major and ascending", () => {
    const cards = draw(36, 13);
    const facts = buildSpreadFacts(context("grand-tableau", "Full picture?", cards));
    const rows = facts.split("\n").filter((line) => line.startsWith("Row "));
    expect(rows).toHaveLength(4);
    const positions = rows.flatMap((row) =>
      [...row.matchAll(/(\d+) [A-Z]/g)].map((match) => Number(match[1])),
    );
    expect(positions).toEqual(Array.from({ length: 36 }, (_, i) => i + 1));
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
    "Secondary axis",
    "Development line",
    "Outcome evidence",
    "Supporting evidence",
    "Center four",
    "Corners",
    "Houses (key placements)",
    "Primary outcome",
    "Strongest transition",
    "coreDriver",
    "primaryPair",
    "supportingPair",
    "strongestOutcome",
    "strongestPair",
  ];

  for (const { id } of ALL_SPREADS) {
    it(`keeps ${id} free of narrative-plan vocabulary`, () => {
      const text = prompt(id);
      for (const artifact of PLAN_ARTIFACTS) {
        expect(text, `${id} must not contain "${artifact}"`).not.toContain(artifact);
      }
      expect(text).not.toMatch(/^- Focus:/m);
      expect(text).not.toMatch(/^- Outcome evidence/m);
      expect(text).not.toMatch(/^- Supporting evidence/m);
    });
  }

  it("keeps the spread no longer preselected, in words the model can act on", () => {
    for (const { id } of ALL_SPREADS) {
      expect(prompt(id)).toMatch(/has deliberately not chosen a focus, a main line, supporting evidence or an outcome pair/);
    }
  });

  it("does not filter cards or pairs via a plan-text substring test", () => {
    const source = [
      "buildNarrativePlan",
      "NarrativePlan",
      "planText",
      ".filter((card)",
    ].join("|");
    // The production path must not contain any of these constructs at all.
    const production = [
      require("node:fs").readFileSync("lib/prompt-builder.ts", "utf8"),
      require("node:fs").readFileSync("app/api/readings/interpret/route.ts", "utf8"),
      require("node:fs").readFileSync("app/api/readings/followup/route.ts", "utf8"),
    ].join("\n");
    for (const pattern of source.split("|")) {
      expect(production, `production path must not contain "${pattern}"`).not.toContain(pattern);
    }
  });

  it("sends no card dictionary and no reviewed combination meanings to the model", () => {
    for (const { id } of ALL_SPREADS) {
      const text = prompt(id);
      expect(text).not.toMatch(/Question-scoped card senses/i);
      expect(text).not.toMatch(/Reviewed combination meanings/i);
      expect(text).not.toContain("no reviewed question-scoped meaning supplied");
      expect(text).not.toContain("synthesize this combination using traditional Lenormand knowledge");
    }
  });

  it("keeps prediction-context out of every LLM route", () => {
    const fs = require("node:fs");
    for (const route of [
      "app/api/readings/interpret/route.ts",
      "app/api/readings/followup/route.ts",
    ]) {
      const source = fs.readFileSync(route, "utf8");
      expect(source, `${route} must not build a prediction context`).not.toContain("buildPredictionContext");
      expect(source, `${route} must not send the heuristic evidence pack`).not.toContain("buildLenormandEvidencePack");
    }
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
    expect(facts).toContain(cards[0].name);
    expect(facts).toContain(cards[2].name);
  });

  it("keeps all five sentence-5 roles present", () => {
    const cards = draw(5, 10);
    const facts = buildSpreadFacts(context("sentence-5", "Will I move?", cards));
    const roleLines = facts.split("\n").filter((line) => line.includes("role defined by this spread:"));
    expect(roleLines).toHaveLength(5);
    for (const card of cards) {
      expect(facts).toContain(card.name);
    }
  });

  it("keeps the Petit Tableau geometric centre on position 5", () => {
    const cards = draw(9, 5);
    const ctx = context("comprehensive", "What will the month bring?", cards);
    const facts = buildSpreadFacts(ctx);

    expect(ctx.layout.type).toBe("petit-tableau");
    expect((ctx.layout as { center: { index: number } }).center.index).toBe(4);
    expect(facts).toContain("Geometric centre: position 5 (Row 2, Column 2)");
    expect(facts).toContain(cards[4].name);
  });

  it("keeps Petit Tableau rows, columns and diagonals defined", () => {
    const facts = buildSpreadFacts(context("comprehensive", "What will the month bring?", draw(9)));
    expect(facts).toContain("Petit Tableau 3x3 grid");
    expect(facts).toContain("Row 1:");
    expect(facts).toContain("Row 3:");
    expect(facts).toContain("Columns:");
    expect(facts).toContain("Diagonals: main");
    expect(facts).toContain("other");
  });

  it("keeps Grand Tableau significator placement and binding state explicit", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Will we stay together?", draw(36, 13)));
    expect(facts).toContain("Significators:");
    expect(facts).toContain("Row ");
    expect(facts).toContain("Column ");
    expect(facts).toMatch(/- Man: position \d+, Row \d, Column \d/);
    expect(facts).toMatch(/- Woman: position \d+, Row \d, Column \d/);
    expect(facts).toContain("Significator selection:");
  });

  it("states the significator selection rule explicitly", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Will we stay together?", draw(36, 13)));
    expect(facts).toContain("Significator selection:");
    expect(facts).toContain("read each one's own neighbourhood");
  });
});

// --------------------------------------------------------------------------------------
// 5. Tableau geometry is deterministic
// --------------------------------------------------------------------------------------

describe("invariant 5: tableau geometry is deterministic", () => {
  for (const { id, count, expectedPairs } of ALL_SPREADS) {
    it(`emits exactly the ${expectedPairs} geometric neighbour pair(s) for ${id}`, () => {
      const pairs = adjacentPairLines(buildSpreadFacts(context(id, "Geometry?", draw(count))));
      expect(pairs).toHaveLength(expectedPairs);
      expect(new Set(pairs.map((p) => `${p.a}+${p.b}`)).size).toBe(expectedPairs);
      for (const { a, b } of pairs) {
        expect(a).not.toBe(b);
        expect(a).toBeGreaterThan(0);
        expect(b).toBeLessThanOrEqual(count);
      }
    });
  }

  it("emits only real grid neighbours for a 4x9 Grand Tableau", () => {
    const pairs = adjacentPairLines(buildSpreadFacts(context("grand-tableau", "Geometry?", draw(36, 13))));
    for (const { a, b } of pairs) {
      const rowA = Math.floor((a - 1) / 9);
      const colA = (a - 1) % 9;
      const rowB = Math.floor((b - 1) / 9);
      const colB = (b - 1) % 9;
      expect(Math.abs(rowA - rowB), `positions ${a} and ${b} are not grid neighbours`).toBeLessThanOrEqual(1);
      expect(Math.abs(colA - colB), `positions ${a} and ${b} are not grid neighbours`).toBeLessThanOrEqual(1);
    }
  });

  it("emits only real grid neighbours for a 3x3 Petit Tableau", () => {
    const pairs = adjacentPairLines(buildSpreadFacts(context("comprehensive", "Geometry?", draw(9, 5))));
    for (const { a, b } of pairs) {
      expect(Math.abs(Math.floor((a - 1) / 3) - Math.floor((b - 1) / 3))).toBeLessThanOrEqual(1);
      expect(Math.abs(((a - 1) % 3) - ((b - 1) % 3))).toBeLessThanOrEqual(1);
    }
  });

  it("derives linear adjacency from consecutive positions only", () => {
    const pairs = adjacentPairLines(buildSpreadFacts(context("sentence-5", "Geometry?", draw(5, 10))));
    expect(pairs.map((p) => `${p.a}+${p.b}`)).toEqual(["1+2", "2+3", "3+4", "4+5"]);
  });

  it("is stable across repeated builds of the same spread", () => {
    const cards = draw(36, 13);
    const first = buildSpreadFacts(context("grand-tableau", "Geometry?", cards));
    const second = buildSpreadFacts(context("grand-tableau", "Geometry?", cards));
    expect(second).toBe(first);
  });

  it("does not attach interpretation to a geometric pair", () => {
    const facts = buildSpreadFacts(context("grand-tableau", "Geometry?", draw(36, 13)));
    // A pair line is geometry only: "<a>+<b>: <card> + <card>".
    for (const line of facts.split("\n").filter((l) => /^- \d+\+\d+: /.test(l))) {
      expect(line).not.toMatch(/means|indicates|suggests|stands for|represents/i);
    }
  });
});

// --------------------------------------------------------------------------------------
// 6. Grand Tableau houses are all supplied
// --------------------------------------------------------------------------------------

describe("invariant 6: Grand Tableau houses are all supplied", () => {
  const ctx = context("grand-tableau", "Full picture?", draw(36, 13));
  const facts = buildSpreadFacts(ctx);

  it("supplies all 36 houses", () => {
    expect(ctx.layout.type).toBe("grand-tableau");
    const houseLines = facts.split("\n").filter((line) => /^- position \d+: .+ house, occupied by /.test(line));
    expect(houseLines).toHaveLength(36);
  });

  it("supplies every canonical house in deck order", () => {
    for (const house of deck) {
      expect(facts, `${house.name} house must be supplied`).toContain(`${house.name} house, occupied by`);
    }
  });

  it("names the occupying card for every house", () => {
    const houseLines = facts.split("\n").filter((line) => /^- position \d+: .+ house, occupied by /.test(line));
    for (const line of houseLines) {
      const occupant = line.split("occupied by ")[1].trim();
      expect(occupant.length).toBeGreaterThan(0);
    }
  });

  it("maps every drawn card to exactly one house occupancy", () => {
    const cards = draw(36, 13);
    const houseLines = facts.split("\n").filter((line) => /^- position \d+: .+ house, occupied by /.test(line));
    for (const card of cards) {
      // Occupants may carry a person-card annotation and a " [card N]" suffix when the
      // drawn card sits at a position other than its own, so allow both.
      const escaped = card.name.replace(/[()]/g, "\\$&");
      const pattern = new RegExp(`^${escaped}( \\(specific person/significator\\))?( \\[card \\d+\\])?$`);
      const hits = houseLines.filter((line) => pattern.test(line.split("occupied by ")[1]));
      expect(hits.length, `${card.name} should occupy exactly one house`).toBe(1);
    }
  });

  it("names each house after the canonical deck, never a divergent alias", () => {
    // House 22 used to be announced as "Crossroads" while the drawn card was "Paths",
    // which handed the model two names for one card.
    const houseNames = facts
      .split("\n")
      .filter((line) => /^- position \d+: .+ house, occupied by /.test(line))
      .map((line) => line.match(/^- position \d+: (.+) house, occupied by /)![1]);

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
    directAnswer: "The situation stays open.",
    interpretation: "The spread shows movement without a firm conclusion.",
    positiveFactors: [] as string[],
    challenges: [] as string[],
    keyPatterns: [] as { cards: string; meaning: string }[],
    development: null as string | null,
    cards: [] as { combination: string; meaning: string }[],
    timing: null as string | null,
    housesAndMirrors: [] as { house: string; meaning: string }[],
  };
  const answer = (overrides: Partial<typeof base> = {}) => SimpleAnswerSchema.parse({ ...base, ...overrides });

  it("accepts a reading that names only drawn cards", () => {
    expect(
      findInventedCards(
        answer({
          interpretation: "Clover beside Heart keeps a small emotional opening alive.",
          keyPatterns: [{ cards: "Clover + Heart", meaning: "a small favourable opening." }],
        }),
        drawn,
      ),
    ).toEqual([]);
  });

  it("rejects an undrawn card named in a key pattern", () => {
    expect(
      findInventedCards(answer({ keyPatterns: [{ cards: "Clover + Scythe", meaning: "a sudden cut." }] }), drawn),
    ).toContain(10);
  });

  it("rejects an undrawn card named in a key combination", () => {
    expect(
      findInventedCards(answer({ cards: [{ combination: "Heart + Tower", meaning: "a collapse." }] }), drawn),
    ).toContain(19);
  });

  it("rejects an undrawn card named as a house", () => {
    expect(
      findInventedCards(answer({ housesAndMirrors: [{ house: "Stork house", meaning: "change." }] }), drawn),
    ).toContain(17);
  });

  it("rejects an explicit card reference to an undrawn card in prose", () => {
    expect(findInventedCards(answer({ interpretation: "The Clouds + Mice line points to erosion." }), drawn)).toContain(23);
  });

  it("rejects an unambiguous undrawn card named bare in prose", () => {
    expect(findInventedCards(answer({ interpretation: "A Stork sits between the two people." }), drawn)).toContain(17);
  });

  it("does not mistake ordinary English words for card references", () => {
    // House, Heart, Sun, Key, Man, Woman, Cross, Tree and Letter are everyday words.
    expect(
      findInventedCards(
        answer({
          directAnswer: "A man and a woman will have to talk about the key issue.",
          interpretation:
            "The heart of the matter is that their home feels heavy, and the letter they are waiting for crosses a line they drew for themselves.",
          positiveFactors: ["the sun comes out", "a key part of this eases"],
          challenges: ["they each watch the tree grow at their own speed"],
          development: "They learn to cross from worry into shared work.",
          timing: "soon",
        }),
        drawn,
      ),
    ).toEqual([]);
  });

  it("does not treat the house wrapper in 'House of Heart' as a reference to the House card", () => {
    expect(
      findInventedCards(answer({ housesAndMirrors: [{ house: "House of Heart", meaning: "love becomes central." }] }), drawn),
    ).toEqual([]);
  });

  // Casing matrix. An earlier version of this detector built its bare-mention pattern
  // from the lowercase keys of CARD_NAME_TO_ID without the `i` flag, so every
  // capitalised mention of a distinctive card ("Rider", "Stork") silently slipped
  // through. These cases pin the behaviour in both casings so it cannot regress.
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
      const reading = answer({ interpretation: `The line turns on ${mention} in this spread.` });
      expect(findInventedCards(reading, drawn)).toContain(expectedId);
    });

    it("flags it in a key pattern label", () => {
      const reading = answer({ keyPatterns: [{ cards: mention, meaning: "a decisive turn." }] });
      expect(findInventedCards(reading, drawn)).toContain(expectedId);
    });
  });

  it("still accepts a reading where the distinctive cards were drawn", () => {
    expect(
      findInventedCards(
        answer({
          interpretation: "The stork and the clover agree with the heart of the matter.",
          keyPatterns: [{ cards: "Stork + Clover", meaning: "a small favourable change." }],
        }),
        [...drawn, 17],
      ),
    ).toEqual([]);
  });

  /**
   * Deliberate boundary. Clouds, Birds, Anchor, Whip, Bouquet, Snake and Fox are ordinary
   * words a sentence can legitimately begin with ("Clouds gather over this", "Birds of a
   * feather", "Anchors the plan"). Flagging a bare mention of those would reject a whole
   * valid reading, so they are only caught where a card reference is unambiguous.
   */
  describe("ordinary-word card names are caught only where a reference is unambiguous", () => {
    const ordinaryProse =
      "Clouds gather over the situation before the anchor of the plan holds. Birds of a feather stick together here, and a bouquet of small wins keeps the mood up.";

    it("does not flag a bare mention in prose", () => {
      expect(findInventedCards(answer({ interpretation: ordinaryProse }), drawn)).toEqual([]);
    });

    it("does flag an explicit combination in prose", () => {
      // Clouds is drawn, Anchor is not: only the undrawn half of the combination counts.
      expect(findInventedCards(answer({ interpretation: "The Clouds + Anchor line holds." }), drawn)).toEqual([35]);
    });

    it("does flag an explicit combination mentioning an undrawn ordinary-word card", () => {
      expect(findInventedCards(answer({ interpretation: "The Clouds + Birds line is noisy." }), drawn)).toEqual([12]);
    });

    it("does flag a bare mention in a label field", () => {
      expect(findInventedCards(answer({ keyPatterns: [{ cards: "Birds", meaning: "news." }] }), drawn)).toContain(12);
    });
  });

  describe("through the production generation path", () => {
    const serviceOptions = (cards: { id: number; name: string }[], answer: unknown) => ({
      context: { cards } as unknown as ReadingContext,
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
          directAnswer: "It will not hold.",
          interpretation: "The spread points elsewhere.",
          keyPatterns: [{ cards: "Clover + Scythe", meaning: "a sudden cut." }],
        }),
        finishReason: "stop",
      });

      const result = await generateReading(serviceOptions(cardsMap ? [
        { id: 2, name: "Clover" },
        { id: 24, name: "Heart" },
      ] : [], {}));

      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toBe("invented-card");
      expect(result.ok === false && result.issues[0].type).toBe("invented_card");
    });

    it("returns the reading when the model stays inside the drawn set", async () => {
      generateText.mockResolvedValueOnce({
        text: JSON.stringify({
          directAnswer: "It stays open.",
          interpretation: "A small favourable opening remains.",
          keyPatterns: [{ cards: "Clover + Heart", meaning: "a small favourable opening." }],
        }),
        finishReason: "stop",
      });

      const result = await generateReading(serviceOptions([{ id: 2, name: "Clover" }, { id: 24, name: "Heart" }], {}));

      expect(result.ok).toBe(true);
      expect(result.ok && result.reading).toContain("It stays open.");
    });
  });
});

// --------------------------------------------------------------------------------------
// 8. The same universal prompt pipeline handles every spread
// --------------------------------------------------------------------------------------

describe("invariant 8: one universal prompt pipeline handles every spread", () => {
  it("covers every declared spread id", () => {
    const covered = ALL_SPREADS.map((s) => s.id).sort();
    expect(covered).toEqual([...SPREAD_IDS].sort());
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
      expect(text, id).toContain('"directAnswer": string');
      expect(text, id).toContain('"interpretation": string');
      expect(text, id).toContain("Return only one JSON object");
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

  it("gives the model presentation capacity instead of a methodological straitjacket", () => {
    const text = prompt("grand-tableau");
    expect(text).toContain('"positiveFactors": string[]');
    expect(text).toContain('"challenges": string[]');
    expect(text).toContain('"keyPatterns"');
    expect(text).toContain('"development": string | null');
  });

  it("tells the model to weigh the whole spread and never invent structure", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Consider the spread as a whole before reaching a conclusion/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Weigh supporting and conflicting indications/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/structural data supplied by the server is authoritative/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Do not invent cards, positions, spatial relationships, people, events, or facts/i);
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