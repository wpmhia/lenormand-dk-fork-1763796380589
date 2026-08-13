import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildPromptFromContext, buildSystemPrompt, buildPrompt } from "@/lib/prompt-builder";
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

describe("prompt-builder: fmtCard strips relationship keywords for Man/Woman", () => {
  it("does not include 'husband' for the Man card in any prompt section", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([28, 1, 3, 12, 27]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toContain("husband");
    expect(prompt).not.toContain("father");
  });

  it("does not include 'wife' for the Woman card in any prompt section", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([29, 1, 3, 12, 27]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toContain("wife");
    expect(prompt).not.toContain("mother");
  });

  it("labels Man and Woman as 'specific person/significator' instead", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([28, 1, 3]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toContain("Man (specific person/significator)");
    expect(prompt).not.toMatch(/Man\s*\(\s*masculine/i);
  });

  it("preserves relationship-neutral keywords for non-person cards", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([1, 3, 2]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toContain("Rider");
    expect(prompt).toContain("news");
  });

  it("legacy buildPrompt also strips relationship keywords for person cards", () => {
    const cardList = [
      { id: 28, name: "Man", keywords: ["masculine", "husband", "father"] },
      { id: 1, name: "Rider", keywords: ["news"] },
    ];
    const prompt = buildPrompt(cardList, "sentence-3", "Will I move?");
    expect(prompt).not.toContain("husband");
    expect(prompt).not.toContain("father");
    expect(prompt).toContain("Man (specific person/significator)");
  });
});

describe("prompt-builder: system prompt forbids relationship inference", () => {
  it("contains an explicit rule against inferring husband/wife/boyfriend/girlfriend/father/mother", () => {
    const sp = buildSystemPrompt(3);
    expect(sp).toMatch(/never infer husband/i);
    expect(sp).toMatch(/wife/i);
    expect(sp).toMatch(/boyfriend/i);
    expect(sp).toMatch(/girlfriend/i);
    expect(sp).toMatch(/father/i);
    expect(sp).toMatch(/mother/i);
  });

  it("still treats Man/Woman as person/significator", () => {
    const sp = buildSystemPrompt(3);
    expect(sp).toMatch(/person\/significator/i);
  });
});

describe("prompt-builder: Reading and Prediction have non-overlapping jobs", () => {
  it("uses a simple June-style contract with three sections, no pseudo-headings inside instructions", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([12, 27, 26]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/## Reading\s+Write 3-5 natural sentences/i);
    expect(prompt).toMatch(/## Key combinations/i);
    expect(prompt).toMatch(/## Prediction\s+Give a concise concrete forecast/i);
  });

  it("does not include the four mandatory Prediction sublabels (Most likely development/Likely timing/Observable sign/Practical action)", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([12, 27, 26]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toContain("**Most likely development:**");
    expect(prompt).not.toContain("**Observable sign:**");
    expect(prompt).not.toContain("**Practical action:**");
  });

  it("does not include pseudo-heading meta-explanations about section roles", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([12, 27, 26]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toMatch(/## Reading — interpret what the cards mean together/i);
    expect(prompt).not.toMatch(/## Prediction — the concrete forecast/i);
  });
});

describe("prompt-builder: timing only via Timing evidence section", () => {
  it("does not embed card-level timing metadata (e.g. 'timing: Near future') in any prompt section", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([1, 2, 3, 12, 27]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toMatch(/;\s*timing:\s*Near future/i);
    expect(prompt).not.toMatch(/\(\s*timing:/i);
    expect(prompt).not.toMatch(/timing:\s*Near future \(1-3 weeks\)/i);
  });

  it("does not embed card-level timing strings from cards.json like 'Within 1-3 weeks'", () => {
    const ctx = buildReadingContext("sentence-5", "Will I move?", normalized([1, 2, 3, 12, 27]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).not.toContain("Within 1-3 weeks");
    expect(prompt).not.toContain("Within 1-2 weeks");
  });

  it("system prompt tells the model to use the 'Timing evidence' section as the only timing source", () => {
    const sp = buildSystemPrompt(3);
    expect(sp).toMatch(/Timing evidence/i);
    expect(sp).toMatch(/Use only that/i);
  });
});
