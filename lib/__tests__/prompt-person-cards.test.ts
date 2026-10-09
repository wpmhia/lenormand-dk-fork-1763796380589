import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, significatorFocusFacts, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

const cardsMap = getCardCatalogMap();

function normalized(ids: number[]) {
  return ids.map((id) => {
    const card = CARD_CATALOG.find((candidate) => candidate.id === id);
    return {
      id,
      name: card?.name ?? cardsMap.get(id)?.name ?? String(id),
      keywords: card?.keywords ?? [],
    };
  });
}

describe("prompt-builder: person cards never leak relationship keywords", () => {
  it("does not include 'husband' for the Man card anywhere in the production prompt", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([28, 1, 3, 12, 27]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).not.toContain("husband");
    expect(prompt).not.toContain("father");
    expect(prompt).not.toContain("masculine");
  });

  it("does not include 'wife' for the Woman card anywhere in the production prompt", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([29, 1, 3, 12, 27]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).not.toContain("wife");
    expect(prompt).not.toContain("mother");
    expect(prompt).not.toContain("feminine");
  });

  /** The structural layer writes "Man" and "Woman" plainly, without assigning a role. */
  it("writes Man and Woman plainly, without assigning them a role", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 1, 3]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).not.toContain("specific person/significator");
    expect(prompt).not.toMatch(/Man\s*\(\s*masculine/i);
    expect(prompt).toContain("Man");
  });

  it("sends no card dictionary at all, only card names and structure", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([1, 3, 2]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).toContain("Rider");
    expect(prompt).toContain("Ship");
    expect(prompt).toContain("Clover");
    // Model-first: the server supplies geometry, never meaning.
    expect(prompt).not.toContain("news, arrival, or movement");
    expect(prompt).not.toMatch(/Question-scoped card senses/i);
    expect(prompt).not.toMatch(/Reviewed combination meanings/i);
    // Raw catalog keywords must not leak either.
    expect(prompt).not.toContain("luck, chance");
    expect(prompt).not.toContain("journey");
  });
});

describe("prompt-builder: significator preference is an optional reading focus", () => {
  it("does not make identity or relationship claims when no preference is selected", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will my partner and I reconcile?", normalized([29, 1, 3]), cardsMap),
    );
    expect(prompt).toContain("Will my partner and I reconcile?");
    expect(prompt).toContain("Woman");
    expect(prompt).not.toContain("unidentified");
    expect(prompt).not.toContain("Person binding");
    expect(prompt).not.toContain("bound by explicit-significator");
    expect(prompt).not.toContain("Reading focus:");
  });

  it("adds only a reading-focus hint when the selected person card is drawn", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will I move?", normalized([29, 1, 3]), cardsMap, "woman"),
    );
    expect(prompt).toContain("- Reading focus: Woman.");
    expect(prompt).not.toContain("Person binding");
    expect(prompt).not.toContain("unidentified");
  });

  it("omits the focus if the selected person card was not drawn", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will I move?", normalized([29, 1, 3]), cardsMap, "man"),
    );
    expect(prompt).toContain("Woman");
    expect(prompt).not.toContain("Reading focus:");
    expect(prompt).not.toContain("Man");
  });

  it("passes a focus hint through to a Grand Tableau when the chosen card is drawn", () => {
    const knownIds = CARD_CATALOG.map((card) => card.id).slice(0, 36);
    const ctx = buildReadingContext("grand-tableau", "Full picture?", normalized(knownIds), cardsMap, "woman");
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).toContain("- Reading focus: Woman.");
    expect(prompt).not.toContain("Person binding");
  });

  it("keeps the default 'both' as no specific reading focus", () => {
    const prompt = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will I move?", normalized([28, 29, 3]), cardsMap),
    );
    expect(prompt).toContain("Man");
    expect(prompt).toContain("Woman");
    expect(prompt).not.toContain("Reading focus:");
  });
});

describe("prompt-builder: production prompt does not preselect evidence for the model", () => {
  const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([12, 27, 26]), cardsMap);
  const prompt = buildSimpleReadingPrompt(ctx);

  it("returns the structured JSON contract instead of markdown pseudo-headings", () => {
    expect(prompt).toContain('"answer": string');
    expect(prompt).toContain('"reading": string');
    expect(prompt).toContain('"patterns"');
    expect(prompt).toContain('"timing": string | null');
    expect(prompt).not.toMatch(/## Interpretation/i);
    expect(prompt).not.toMatch(/## Prediction/i);
    expect(prompt).not.toMatch(/\*\*Most likely development:\*\*/);
  });

  it("uses the minimal-interpretation contract without narrative prompt rules", () => {
    expect(prompt).not.toMatch(/Give the spread the room it needs/);
    expect(prompt).not.toMatch(/narrative plan/i);
    expect(prompt).not.toMatch(/development line/i);
    expect(prompt).not.toMatch(/Recovery, reconciliation|recovery, reconciliation/);
  });
});

describe("prompt-builder: timing stays ungrounded rather than invented", () => {
  it("does not embed card-level timing metadata (e.g. 'timing: Near future') anywhere", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([1, 2, 3, 12, 27]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).not.toMatch(/;\s*timing:\s*Near future/i);
    expect(prompt).not.toMatch(/\(\s*timing:/i);
    expect(prompt).not.toMatch(/timing:\s*Near future \(1-3 weeks\)/i);
  });

  it("does not embed card-level timing strings from cards.json like 'Within 1-3 weeks'", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([1, 2, 3, 12, 27]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).not.toContain("Within 1-3 weeks");
    expect(prompt).not.toContain("Within 1-2 weeks");
  });

  it("instructs the model to leave timing null when the spread does not ground it", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([1, 2, 3, 12, 27]), cardsMap);
    expect(buildSimpleReadingPrompt(ctx)).toMatch(/"timing": string \| null/);
    expect(buildSimpleReadingPrompt(ctx)).toMatch(/"timing": string \| null/);
  });
});

describe("prompt-builder: significator focus follows actual card presence", () => {
  it("returns no focus for the default preference", () => {
    expect(significatorFocusFacts("both", ["Man", "Woman"])).toEqual([]);
  });

  it("labels the selected, present card as a reading focus only", () => {
    expect(significatorFocusFacts("man", ["Man", "Woman"])).toEqual(["- Reading focus: Man."]);
  });

  it("does not report a selected focus absent from the spread", () => {
    expect(significatorFocusFacts("man", ["Woman"])).toEqual([]);
  });
});
