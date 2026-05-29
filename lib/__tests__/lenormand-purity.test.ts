import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildPrompt } from "@/lib/prompt-builder";
import { getPositionInfo } from "@/components/reading/SpreadPositions";

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

function extractSpreadPrompts(): string[] {
  const spreads = [
    { id: "single-card", cards: [{ id: 1, name: "Rider", keywords: ["news"] }], question: "Test?" },
    { id: "daily-card", cards: [{ id: 1, name: "Rider", keywords: ["news"] }], question: "Test?" },
    { id: "sentence-3", cards: [{ id: 1, name: "Rider", keywords: ["news"] }, { id: 2, name: "Clover", keywords: ["luck"] }, { id: 3, name: "Ship", keywords: ["travel"] }], question: "Test?" },
    { id: "sentence-5", cards: [{ id: 1, name: "Rider", keywords: ["news"] }, { id: 2, name: "Clover", keywords: ["luck"] }, { id: 3, name: "Ship", keywords: ["travel"] }, { id: 4, name: "House", keywords: ["home"] }, { id: 5, name: "Tree", keywords: ["health"] }], question: "Test?" },
    { id: "comprehensive", cards: Array.from({ length: 9 }, (_, i) => ({ id: i + 1, name: `Card ${i + 1}`, keywords: [`kw${i + 1}`] })), question: "Test?" },
    { id: "grand-tableau", cards: Array.from({ length: 36 }, (_, i) => ({ id: i + 1, name: `Card ${i + 1}`, keywords: [`kw${i + 1}`] })), question: "Test?" },
  ];

  return spreads.map((s) => buildPrompt(s.cards, s.id, s.question));
}

const systemPrompts = [buildSystemPrompt(1), buildSystemPrompt(3), buildSystemPrompt(36)];

describe("Lenormand purity", () => {
  const spreadPrompts = extractSpreadPrompts();

  describe("hard-banned Tarot/New Age terms", () => {
    for (const term of HARD_BANNED) {
      it(`does not contain "${term}" in any spread prompt`, () => {
        for (const text of spreadPrompts) {
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
