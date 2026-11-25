import { describe, expect, it } from "vitest";
import { buildCardPreview, buildClassicAnalysis, shortCardPhrase } from "@/lib/classic-analysis";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";
import { getCardById } from "@/lib/data";

const byName = (name: string) => CARD_CATALOG.find((c) => c.name === name)!;
const drawn = (names: string[]) => names.map((n, i) => ({ id: byName(n).id, position: i }));

describe("shortCardPhrase: from the catalogue, never invented", () => {
  it("takes the first traditional phrase up to three keywords, stops at a sentence break, and never invents text", () => {
    expect(shortCardPhrase("News, messages, arrival, movement.")).toBe("News, messages, arrival");
    expect(shortCardPhrase("Ending, loss, grief; rest, absence.")).toBe("Ending, loss, grief");
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

  it("lists exactly the drawn cards in drawn order, each with the phrase from its own core meaning", () => {
    expect(preview.cards.map((c) => c.name)).toEqual(names);
    expect(preview.cards.map((c) => c.position)).toEqual([1, 2, 3, 4, 5]);
    expect(preview.cards[0].phrase).toBe(shortCardPhrase(byName("Book").meaning.general));
    expect(preview.cards[4].phrase).toBe(shortCardPhrase(byName("Woman").meaning.general));
  });

  it("states factual keyword themes and makes no prediction or combination claim", () => {
    expect(preview.themes.startsWith("Your 5 cards carry themes of ")).toBe(true);
    expect(preview.themes).toContain("knowledge");
    expect(preview.themes).toContain("hope");
    const text = JSON.stringify(preview).toLowerCase();
    expect(text).not.toMatch(/will |likely|expect|predict|combination|soon|months?|weeks?|guarantee/);
  });

  it("resolves every card for all spread sizes", () => {
    for (const count of [1, 3, 5, 9, 36]) {
      const cards = CARD_CATALOG.slice(0, count).map((c, i) => ({ id: c.id, position: i }));
      const preview = buildCardPreview(buildClassicAnalysis("grand-tableau", "Q", cards));
      expect(preview.cards).toHaveLength(count);
      expect(preview.cards.every((c) => c.phrase.length > 0)).toBe(true);
    }
  });

  it("uses the id, so a name collision cannot pick the wrong card", () => {
    const map = getCardCatalogMap();
    const analysis = buildClassicAnalysis("single-card", "Q", [{ id: byName("Ship").id, position: 0 }]);
    expect(buildCardPreview(analysis).cards[0].phrase).toBe(shortCardPhrase(getCardById(CARD_CATALOG, byName("Ship").id)!.meaning.general));
    expect(map.get(byName("Ship").id)?.name).toBe("Ship");
  });
});
