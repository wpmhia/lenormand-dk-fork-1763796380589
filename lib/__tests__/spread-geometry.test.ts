import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, buildSpreadFacts } from "@/lib/prompt-builder";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/** The structural layer supplies the full tableau and explicit, bounded geometry facts. */

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, position: i };
  });
}

const regressionLayoutIds = [
  28, 7, 14, 17, 1, 20, 13, 15, 18,
  33, 26, 25, 30, 21, 35, 19, 11, 29,
  3, 31, 12, 27, 8, 24, 16, 34, 2,
  23, 10, 4, 36, 9, 32, 6, 22, 5,
];

function drawIds(ids: number[]) {
  return ids.map((id) => {
    const card = cardsMap.get(id)!;
    return { id, name: card.name, keywords: card.keywords };
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

  it("includes the four Grand Tableau rows", () => {
    expect(facts.split("\n").filter((line) => /^Row \d+: /.test(line))).toHaveLength(4);
  });

  it("gives every position as position, row, column, card and house on one line", () => {
    const positionLines = facts.split("\n").filter((line) => /^- position \d+ \(row \d+, col \d+\):/.test(line));
    expect(positionLines).toHaveLength(36);
    expect(positionLines[0]).toMatch(/- position 1 \(row 1, col 1\): .+ — Rider house/);
    // The card at position N is drawn at that position; the house at position N is always
    // the canonical card with deck number N, independent of the draw.
    for (const line of positionLines) {
      const match = line.match(/^- position (\d+) \(row \d+, col \d+\): (.+?) — (.+?) house$/);
      expect(match, line).not.toBeNull();
      const position = Number(match![1]);
      const card = match![2].trim();
      const house = match![3].trim();
      const expectedHouse = deck[position - 1].name;
      expect(house).toBe(expectedHouse);
      expect(card).not.toBe(house);
    }
  });

  it("includes the GT synthesis guidance for weighing the spread", () => {
    expect(facts).toMatch(/Synthesis: weigh any drawn person cards and their neighbours/);
    expect(facts).toMatch(/no fate row, no closing position and no single outcome position/);
  });

  it("states the house rule so the model does not invert occupant and house", () => {
    expect(facts).toMatch(/A card at position N occupies the house of the card with deck number N/);
    expect(facts).toMatch(/Adjacent cards do not change each other's house/);
  });

  it("names every house exactly once, alongside its occupant", () => {
    expect(deck.every((card) => facts.includes(`${card.name} house`))).toBe(true);
    expect(facts.split("\n").filter((line) => / — [\w ]+ house$/.test(line))).toHaveLength(36);
  });

  it("does not invent general pair, diagonal, column or mirror relations", () => {
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

describe("Grand Tableau coordinate-neighbour regression", () => {
  const cards = drawIds(regressionLayoutIds);
  const context = buildReadingContext(
    "grand-tableau",
    "Will my marriage with Mahican work out?",
    cards,
    cardsMap,
  );
  const facts = buildSpreadFacts(context);
  const prompt = buildSimpleReadingPrompt(context);

  it("prints the exact 4x9 rows", () => {
    expect(facts.split("\n").filter((line) => /^Row \d+: /.test(line))).toEqual([
      "Row 1: Man | Snake | Fox | Stork | Rider | Garden | Child | Bear | Dog",
      "Row 2: Key | Book | Ring | Lily | Mountain | Anchor | Tower | Whip | Woman",
      "Row 3: Ship | Sun | Birds | Letter | Coffin | Heart | Stars | Fish | Clover",
      "Row 4: Mice | Scythe | House | Cross | Bouquet | Moon | Clouds | Paths | Tree",
    ]);
  });

  it("handles corner boundaries and includes diagonal neighbours without row wrapping", () => {
    expect(facts).toContain("- Man: row 1, column 1; immediate neighbours: Snake, Key, Book.");
    expect(facts).toContain("- Woman: row 2, column 9; immediate neighbours: Bear, Dog, Whip, Fish, Clover.");
    expect(facts).toContain("Immediate neighbours (horizontal, vertical and diagonal grid cells; no row wrapping):");
    const manNeighbours = facts.split("\n").find((line) => line.startsWith("- Man:"))!;
    const womanNeighbours = facts.split("\n").find((line) => line.startsWith("- Woman:"))!;
    expect(manNeighbours).not.toContain("Tree");
    expect(womanNeighbours).not.toContain("Ship");
  });

  it("keeps row order, non-neighbour Tower and Dog-house occupancy distinct", () => {
    expect(facts).toContain("Row 2: Key | Book | Ring | Lily | Mountain | Anchor | Tower | Whip | Woman");
    expect(facts).toContain("- position 16 (row 2, col 7): Tower — Stars house");
    expect(facts).toContain("- position 18 (row 2, col 9): Woman — Dog house");
    const womanNeighbours = facts.split("\n").find((line) => line.startsWith("- Woman:"))!;
    expect(womanNeighbours).toContain("Dog");
    expect(womanNeighbours).not.toContain("Tower");
    expect(facts).toContain("Immediate adjacency and occupying another card's house are separate relationships; neither implies the other.");
  });

  it("carries the grid and neighbour facts into the final English production prompt", () => {
    expect(prompt).toContain("Will my marriage with Mahican work out?");
    expect(prompt).toContain("Row 1: Man | Snake | Fox | Stork | Rider | Garden | Child | Bear | Dog");
    expect(prompt).toContain("- Man: row 1, column 1; immediate neighbours: Snake, Key, Book.");
    expect(prompt).toContain("- Woman: row 2, column 9; immediate neighbours: Bear, Dog, Whip, Fish, Clover.");
    expect(prompt).toContain("Woman — Dog house");
    expect(prompt).not.toContain("Man is the user");
    expect(prompt).not.toContain("Woman is the user's partner");
    expect(prompt).toContain('"answer": string');
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
