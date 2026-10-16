import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt } from "@/lib/prompt-builder";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/** Geometry and house checks: card positions, neighbours and houses must match the grid. */

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

function drawIds(ids: number[]) {
  return ids.map((id) => {
    const card = cardsMap.get(id)!;
    return { id, name: card.name, keywords: card.keywords, coreMeaning: card.meaning.general };
  });
}

function draw(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const card = deck[(i + offset) % deck.length];
    return { id: card.id, name: card.name, keywords: card.keywords, coreMeaning: card.meaning.general };
  });
}

/** The line of the prompt that starts with `- <name> (row`, i.e. one card's neighbour line. */
function neighbourLine(prompt: string, name: string): string {
  const line = prompt.split("\n").find((l) => l.startsWith(`- ${name} (row`));
  if (!line) throw new Error(`no neighbour line for ${name}`);
  return line;
}

function rowLines(prompt: string): string[] {
  return prompt.split("\n").filter((line) => /^Row \d+: /.test(line));
}

const regressionIds = [
  28, 7, 14, 17, 1, 20, 13, 15, 18,
  33, 26, 25, 30, 21, 35, 19, 11, 29,
  3, 31, 12, 27, 8, 24, 16, 34, 2,
  23, 10, 4, 36, 9, 32, 6, 22, 5,
];

describe("Grand Tableau: 4x9 rows, houses and positions", () => {
  const prompt = buildSimpleReadingPrompt(
    buildReadingContext("grand-tableau", "Full picture?", draw(36, 13), cardsMap),
  );

  it("prints four rows of nine cards", () => {
    expect(rowLines(prompt)).toHaveLength(4);
    for (const line of rowLines(prompt)) {
      expect(line.split(": ")[1].split(" | ")).toHaveLength(9);
    }
  });

  it("names every house exactly once, with the card at position N occupying house N", () => {
    const houseLines = prompt.split("\n").filter((line) => /^\d+: .+ — .+ house$/.test(line));
    expect(houseLines).toHaveLength(36);
    houseLines.forEach((line, index) => {
      const [, position, card, house] = line.match(/^(\d+): (.+) — (.+) house$/)!;
      expect(Number(position)).toBe(index + 1);
      expect(house).toBe(deck[index].name);
      expect(card).not.toBe("");
    });
  });

  it("reports the significator positions from the drawn order", () => {
    const womanAt = draw(36, 13).findIndex((card) => card.id === 29) + 1;
    expect(prompt).toContain(`Woman (significator) is at position ${womanAt}.`);
  });
});

describe("Grand Tableau: immediate neighbours are computed from coordinates", () => {
  const cards = drawIds(regressionIds);
  const prompt = buildSimpleReadingPrompt(
    buildReadingContext("grand-tableau", "Will the shared plan work out?", cards, cardsMap),
  );

  it("keeps the exact 4x9 rows", () => {
    expect(rowLines(prompt)).toEqual([
      "Row 1: Man | Snake | Fox | Stork | Rider | Garden | Child | Bear | Dog",
      "Row 2: Key | Book | Ring | Lily | Mountain | Anchor | Tower | Whip | Woman",
      "Row 3: Ship | Sun | Birds | Letter | Coffin | Heart | Stars | Fish | Clover",
      "Row 4: Mice | Scythe | House | Cross | Bouquet | Moon | Clouds | Paths | Tree",
    ]);
  });

  it("lists the corner card Man with exactly its three real neighbours", () => {
    expect(neighbourLine(prompt, "Man")).toBe(
      "- Man (row 1, column 1): Snake (right), Key (below), Book (below-right)",
    );
  });

  it("lists Woman at the right edge without wrapping onto the next row", () => {
    expect(neighbourLine(prompt, "Woman")).toBe(
      "- Woman (row 2, column 9): Bear (above-left), Dog (above), Whip (left), Fish (below-left), Clover (below)",
    );
  });

  it("does not list a same-row card two columns away as a neighbour", () => {
    expect(neighbourLine(prompt, "Man")).not.toContain("Fox");
    expect(neighbourLine(prompt, "Woman")).not.toContain("Tower");
  });
});

describe("Grand Tableau: a house relation is not a spatial one", () => {
  // Dog-house occupancy: Woman sits at position 18 (row 2, column 9) and is not a neighbour of Dog's cell.
  const cards = drawIds(regressionIds);
  const prompt = buildSimpleReadingPrompt(
    buildReadingContext("grand-tableau", "Will the shared plan work out?", cards, cardsMap),
  );

  it("places each card in its own grid cell regardless of which house it occupies", () => {
    expect(prompt).toContain("18: Woman — Dog house");
    expect(neighbourLine(prompt, "Woman")).not.toContain("Dog (below)");
  });

  it("keeps the Sun-in-Man-house fact separate from Sun's grid position", () => {
    const sunShuffle = drawIds([22, 16, 2, 29, 15, 4, 23, 27, 9, 24, 19, 10, 7, 32, 33, 6, 3, 1, 13, 8, 21, 34, 20, 30, 5, 36, 25, 31, 11, 26, 35, 14, 12, 18, 17, 28]);
    const shuffled = buildSimpleReadingPrompt(buildReadingContext("grand-tableau", "Outlook?", sunShuffle, cardsMap, "both"));
    expect(shuffled).toContain("28: Sun — Man house");
    expect(neighbourLine(shuffled, "Sun")).toBe("- Sun (row 4, column 1): Child (above), Coffin (above-right), Whip (right)");
  });
});

describe("Grand Tableau: Man and Woman relative placement", () => {
  it("places Man and Woman as adjacent when they share the lower-left block", () => {
    // Woman row 4 column 2, Man row 4 column 1 in the regression layout above.
    const cards = drawIds(regressionIds);
    const prompt = buildSimpleReadingPrompt(buildReadingContext("grand-tableau", "Q", cards, cardsMap, "both"));
    expect(neighbourLine(prompt, "Man")).toContain("Snake (right)");
  });
});

describe("Petit Tableau: 3x3 grid, centre and neighbours", () => {
  const cards = draw(9, 5);
  const prompt = buildSimpleReadingPrompt(
    buildReadingContext("comprehensive", "What will the month bring?", cards, cardsMap),
  );

  it("prints three rows of three cards", () => {
    expect(rowLines(prompt)).toHaveLength(3);
    for (const line of rowLines(prompt)) {
      expect(line.split(": ")[1].split(" | ")).toHaveLength(3);
    }
  });

  it("places the centre card at row 2, column 2", () => {
    expect(prompt).toContain(`Row 2: ${cards[3].name} | ${cards[4].name} | ${cards[5].name}`);
  });

  it("does not repeat the grid as a second neighbour list", () => {
    expect(prompt).not.toContain("Immediate neighbours of each card");
  });
});

describe("Linear spreads: order and adjacency", () => {
  it.each([
    ["single-card", 1],
    ["sentence-3", 3],
    ["sentence-5", 5],
  ] as const)("%s keeps the drawn order and states that adjacency is consecutive", (spreadId, count) => {
    const cards = draw(count, 0);
    const prompt = buildSimpleReadingPrompt(buildReadingContext(spreadId, "Will I move?", cards, cardsMap));
    cards.forEach((card, index) => {
      expect(prompt).toContain(`${index + 1}. ${card.name}`);
    });
    if (count > 1) {
      expect(prompt).toContain("Adjacent cards are neighbours");
    }
  });
});
