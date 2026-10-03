import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { Card } from "@/lib/types";
import {
  TIMING_CARDS,
  TIMING_CARD_IDS,
  buildTimingEvidencePrompt,
  buildPredictionTimingLine,
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

describe("timing: question observation window scopes card timing", () => {
  it("does not emit Tree's absolute months-to-years timing inside a coming-week question", () => {
    const line = buildPredictionTimingLine(
      [{ cardId: 5, cardName: "Tree", range: "long-term" }],
      "How will the coming week develop?",
    );
    expect(line).toContain("requested short window");
    expect(line).not.toContain("months to years");
  });

  it("keeps Birds as a short active development inside a longer observation window", () => {
    const line = buildPredictionTimingLine(
      [{ cardId: 12, cardName: "Birds", range: "days" }],
      "What develops during the coming month?",
    );
    expect(line).toContain("brief or active moment");
  });

  it("does not invent future timing for a retrospective event question", () => {
    const line = buildPredictionTimingLine(
      [{ cardId: 12, cardName: "Birds", range: "days" }],
      "Did this happen?",
      { mode: "retrospective_event", timeframe: null },
    );
    expect(line).toContain("past event");
  });
});

/**
 * Timing is the model's job now. The server supplies no timing evidence block, no
 * per-card timing ranges and no canonical timing line: the prompt only states that
 * `timing` must stay null when the spread does not ground it. These tests guard the
 * absence of leaked per-card timing metadata, which is the property that still matters.
 */
describe("timing: prompt does not embed per-card timing strings from cards.json", () => {
  it("does not include 'Near future (1-3 weeks)' for Rider even when Rider is drawn", () => {
    const prompt = buildSimpleReadingPrompt(idsToContext([1, 3, 4]));
    expect(prompt).not.toContain("Near future (1-3 weeks)");
    expect(prompt).not.toMatch(/timing:\s*Near future/i);
  });

  it("does not include '; timing:' anywhere in the prompt", () => {
    expect(buildSimpleReadingPrompt(idsToContext([1, 3, 4]))).not.toMatch(/;\s*timing:/i);
  });

  it("does not embed card-level timing strings from cards.json like 'Within 1-3 weeks'", () => {
    const prompt = buildSimpleReadingPrompt(idsToContext([32, 27, 26]));
    expect(prompt).not.toContain("Within 1-3 weeks");
    expect(prompt).not.toContain("Within 1-2 weeks");
    expect(prompt).not.toContain("current lunar cycle");
  });

  it("does not surface Clover as a timing signal even when drawn alongside other cards", () => {
    const prompt = buildSimpleReadingPrompt(idsToContext([1, 2, 11]));
    expect(prompt).not.toMatch(/Clover.*soft timing/i);
    expect(prompt).not.toMatch(/Clover.*lucky chance/i);
  });

  it("leaves timing to the model as a nullable field instead of prescribing it", () => {
    const prompt = buildSimpleReadingPrompt(idsToContext([32, 27, 26]));
    expect(prompt).toMatch(/"timing": string \| null/);
    expect(prompt).toMatch(/Leave timing null when the spread does not ground it/);
  });
});

describe("timing: system prompt is consistent with the shared definition", () => {
  it("keeps timing a model decision rather than a server assertion", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Do not invent cards/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).not.toMatch(/Timing evidence/i);
  });
});
