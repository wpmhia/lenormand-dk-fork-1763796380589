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
    return {
      id: card.id,
      name: card.name,
      keywords: card.keywords,
      coreMeaning: card.meaning.general,
      secondaryMeanings: card.meaning.secondaryMeanings,
      meaningReviewStatus: card.meaning.reviewStatus,
      position: i,
    };
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
    return {
      id,
      name: card.name,
      keywords: card.keywords,
      coreMeaning: card.meaning.general,
      secondaryMeanings: card.meaning.secondaryMeanings,
      meaningReviewStatus: card.meaning.reviewStatus,
    };
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
    expect(facts).toMatch(/Synthesis: focus on the cards and lines that bear on the question/);
    expect(facts).toMatch(/no fate row and no single outcome position/);
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

  it("keeps geometry structural and supplies core meanings in a separate section", () => {
    const meaningHeader = facts.indexOf("Core card meaning references");
    expect(meaningHeader).toBeGreaterThan(0);
    const structuralLines = facts.slice(0, meaningHeader).split("\n");
    for (const line of structuralLines) {
      if (line.startsWith("Synthesis:")) continue;
      expect(line, `structural facts carry interpretation: ${line}`).not.toMatch(
        /means|indicates|suggests|stands for|represents|is (?:good|bad)|positive|negative|luck/i,
      );
    }
    expect(facts).toContain("Core card meaning references (symbolic reference, not proof of events)");
    expect(facts).toContain("Rider: News, messages, arrival, movement.");
  });
});

describe("Grand Tableau coordinate-neighbour regression", () => {
  const cards = drawIds(regressionLayoutIds);
  const context = buildReadingContext(
    "grand-tableau",
    "Will the shared plan work out?",
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

  it("identifies all four central cells rather than a single center card", () => {
    expect(facts).toContain("Central cells (a 4x9 grid has four, not one, centre cells): positions 14, 15, 23, 24 — Mountain | Anchor | Coffin | Heart.");
  });

  it("handles corner boundaries and includes diagonal neighbours without row wrapping", () => {
    expect(facts).toContain("- Man: row 1, column 1; immediate neighbours: Snake (right), Key (below), Book (below-right).");
    expect(facts).toContain("- Woman: row 2, column 9; immediate neighbours: Bear (above-left), Dog (above), Whip (left), Fish (below-left), Clover (below).");
    expect(facts).toContain("Immediate neighbours (horizontal, vertical and diagonal grid cells; no row wrapping). Each list is complete; unlisted cards are not immediate neighbours:");
    expect(facts).toContain("- Non-neighbours exactly two columns from Man in the same row: Fox (two columns right).");
    expect(facts).toContain("- Non-neighbours exactly two columns from Woman in the same row: Tower (two columns left).");
    const manNeighbours = facts.split("\n").find((line) => line.startsWith("- Man:"))!;
    const womanNeighbours = facts.split("\n").find((line) => line.startsWith("- Woman:"))!;
    expect(manNeighbours).not.toContain("Tree");
    expect(womanNeighbours).not.toContain("Ship");
  });

  it("states the direction of every immediate neighbour relative to the person card", () => {
    const woman = facts.split("\n").find((line) => line.startsWith("- Woman:"))!;
    const man = facts.split("\n").find((line) => line.startsWith("- Man:"))!;
    // Woman (row 2, col 9): Bear above-left, Dog above, Whip left, Fish below-left, Clover below.
    expect(woman).toContain("Bear (above-left)");
    expect(woman).toContain("Dog (above)");
    expect(woman).toContain("Whip (left)");
    expect(woman).toContain("Fish (below-left)");
    expect(woman).toContain("Clover (below)");
    // Man (row 1, col 1): Snake right, Key below, Book below-right.
    expect(man).toContain("Snake (right)");
    expect(man).toContain("Key (below)");
    expect(man).toContain("Book (below-right)");
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
    expect(prompt).toContain("Will the shared plan work out?");
    expect(prompt).toContain("Row 1: Man | Snake | Fox | Stork | Rider | Garden | Child | Bear | Dog");
    expect(prompt).toContain("- Man: row 1, column 1; immediate neighbours: Snake (right), Key (below), Book (below-right).");
    expect(prompt).toContain("- Woman: row 2, column 9; immediate neighbours: Bear (above-left), Dog (above), Whip (left), Fish (below-left), Clover (below).");
    expect(prompt).toContain("Non-neighbours exactly two columns from Woman in the same row: Tower (two columns left).");
    expect(prompt).toContain("A same-row card two columns away is not adjacent");
    expect(prompt).toContain("Woman — Dog house");
    expect(prompt).toContain("Central cells (a 4x9 grid has four, not one, centre cells)");
    expect(prompt).not.toContain("Man is the user");
    expect(prompt).not.toContain("Woman is the user's partner");
    expect(prompt).toContain('"answer": string');
  });
});

describe("nine-card Petit Tableau regression", () => {
  const cards = drawIds([31, 29, 4, 14, 36, 30, 25, 5, 34]);
  const context = buildReadingContext(
    "comprehensive",
    "How might this relationship develop?",
    cards,
    cardsMap,
  );
  const facts = buildSpreadFacts(context);
  const prompt = buildSimpleReadingPrompt(context);

  it("recognizes the centre, rows, columns, and diagonals from exact positions", () => {
    expect(facts).toContain("Centre card: Cross.");
    expect(facts).toContain("Row 1: Sun | Woman | House");
    expect(facts).toContain("Row 2: Fox | Cross | Lily");
    expect(facts).toContain("Row 3: Ring | Tree | Fish");
    expect(facts).toContain("Column 1: Sun | Fox | Ring");
    expect(facts).toContain("Column 2: Woman | Cross | Tree");
    expect(facts).toContain("Column 3: House | Lily | Fish");
    expect(facts).toContain("Diagonal (top-left to bottom-right): Sun | Cross | Fish");
    expect(facts).toContain("Diagonal (top-right to bottom-left): House | Cross | Ring");
  });

  it("uses contextual core meanings without inventing a relationship or a fixed outcome", () => {
    expect(prompt).toContain("Cross: Burden, hardship, suffering, duty, difficult circumstances.");
    expect(prompt).not.toContain("Paths:");
    expect(prompt).toContain("Fox: Work or employment, strategy, self-interest, cunning, caution.");
    expect(prompt).toContain("A secondary meaning never stands alone");
    expect(prompt).toContain("Ring: Commitment, agreement, contract, partnership, cycle.");
    expect(prompt).toContain("Tree: Health, growth, roots, vitality, long duration.");
    expect(prompt).toContain("do not impose chronology");
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

describe("pilot p04 regression: Ring and Heart are in different rows, and Whip/Snake are not near the Woman", () => {
  const cards = drawIds([27, 9, 33, 7, 4, 11, 14, 16, 28, 5, 22, 34, 25, 15, 18, 10, 20, 17, 23, 6, 1, 24, 19, 3, 31, 2, 21, 30, 32, 12, 29, 26, 35, 13, 8, 36]);
  const context = buildReadingContext("grand-tableau", "How is the relationship developing?", cards, cardsMap, "both");
  const facts = buildSpreadFacts(context);

  it("places Ring and Heart in different rows (2 and 3), not the same row", () => {
    const rows = facts.split("\n").filter((l) => /^Row \d+: /.test(l));
    const rowOf = (name: string) => rows.findIndex((r) => r.split(": ")[1].split(" | ").includes(name));
    expect(rowOf("Ring")).not.toBe(rowOf("Heart"));
    expect(rowOf("Ring")).toBe(1);
    expect(rowOf("Heart")).toBe(2);
  });

  it("does not list Whip or Snake among the Woman's immediate neighbours", () => {
    const woman = facts.split("\n").find((l) => l.startsWith("- Woman:"))!;
    expect(woman).not.toMatch(/\bWhip\b/);
    expect(woman).not.toMatch(/\bSnake\b/);
  });
});

describe("benchmark b17 regression: a house relation is not a spatial one", () => {
  // Paths Stars Clover Woman Bear House ... Sun Whip Book Anchor Fox Birds Dog Stork Man (36 cards)
  const cards = drawIds([22, 16, 2, 29, 15, 4, 23, 27, 9, 24, 19, 10, 7, 32, 33, 6, 3, 1, 13, 8, 21, 34, 20, 30, 5, 36, 25, 31, 11, 26, 35, 14, 12, 18, 17, 28]);
  const context = buildReadingContext("grand-tableau", "What is the outlook for my finances?", cards, cardsMap, "both");
  const prompt = buildSimpleReadingPrompt(context);

  it("states that occupying another card's house is not a spatial relation", () => {
    expect(prompt).toContain("A house relation is not a spatial one");
    expect(prompt).toContain("use the grid position and neighbour lists for spatial claims");
  });

  it("keeps the Sun-in-Man-house fact separate from Sun's grid position", () => {
    const facts = buildSpreadFacts(context);
    expect(facts).toContain("position 28 (row 4, col 1): Sun — Man house");
    const man = facts.split("\n").find((line) => line.startsWith("- Man:"))!;
    expect(man).not.toContain("Sun");
  });
});

describe("spatial-claim rule: coordinates before any spatial statement", () => {
  const cards = drawIds([22, 16, 2, 29, 15, 4, 23, 27, 9, 24, 19, 10, 7, 32, 33, 6, 3, 1, 13, 8, 21, 34, 20, 30, 5, 36, 25, 31, 11, 26, 35, 14, 12, 18, 17, 28]);
  const prompt = buildSimpleReadingPrompt(buildReadingContext("grand-tableau", "What is the outlook for my finances?", cards, cardsMap, "both"));

  it("requires row and column checks and a one-row, one-column adjacency limit", () => {
    expect(prompt).toContain("check the row and column of both cards in the grid facts");
    expect(prompt).toContain("differ by at most one row and at most one column");
    expect(prompt).toContain("never from card names, deck numbers or house numbers");
  });

  it("tells the model to drop an unsupported spatial claim rather than invent one", () => {
    expect(prompt).toContain("drop the spatial claim and interpret the symbolic card combination instead");
  });
});
