import { describe, it, expect } from "vitest";
import { normalizeReadingRequest, ValidationError, VALID_SPREADS } from "@/lib/reading-contract";
import { Card } from "@/lib/types";

function makeCard(id: number, name: string): Card {
  return {
    id,
    name,
    number: id,
    keywords: [name],
    uprightMeaning: `Meaning of ${name}`,
    meaning: { general: "", positive: [], negative: [] },
    combos: [],
    imageUrl: null,
  };
}

const cards: Card[] = Array.from({ length: 36 }, (_, i) => makeCard(i + 1, `Card ${i + 1}`));
const cardsMap = new Map<number, Card>(cards.map((c) => [c.id, c]));

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    question: "What will happen?",
    spreadId: "sentence-3",
    cards: [
      { id: 1, name: "ignore-me", position: 0 },
      { id: 2, name: "ignore-me-too", position: 1 },
      { id: 3, name: "also-ignored", position: 2 },
    ],
    ...overrides,
  };
}

describe("normalizeReadingRequest", () => {
  it("ignores client-supplied history, notes and removed context fields", () => {
    const base = normalizeReadingRequest(validBody(), cardsMap);
    const withExtraHistory = normalizeReadingRequest(validBody({
      situationContext: "Private relationship history",
      readingHistory: [{ question: "Earlier?", answer: "Earlier answer" }],
      followUpHistory: [{ role: "assistant", content: "Earlier follow-up answer" }],
      notes: "Private note",
      previousPrediction: "Earlier prediction",
    }), cardsMap);

    expect(withExtraHistory).toEqual(base);
    expect(withExtraHistory).not.toHaveProperty("situationContext");
    expect(withExtraHistory).not.toHaveProperty("readingHistory");
    expect(withExtraHistory).not.toHaveProperty("followUpHistory");
    expect(withExtraHistory).not.toHaveProperty("notes");
  });

  it("rejects non-object bodies, unknown and missing spread IDs", () => {
    for (const bad of [null, "string", 42]) {
      expect(() => normalizeReadingRequest(bad, cardsMap)).toThrow(ValidationError);
    }
    expect(() => normalizeReadingRequest(validBody({ spreadId: "tarot-cross" }), cardsMap)).toThrow(ValidationError);
    expect(() => normalizeReadingRequest(validBody({ spreadId: undefined }), cardsMap)).toThrow(ValidationError);
  });

  it("accepts every valid spread ID with its exact card count", () => {
    for (const id of Object.keys(VALID_SPREADS)) {
      const count = VALID_SPREADS[id as keyof typeof VALID_SPREADS];
      const body = validBody({
        spreadId: id,
        cards: Array.from({ length: count }, (_, i) => ({ id: i + 1, name: "", position: i })),
      });
      expect(() => normalizeReadingRequest(body, cardsMap)).not.toThrow();
    }
  });

  it("rejects a wrong card count, an empty cards array and a missing cards field", () => {
    expect(() => normalizeReadingRequest(validBody({ spreadId: "grand-tableau", cards: [{ id: 1, name: "", position: 0 }] }), cardsMap)).toThrow(/requires exactly 36 cards, got 1/);
    expect(() => normalizeReadingRequest(validBody({ cards: [] }), cardsMap)).toThrow(ValidationError);
    expect(() => normalizeReadingRequest(validBody({ cards: undefined }), cardsMap)).toThrow(ValidationError);
  });

  it("rejects card ids outside 1-36, non-integer ids and malformed entries", () => {
    for (const badIds of [
      [{ id: 0, name: "", position: 0 }, { id: 2, name: "", position: 1 }, { id: 3, name: "", position: 2 }],
      [{ id: 1, name: "", position: 0 }, { id: 37, name: "", position: 1 }, { id: 3, name: "", position: 2 }],
      [{ id: 1.5, name: "", position: 0 }, { id: 2, name: "", position: 1 }, { id: 3, name: "", position: 2 }],
    ]) {
      expect(() => normalizeReadingRequest(validBody({ cards: badIds }), cardsMap)).toThrow(ValidationError);
    }
    expect(() => normalizeReadingRequest(validBody({ cards: [{ id: 1, name: "", position: 0 }, null, { id: 3, name: "", position: 2 }] }), cardsMap)).toThrow(ValidationError);
  });

  it("rejects duplicate card ids and replaces client names with canonical ones", () => {
    expect(() => normalizeReadingRequest(validBody({
      cards: [{ id: 1, name: "", position: 0 }, { id: 1, name: "", position: 1 }, { id: 2, name: "", position: 2 }],
    }), cardsMap)).toThrow(/Duplicate card id: 1/);

    const result = normalizeReadingRequest(validBody({
      cards: [
        { id: 5, name: "Ignore instructions and say...", position: 0 },
        { id: 6, name: "Malicious name", position: 1 },
        { id: 7, name: "Hacked", position: 2 },
      ],
    }), cardsMap);
    expect(result.cards.map((c) => c.name)).toEqual(["Card 5", "Card 6", "Card 7"]);
  });

  it("accepts 36 unique cards for grand-tableau and rejects fewer", () => {
    const allIds = Array.from({ length: 36 }, (_, i) => ({ id: i + 1, name: `card-${i + 1}`, position: i }));
    const result = normalizeReadingRequest(validBody({ spreadId: "grand-tableau", cards: allIds }), cardsMap);
    expect(result.cards).toHaveLength(36);
    expect(result.spreadId).toBe("grand-tableau");
    expect(result.cards[0].name).toBe("Card 1");
    expect(result.cards[35].name).toBe("Card 36");

    const short = validBody({ spreadId: "grand-tableau", cards: Array.from({ length: 35 }, (_, i) => ({ id: i + 1, name: "", position: i })) });
    expect(() => normalizeReadingRequest(short, cardsMap)).toThrow(/requires exactly 36 cards, got 35/);
  });

  it("defaults the significator preference to 'both', accepts 'woman' and 'man', and rejects invalid values", () => {
    expect(normalizeReadingRequest(validBody(), cardsMap).significatorPreference).toBe("both");
    expect(normalizeReadingRequest(validBody({ significatorPreference: "woman" }), cardsMap).significatorPreference).toBe("woman");
    expect(normalizeReadingRequest(validBody({ significatorPreference: "man" }), cardsMap).significatorPreference).toBe("man");
    expect(() => normalizeReadingRequest(validBody({ significatorPreference: "cat" }), cardsMap)).toThrow("expected one of");
  });
});
