import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, significatorFocusFacts, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { Card } from "@/lib/types";

function makeCard(id: number, name: string, keywords?: string[]): Card {
  return {
    id,
    name,
    number: id,
    keywords: keywords || [name],
    uprightMeaning: `Meaning of ${name}`,
    meaning: { general: "", positive: [], negative: [] },
    combos: [],
    imageUrl: null,
  };
}

const cards: Card[] = [
  makeCard(28, "Man", ["masculine", "husband", "father", "authority", "logic"]),
  makeCard(29, "Woman", ["feminine", "wife", "mother", "intuition", "emotion"]),
  makeCard(1, "Rider", ["news", "arrival"]),
  makeCard(3, "Ship", ["travel", "journey"]),
  makeCard(2, "Clover", ["luck", "chance"]),
  makeCard(12, "Birds", ["communication", "anxiety"]),
  makeCard(27, "Letter", ["message", "document"]),
  makeCard(26, "Book", ["knowledge", "secret"]),
  makeCard(17, "Stork", ["change", "transformation"]),
];

const cardsMap = new Map<number, Card>(cards.map((c) => [c.id, c]));

function normalized(ids: number[]) {
  return ids.map((id) => {
    const c = cardsMap.get(id)!;
    return { id: c.id, name: c.name, keywords: c.keywords };
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

  /**
   * The structural layer writes "Man" and "Woman" plainly. Annotating the card itself as
   * a specific person pushed the model toward reading a concrete individual even when
   * nothing bound it; only the `Person bindings` block may assert that.
   */
  it("writes Man and Woman plainly, with personhood left to the bindings", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 1, 3]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).not.toContain("specific person/significator");
    expect(prompt).not.toMatch(/Man\s*\(\s*masculine/i);
    expect(prompt).toContain("Man");
    expect(prompt).toContain("- Man: unbound");
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

  it("reports the binding state of the person cards that are present only", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 1, 3]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).toContain("- Man: unbound");
    expect(prompt).not.toContain("- Woman:");
  });

  it("omits the bindings block entirely when neither person card is drawn", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([1, 3, 2]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).not.toContain("Person bindings:");
    expect(prompt).not.toContain("- Man:");
    expect(prompt).not.toContain("- Woman:");
  });
});

describe("prompt-builder: production system prompt forbids relationship inference", () => {
  it("forbids inferring who an unbound person card represents", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/not a spouse, partner, named person or pronoun/i);
  });

  it("names Man or Woman in the prompt only when the cards are drawn", () => {
    const without = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will I move?", normalized([1, 3, 2]), cardsMap),
    );
    expect(without).not.toMatch(/\bMan\b/);
    expect(without).not.toMatch(/\bWoman\b/);

    const withWoman = buildSimpleReadingPrompt(
      buildReadingContext("sentence-3", "Will I move?", normalized([29, 1, 3]), cardsMap),
    );
    expect(withWoman).toContain("- Woman: unbound");
    expect(withWoman).not.toContain("- Man:");
  });

  it("keeps the person-card label out of the structural layer", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 29, 1]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).not.toContain("specific person/significator");
    expect(prompt).toContain("- Man: unbound");
    expect(prompt).toContain("- Woman: unbound");
  });

  it("declares a binding in the prompt when the significator was explicitly chosen", () => {
    const ctx = buildReadingContext("sentence-3", "Q?", normalized([28, 1, 3]), cardsMap, "man");
    expect(buildSimpleReadingPrompt(ctx)).toContain("- Man: bound by explicit-significator");
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
    expect(prompt).toMatch(/Do not complete a story beyond the cards support/);
    expect(prompt).toMatch(/Do not infer from cards that were not drawn/);
    expect(prompt).not.toMatch(/Give the spread the room it needs/);
    expect(prompt).not.toMatch(/narrative plan/i);
    expect(prompt).not.toMatch(/development line/i);
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
  it("does not invent a Woman focus when only Man is present under preference 'both'", () => {
    // The old preference fallback returned "focus: Woman" here.
    expect(significatorFocusFacts("both", ["Man"])).toEqual([
      "- Person card(s) present: Man. No other person card is in this spread.",
    ]);
  });

  it("does not claim another person card is present when it is not", () => {
    expect(significatorFocusFacts("man", ["Man"])).toEqual(["- Significator focus: Man."]);
  });

  it("does not report a selected focus that is absent from the spread", () => {
    expect(significatorFocusFacts("man", ["Woman"])).toEqual([
      "- Person card(s) present: Woman. No other person card is in this spread.",
    ]);
  });

  it("reports both significators only when both are actually present", () => {
    expect(significatorFocusFacts("both", ["Man", "Woman"])[0]).toContain("Both significators are in this spread");
    expect(significatorFocusFacts("man", ["Man", "Woman"])[0]).toContain("still present as an ordinary card");
  });
});