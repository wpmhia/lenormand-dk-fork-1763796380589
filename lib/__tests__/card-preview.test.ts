import { describe, expect, it } from "vitest";
import { buildCardPreview, buildClassicAnalysis, shortCardPhrase } from "@/lib/classic-analysis";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { getCardById } from "@/lib/data";

const byName = (name: string) => CARD_CATALOG.find((c) => c.name === name)!;
const drawn = (names: string[]) => names.map((n, i) => ({ id: byName(n).id, position: i }));

describe("shortCardPhrase: from the catalogue, never invented", () => {
  it("takes the first traditional phrase, up to three keywords", () => {
    expect(shortCardPhrase("News, messages, arrival, movement.")).toBe("News, messages, arrival");
  });

  it("stops at the first sentence or semicolon", () => {
    expect(shortCardPhrase("Ending, loss, grief; rest, absence.")).toBe("Ending, loss, grief");
  });

  it("returns an empty phrase for empty input rather than inventing text", () => {
    expect(shortCardPhrase("")).toBe("");
  });

  it("is non-empty and short for every card in the catalogue", () => {
    for (const card of CARD_CATALOG) {
      const phrase = shortCardPhrase(card.meaning.general);
      expect(phrase.length, card.name).toBeGreaterThan(0);
      expect(phrase.length, card.name).toBeLessThanOrEqual(44);
    }
  });
});

describe("buildCardPreview: the drawn cards, in order, with their own phrase", () => {
  const names = ["Book", "Letter", "Key", "Stars", "Woman"];
  const analysis = buildClassicAnalysis("sentence-5", "Will this move forward?", drawn(names));
  const preview = buildCardPreview(analysis);

  it("lists exactly the drawn cards in drawn order", () => {
    expect(preview.cards.map((c) => c.name)).toEqual(names);
    expect(preview.cards.map((c) => c.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it("gives each card the phrase from its own core meaning", () => {
    expect(preview.cards[0].phrase).toBe(shortCardPhrase(byName("Book").meaning.general));
    expect(preview.cards[4].phrase).toBe(shortCardPhrase(byName("Woman").meaning.general));
  });

  it("states the themes as a factual sentence built only from the card keywords", () => {
    expect(preview.themes.startsWith("Your 5 cards carry themes of ")).toBe(true);
    expect(preview.themes).toContain("knowledge");
    expect(preview.themes).toContain("hope");
    expect(preview.themes).toContain("a person");
  });

  it("makes no prediction and no combination claim", () => {
    const text = JSON.stringify(preview).toLowerCase();
    expect(text).not.toMatch(/will |likely|expect|predict|combination|soon|months?|weeks?|guarantee/);
  });
});

describe("buildCardPreview: all spread sizes resolve every card", () => {
  it.each([1, 3, 5, 9, 36])("%i cards each get a non-empty phrase", (count) => {
    const cards = CARD_CATALOG.slice(0, count).map((c, i) => ({ id: c.id, position: i }));
    const preview = buildCardPreview(buildClassicAnalysis("grand-tableau", "Q", cards));
    expect(preview.cards).toHaveLength(count);
    expect(preview.cards.every((c) => c.phrase.length > 0)).toBe(true);
  });

  it("uses the id, so a name collision cannot pick the wrong card", () => {
    const map = getCardCatalogMap();
    const analysis = buildClassicAnalysis("single-card", "Q", [{ id: byName("Ship").id, position: 0 }]);
    expect(buildCardPreview(analysis).cards[0].phrase).toBe(shortCardPhrase(getCardById(CARD_CATALOG, byName("Ship").id)!.meaning.general));
    expect(map.get(byName("Ship").id)?.name).toBe("Ship");
  });
});
