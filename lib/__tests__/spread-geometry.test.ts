import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSpreadFacts } from "@/lib/prompt-builder";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/**
 * The structural layer supplies the full tableau plus server-selected verified clusters.
 * It must not precompute relation lists, coordinates or geometry for the model to guess.
 */

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, position: i };
  });
}

describe("buildSpreadFacts: the Grand Tableau supplies the grid and house occupants", () => {
  const facts = buildSpreadFacts(
    buildReadingContext("grand-tableau", "Full picture?", draw(36, 13), cardsMap),
  );

  it("states the grid shape and how positions are numbered", () => {
    expect(facts).toContain("Grand Tableau, a 4x9 grid of 36 cards.");
    expect(facts).toContain("Position 1 is row 1 column 1");
    expect(facts).toContain("numbering runs left to right, then top to bottom");
  });

  it("gives every position as position, row, column, card and house on one line", () => {
    const positionLines = facts.split("\n").filter((line) => /^- position \d+ \(row \d+, col \d+\):/.test(line));
    expect(positionLines).toHaveLength(36);
    expect(positionLines[0]).toMatch(/- position 1 \(row 1, col 1\): .+ — this card is also the Rider house here\./);
    // The card at position N and the house at position N are the same card, but the prompt
    // does not conflate them. The drawn card at position N follows the test draw's offset
    // (draw[i][13]); the house label is always the canonical deck name at position N
    // (sorted by id).
    const drawOffset = 13;
    for (const line of positionLines) {
      const match = line.match(/^- position (\d+) \(row \d+, col \d+\): (.+?) — this card is also the (.+?) house here\.$/);
      expect(match, line).not.toBeNull();
      const position = Number(match![1]);
      const card = match![2].trim();
      const house = match![3].trim();
      const expectedCard = deck[(position - 1 + drawOffset) % deck.length].name;
      const expectedHouse = deck[position - 1].name;
      expect(card).toBe(expectedCard);
      expect(house).toBe(expectedHouse);
    }
  });

  it("includes the GT synthesis guidance for weighing the spread", () => {
    expect(facts).toMatch(/Synthesis: weigh any drawn person cards and their neighbours/);
    expect(facts).toMatch(/no fate row, no closing position and no single outcome position/);
  });

  it("states the house rule so the model does not invert occupant and house", () => {
    expect(facts).toMatch(/House rule: every position has exactly one card/);
    expect(facts).toMatch(/a card never occupies a house at another position/);
  });

  it("names every house exactly once, alongside its occupant", () => {
    expect(deck.every((card) => facts.includes(`${card.name} house`))).toBe(true);
    expect(facts.split("\n").filter((line) => / — this card is also the \w+ house here\./.test(line))).toHaveLength(36);
  });

  it("never precomputes a relation list or coordinate line", () => {
    expect(facts).not.toMatch(/^- \d+: .+, row \d+, col \d+/m);
    expect(facts).not.toMatch(/^- \d+\+\d+: /m);
    expect(facts).not.toContain("- diagonal ");
    expect(facts).not.toContain("- knight: ");
    expect(facts).not.toContain("- column ");
    expect(facts).not.toContain("Adjacent pairs");
    expect(facts).not.toContain("Mirrored across a significator");
  });

  it("supplies no card-meaning interpretation anywhere", () => {
    for (const line of facts.split("\n")) {
      // The Synthesis line carries procedural weighting instructions, not card interpretation.
      if (line.startsWith("Synthesis:")) continue;
      expect(line, `structural facts carry interpretation: ${line}`).not.toMatch(
        /means|indicates|suggests|stands for|represents|is (?:good|bad)|positive|negative|luck/i,
      );
    }
  });
});

describe("buildSpreadFacts: the Petit Tableau supplies the grid and centre", () => {
  const facts = buildSpreadFacts(
    buildReadingContext("comprehensive", "What will the month bring?", draw(9, 5), cardsMap),
  );

  it("lays the grid out as visual rows", () => {
    expect(facts.split("\n").filter((line) => /^Row \d+: /.test(line))).toHaveLength(3);
  });

  it("names the centre card", () => {
    expect(facts).toContain("Centre card:");
  });

  it("never precomputes a relation list", () => {
    expect(facts).not.toMatch(/^- \d+\+\d+: /m);
    expect(facts).not.toContain("- diagonal ");
    expect(facts).not.toContain("- knight: ");
    expect(facts).not.toContain("- column ");
  });
});

describe("buildSpreadFacts: the line supplies order and adjacency", () => {
  const facts = buildSpreadFacts(
    buildReadingContext("sentence-3", "Will I move?", draw(3, 0), cardsMap),
  );

  it("states the line shape and adjacency rule", () => {
    expect(facts).toContain("Linear sentence spread (3 cards, read left to right)");
    expect(facts).toContain("Adjacency in this spread means consecutive positions");
  });

  it("lists each position with its card", () => {
    expect(facts).toContain("- position 1: Rider");
    expect(facts).toContain("- position 2: Clover");
    expect(facts).toContain("- position 3: Ship");
  });
});
