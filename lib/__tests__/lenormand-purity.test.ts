import { describe, it, expect } from "vitest";
import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { getPositionInfo } from "@/components/reading/SpreadPositions";
import cardsData from "@/public/data/cards.json";
import type { Card } from "@/lib/types";

const HARD_BANNED = [
  "shadow work",
  "higher self",
  "soul lesson",
  "chakra",
  "archetype",
  "the universe",
  "spiritual journey",
  "divine guidance",
  "soul-purpose",
  "soul purpose",
];

const REVIEW_TERMS = [
  "past",
  "present",
  "future",
  "energy",
  "advice",
  "obstacle",
  "lesson",
  "intuition",
];

const catalog = cardsData as Card[];
const cardsMap = new Map<number, Card>(catalog.map((card) => [card.id, card]));
const allCards = [...catalog].sort((a, b) => a.id - b.id);
const normalized = (count: number) =>
  allCards.slice(0, count).map((card) => ({ id: card.id, name: card.name, keywords: card.keywords }));

/** Every production prompt the model can actually receive, one per spread. */
function extractSpreadPrompts(): string[] {
  return [
    "single-card",
    "daily-card",
    "sentence-3",
    "sentence-5",
    "comprehensive",
    "grand-tableau",
  ].map((spreadId) => buildSimpleReadingPrompt(buildReadingContext(spreadId as never, "Test?", normalized(getCardCount(spreadId)), cardsMap)));
}

function getCardCount(spreadId: string): number {
  if (spreadId === "grand-tableau") return 36;
  if (spreadId === "comprehensive") return 9;
  if (spreadId === "sentence-5") return 5;
  return 3;
}

const systemPrompts = [SIMPLE_LENORMAND_SYSTEM_PROMPT];

describe("Lenormand purity", () => {
  const spreadPrompts = extractSpreadPrompts();

  describe("hard-banned Tarot/New Age terms", () => {
    for (const term of HARD_BANNED) {
      it(`does not contain "${term}" in any spread prompt`, () => {
        for (const text of spreadPrompts) {
          expect(text.toLowerCase()).not.toContain(term.toLowerCase());
        }
      });

      it(`does not contain "${term}" in the production system prompt`, () => {
        for (const text of systemPrompts) {
          expect(text.toLowerCase()).not.toContain(term.toLowerCase());
        }
      });
    }
  });

  describe("spread positions", () => {
    const comprehensivePositions = [0, 1, 2, 3, 4, 5, 6, 7, 8];

    for (const term of HARD_BANNED) {
      it(`does not contain "${term}" in spread position labels or meanings`, () => {
        for (const pos of comprehensivePositions) {
          const info = getPositionInfo(pos, "comprehensive");
          expect(info.label.toLowerCase()).not.toContain(term.toLowerCase());
          expect(info.meaning.toLowerCase()).not.toContain(term.toLowerCase());
        }
      });
    }

    it("does not use Past/Present/Future as labels for comprehensive positions", () => {
      for (const pos of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
        const info = getPositionInfo(pos, "comprehensive");
        expect(info.label.toLowerCase()).not.toMatch(/past|present|future/);
      }
    });

    it("does not use 'energy' in comprehensive center position meaning", () => {
      const info = getPositionInfo(4, "comprehensive");
      expect(info.meaning.toLowerCase()).not.toContain("energy");
    });
  });

  describe("card data integrity", () => {
  it("no card meaning or combo contains banned New Age terms", () => {
    const data = cardsData as any[];
    const banned = [
      "unique energy and insights",
      "combined with",
      "Kilimanjaro",
      "internet router",
      "masculine energy",
      "feminine energy",
    ];
    for (const card of data) {
      if (card?.meaning?.general) {
        for (const b of banned) {
          expect(card.meaning.general.toLowerCase()).not.toContain(b.toLowerCase());
        }
      }
      if (card?.combos) {
        for (const c of card.combos) {
          const m = c.meaning || "";
          for (const b of banned) {
            expect(m.toLowerCase()).not.toContain(b.toLowerCase());
          }
        }
      }
    }
  });

  it("every card has a meaning.general", () => {
    const data = cardsData as any[];
    for (const card of data) {
      expect(card.meaning?.general).toBeTruthy();
    }
  });
});

describe("review terms in spread prompts", () => {
    it("past/present/future appear only in Grand Tableau context or as anti-instructions", () => {
      for (const term of ["past", "present", "future"]) {
        for (const text of spreadPrompts) {
          if (text.toLowerCase().includes(term)) {
            const idx = text.toLowerCase().indexOf(term);
            const context = text.slice(Math.max(0, idx - 60), idx + 60).toLowerCase();
            const isAllowedContext = context.includes("significator") || context.includes("left of") || context.includes("right of") || context.includes("do not assign") || context.includes("do not use");
            expect(isAllowedContext).toBe(true);
          }
        }
      }
    });

    it("'energy' appears nowhere in spread prompts", () => {
      for (const text of spreadPrompts) {
        expect(text.toLowerCase()).not.toContain("energy");
      }
    });
  });
});
