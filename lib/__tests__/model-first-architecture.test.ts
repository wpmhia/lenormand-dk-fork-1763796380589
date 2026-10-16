import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, getTokenBudget, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { generateReading } from "@/lib/reading-service";
import { SPREAD_IDS, type SpreadId } from "@/lib/spread-definitions";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import type { ReadingContext } from "@/lib/reading-context";
import type { LanguageModel } from "ai";

/**
 * The model-first contract, in one suite:
 *
 *   input -> geometry -> prompt handoff -> one model call -> parse -> render
 *
 * The server supplies canonical cards, core meanings and geometry; DeepSeek interprets; the
 * server parses one JSON object and renders it. The tests check the handoff and the shape of
 * the contract, not the wording of the instructions.
 */

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

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

function context(spreadId: SpreadId, question: string, cards = draw(CARD_COUNT[spreadId])): ReadingContext {
  return buildReadingContext(spreadId, question, cards, cardsMap);
}

function prompt(spreadId: SpreadId, question = "How will my relationship develop?", cards?: ReturnType<typeof draw>): string {
  return buildSimpleReadingPrompt(context(spreadId, question, cards ?? draw(CARD_COUNT[spreadId])));
}

describe("prompt handoff: every drawn card reaches the model in draw order", () => {
  it.each(Object.entries(CARD_COUNT) as [SpreadId, number][])("%s supplies every card in order", (id, count) => {
    const cards = draw(count, 13);
    const text = prompt(id, "Q?", cards);
    let cursor = -1;
    for (const [index, card] of cards.entries()) {
      const at = text.indexOf(`${index + 1}. ${card.name}`, cursor + 1);
      expect(at, `${id}: card ${index + 1} must follow card ${index}`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it("passes the raw question through unchanged", () => {
    const text = prompt("grand-tableau", "Zal het nieuwe plan slagen?");
    expect(text).toContain("User question:\nZal het nieuwe plan slagen?");
  });

  it("supplies the classical core meaning of each drawn card", () => {
    const text = prompt("sentence-3", "Q?", draw(3, 0));
    for (const card of draw(3, 0)) {
      expect(text).toContain(`- ${card.name}: ${card.coreMeaning}`);
    }
  });
});

describe("geometry: spread structure is computed from coordinates", () => {
  it("gives the Grand Tableau four rows of nine cards and all 36 houses", () => {
    const text = prompt("grand-tableau", "Geometry?", draw(36, 13));
    const rows = text.split("\n").filter((line) => /^Row \d+: /.test(line));
    expect(rows).toHaveLength(4);
    const houses = text.split("\n").filter((line) => /^\d+: .+ — .+ house$/.test(line));
    expect(houses).toHaveLength(36);
  });

  it("gives the Petit Tableau's centre card its eight directional neighbours", () => {
    const cards = draw(9, 5);
    const text = prompt("comprehensive", "Geometry?", cards);
    const centreLine = text.split("\n").find((line) => line.startsWith(`- ${cards[4].name} (row 2, column 2)`))!;
    const neighbours = centreLine.slice(centreLine.indexOf("): ") + 3).split(", ");
    expect(neighbours).toHaveLength(8);
    expect(new Set(neighbours.map((n) => n.match(/\((.+)\)$/)?.[1])).size).toBe(8);
  });

  it("states adjacency only for linear and grid spreads, never a generic relation list", () => {
    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const text = prompt(id, "Geometry?", draw(count, 13));
      expect(text, id).not.toMatch(/^- \d+\+\d+: /m);
      expect(text, id).not.toContain("Adjacent pairs");
      expect(text, id).not.toContain("Verified clusters");
    }
  });

  it("states that a line is read left to right with consecutive adjacency", () => {
    const text = buildSimpleReadingPrompt(context("sentence-5", "Will I move?", draw(5, 10)));
    expect(text).toContain("5 cards in a line, read left to right");
  });

  it("is stable across repeated builds", () => {
    const cards = draw(36, 13);
    expect(prompt("grand-tableau", "Geometry?", cards)).toBe(prompt("grand-tableau", "Geometry?", cards));
  });
});

describe("model boundary: the prompt carries no interpretation rules", () => {
  it("keeps the system prompt to the reader role and principles, without the JSON schema", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/experienced traditional Lenormand reader/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).not.toContain('"answer": string');
  });

  it("asks for the answer and reading as one JSON object", () => {
    const text = prompt("comprehensive", "Q?", draw(9));
    expect(text).toContain('{"answer": string, "reading": string}');
  });

  it("does not leak internal classification metadata into the prompt", () => {
    for (const [id, count] of Object.entries(CARD_COUNT) as [SpreadId, number][]) {
      const text = prompt(id, "Will the situation resolve?", draw(count, 13));
      expect(text, id).not.toMatch(/;\s*(STRONG|NEUTRAL|WEAK)\b/);
      expect(text, id).not.toMatch(/timing:/i);
    }
  });

  it("gives the largest spread the largest output budget", () => {
    expect(getTokenBudget(36)).toBeGreaterThan(getTokenBudget(3));
    expect(getTokenBudget(1)).toBeLessThan(getTokenBudget(36));
  });
});

describe("pipeline: one model call per reading, parsed and rendered", () => {
  const serviceOptions = () => ({
    model: {} as LanguageModel,
    system: "system",
    prompt: "prompt",
    maxTokens: 500,
    timeoutMs: 5_000,
  });

  beforeEach(() => generateText.mockReset());

  it.each(SPREAD_IDS as SpreadId[])("%s serves a valid reading in one provider call", async (id) => {
    generateText.mockResolvedValueOnce({
      text: JSON.stringify({ answer: "Yes, movement is supported.", reading: "A steady movement runs through the spread." }),
      finishReason: "stop",
    });

    const result = await generateReading(serviceOptions());

    expect(result.ok, id).toBe(true);
    expect(result.ok && result.reading, id).toContain("## Answer\nYes, movement is supported.");
    expect(generateText, id).toHaveBeenCalledTimes(1);
  });
});
