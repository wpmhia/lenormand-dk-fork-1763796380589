import { describe, it, expect } from "vitest";
import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { getPositionInfo } from "@/components/reading/SpreadPositions";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

/**
 * Lenormand purity: no Tarot/New Age vocabulary anywhere the model or the reader sees it.
 * One sweep per surface, not one test per word.
 */

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

const cardsMap = getCardCatalogMap();
const allCards = [...CARD_CATALOG].sort((a, b) => a.id - b.id);
const normalized = (count: number) =>
  allCards.slice(0, count).map((card) => ({
    id: card.id,
    name: card.name,
    keywords: card.keywords,
    coreMeaning: card.meaning.general,
    secondaryMeanings: card.meaning.secondaryMeanings,
    meaningReviewStatus: card.meaning.reviewStatus,
  }));

function getCardCount(spreadId: string): number {
  if (spreadId === "grand-tableau") return 36;
  if (spreadId === "comprehensive") return 9;
  if (spreadId === "sentence-5") return 5;
  if (spreadId === "sentence-3") return 3;
  return 1;
}

/** Every production prompt the model can actually receive, one per spread. */
function extractSpreadPrompts(): string[] {
  return [
    "single-card",
    "daily-card",
    "sentence-3",
    "sentence-5",
    "comprehensive",
    "grand-tableau",
  ].map((spreadId) =>
    buildSimpleReadingPrompt(buildReadingContext(spreadId as never, "Test?", normalized(getCardCount(spreadId)), cardsMap)),
  );
}

describe("Lenormand purity", () => {
  it("contains no hard-banned New Age term in any spread prompt or the system prompt", () => {
    const texts = [...extractSpreadPrompts(), SIMPLE_LENORMAND_SYSTEM_PROMPT];
    for (const text of texts) {
      for (const term of HARD_BANNED) {
        expect(text.toLowerCase(), `"${term}" found`).not.toContain(term.toLowerCase());
      }
    }
  });

  it("contains no banned or review-term vocabulary in card data or spread position labels", () => {
    const banned = [
      "unique energy and insights",
      "combined with",
      "Kilimanjaro",
      "internet router",
      "masculine energy",
      "feminine energy",
    ];
    for (const card of CARD_CATALOG) {
      expect(card.meaning?.general, card.name).toBeTruthy();
      for (const b of banned) {
        expect(card.meaning.general.toLowerCase(), card.name).not.toContain(b.toLowerCase());
        for (const combo of card.combos ?? []) {
          expect((combo.meaning || "").toLowerCase()).not.toContain(b.toLowerCase());
        }
      }
    }
    for (const pos of [0, 1, 2, 3, 4, 5, 6, 7, 8]) {
      const info = getPositionInfo(pos, "comprehensive");
      expect(info.label.toLowerCase()).not.toMatch(/past|present|future|energy/);
      expect(info.meaning.toLowerCase()).not.toMatch(/past|present|future|energy/);
    }
  });

  it("uses past/present/future in spread prompts only where a significator or direction context allows it", () => {
    for (const text of extractSpreadPrompts()) {
      for (const term of ["past", "present", "future"]) {
        const match = text.toLowerCase().match(new RegExp(`\\b${term}\\b`, "i"));
        if (!match || match.index === undefined) continue;
        const context = text.slice(Math.max(0, match.index - 60), match.index + 60).toLowerCase();
        const isAllowedContext =
          context.includes("significator") || context.includes("left of") || context.includes("right of")
          || context.includes("do not assign") || context.includes("do not use");
        expect(isAllowedContext, `unexpected "${term}" near: ${context}`).toBe(true);
      }
    }
  });
});
