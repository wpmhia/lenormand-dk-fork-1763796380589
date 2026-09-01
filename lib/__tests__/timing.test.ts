import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildPromptFromContext, buildSystemPrompt } from "@/lib/prompt-builder";
import { Card } from "@/lib/types";
import {
  TIMING_CARDS,
  TIMING_CARD_IDS,
  buildTimingEvidencePrompt,
  isTimingCardId,
  getTimingCard,
  NO_TIMING_INSTRUCTION,
} from "@/lib/timing";

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
    strength: "NEUTRAL",
  };
}

const cards: Card[] = Array.from({ length: 36 }, (_, i) => makeCard(i + 1, `Card ${i + 1}`));
const cardsMap = new Map<number, Card>(cards.map((c) => [c.id, c]));

function idsToContext(ids: number[]) {
  const normalized = ids.map((id) => {
    const c = cardsMap.get(id)!;
    return { id: c.id, name: c.name, keywords: c.keywords, strength: c.strength };
  });
  return buildReadingContext("sentence-3", "Will I hear back soon?", normalized, cardsMap);
}

describe("timing: shared definition is the single source of truth", () => {
  it("treats Birds, Stork, Tree, Moon as the only timing cards", () => {
    expect(isTimingCardId(12)).toBe(true);
    expect(isTimingCardId(17)).toBe(true);
    expect(isTimingCardId(32)).toBe(true);
    expect(isTimingCardId(5)).toBe(true);
  });

  it("does not treat Clover or Lily as timing cards (they were never primary)", () => {
    expect(isTimingCardId(2)).toBe(false);
    expect(isTimingCardId(30)).toBe(false);
  });

  it("does not treat Rider or Ship as timing cards", () => {
    expect(isTimingCardId(1)).toBe(false);
    expect(isTimingCardId(3)).toBe(false);
  });

  it("exposes per-card prompt guidance for each timing card", () => {
    for (const def of Object.values(TIMING_CARDS)) {
      expect(def.promptGuidance.length).toBeGreaterThan(20);
      expect(def.range.length).toBeGreaterThan(0);
    }
  });

  it("TIMING_CARD_IDS set is consistent with TIMING_CARDS registry", () => {
    expect(TIMING_CARD_IDS.size).toBe(Object.keys(TIMING_CARDS).length);
    for (const id of TIMING_CARD_IDS) {
      expect(TIMING_CARDS[id]).toBeDefined();
    }
  });
});

describe("timing: buildTimingEvidencePrompt output", () => {
  it("emits NO_TIMING_INSTRUCTION when no timing cards are present", () => {
    const out = buildTimingEvidencePrompt([]);
    expect(out).toContain(NO_TIMING_INSTRUCTION);
    expect(out).not.toContain("Near future (1-3 weeks)");
  });

  it("emits Birds guidance when Birds is drawn", () => {
    const out = buildTimingEvidencePrompt([{ cardId: 12, cardName: "Birds", range: getTimingCard(12)!.range }]);
    expect(out).toContain("Birds");
    expect(out.toLowerCase()).toContain("days");
    expect(out).not.toContain("Near future (1-3 weeks)");
  });

  it("emits Stork guidance when Stork is drawn", () => {
    const out = buildTimingEvidencePrompt([{ cardId: 17, cardName: "Stork", range: getTimingCard(17)!.range }]);
    expect(out).toContain("Stork");
    expect(out.toLowerCase()).toContain("week");
  });

  it("ignores non-timing cards (Clover is no longer a soft signal)", () => {
    const out = buildTimingEvidencePrompt([{ cardId: 2, cardName: "Clover", range: "soon" }]);
    expect(out).toContain(NO_TIMING_INSTRUCTION);
    expect(out).not.toContain("Clover");
  });
});

describe("timing: prompt does not embed per-card timing strings from cards.json", () => {
  it("does not include 'Near future (1-3 weeks)' for Rider even when Rider is drawn", () => {
    const ctx = idsToContext([1, 3, 4]);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toContain("Near future (1-3 weeks)");
    expect(prompt).not.toMatch(/timing:\s*Near future/i);
  });

  it("does not include '; timing:' anywhere in the prompt", () => {
    const ctx = idsToContext([1, 3, 4]);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toMatch(/;\s*timing:/i);
  });

  it("uses timingEvidence as the only timing source in the prompt", () => {
    const ctx = idsToContext([12, 27, 26]);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toContain("Timing evidence");
    expect(prompt).toContain("Birds");
    expect(prompt).toContain("days");
  });

  it("emits the no-timing instruction when no timing card is drawn", () => {
    const ctx = idsToContext([1, 3, 4]);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toContain("No timing evidence detected");
    expect(prompt).toContain("Not clearly shown by these cards");
  });

  it("provides one canonical timing line for Moon", () => {
    const ctx = idsToContext([32, 27, 26]);
    expect(ctx.timingEvidence.map((e) => e.cardId)).toContain(32);
    expect(buildPromptFromContext(ctx)).toContain("current lunar cycle");
  });

  it("does not surface Clover as a timing signal even when drawn alongside other cards", () => {
    const ctx = idsToContext([1, 2, 11]);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toMatch(/Clover.*soft timing/i);
    expect(prompt).not.toMatch(/Clover.*lucky chance/i);
    expect(prompt).toContain("No timing evidence detected");
  });
});

describe("timing: system prompt is consistent with the shared definition", () => {
  it("system prompt mentions timing and points to Timing evidence section", () => {
    const sp = buildSystemPrompt(3);
    expect(sp).toMatch(/not a Tarot reader/i);
    expect(sp).toMatch(/timing/i);
    expect(sp).toMatch(/Timing evidence/i);
  });
});
