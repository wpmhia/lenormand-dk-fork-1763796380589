import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
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

  it("labels Man and Woman as 'specific person/significator' instead", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 1, 3]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).toContain("Man (specific person/significator)");
    expect(prompt).not.toMatch(/Man\s*\(\s*masculine/i);
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

  it("reports the binding state of both person cards explicitly", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 1, 3]), cardsMap);
    const prompt = buildSimpleReadingPrompt(ctx);
    expect(prompt).toContain("- Man: unbound");
    expect(prompt).toContain("- Woman: unbound");
  });
});

describe("prompt-builder: production system prompt forbids relationship inference", () => {
  it("forbids an unbound person card from becoming a spouse, partner or pronoun", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/represent a specific person only when the supplied bindings establish this/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/never becomes a spouse, partner, named person or pronoun/i);
  });

  it("still treats Man/Woman as person/significator", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 29, 1]), cardsMap);
    expect(buildSimpleReadingPrompt(ctx)).toContain("Man (specific person/significator)");
  });

  it("keeps the binding authority with deterministic person bindings", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/supplied bindings/i);
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 1, 3]), cardsMap);
    expect(buildSimpleReadingPrompt(ctx)).toContain("- Man: unbound");
  });
});

describe("prompt-builder: production prompt does not preselect evidence for the model", () => {
  const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([12, 27, 26]), cardsMap);
  const prompt = buildSimpleReadingPrompt(ctx);

  it("contains no narrative plan, focus, development line or outcome evidence", () => {
    expect(prompt).not.toContain("Narrative plan");
    expect(prompt).not.toMatch(/^- Focus:/m);
    expect(prompt).not.toMatch(/^- Development line/m);
    expect(prompt).not.toMatch(/^- Outcome evidence/m);
    expect(prompt).not.toMatch(/^- Supporting evidence/m);
    expect(prompt).toMatch(/has deliberately not chosen a focus, a main line, supporting evidence or an outcome pair/);
  });

  it("returns the structured JSON contract instead of markdown pseudo-headings", () => {
    expect(prompt).toContain('"answer": string');
    expect(prompt).toContain('"reading": string');
    expect(prompt).toContain('"patterns"');
    expect(prompt).toContain('"timing": string | null');
    expect(prompt).not.toMatch(/## Interpretation/i);
    expect(prompt).not.toMatch(/## Prediction/i);
    expect(prompt).not.toMatch(/\*\*Most likely development:\*\*/);
  });

  it("keeps the two calibration rules that prevent overstated readings", () => {
    expect(prompt).toMatch(/Adjacency is not a causal chain/);
    expect(prompt).toMatch(/Calibrate certainty to the spread/);
    expect(prompt).toMatch(/merely because a particular positive card was not drawn/);
  });

  it("keeps the geometry-fidelity rule, now framed as derive-don't-invent", () => {
    expect(prompt).toMatch(/Geometry fidelity\./);
    expect(prompt).toMatch(/The coordinates above are authoritative/);
    expect(prompt).toMatch(/Never invent a position, a house or a spatial relationship/);
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
    expect(buildSimpleReadingPrompt(ctx)).toMatch(/Leave timing null when the spread does not ground it/);
    expect(buildSimpleReadingPrompt(ctx)).toMatch(/"timing": string \| null/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Do not invent cards/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Do not force certainty when the spread is genuinely mixed/i);
  });
});