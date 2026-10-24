import { describe, expect, it } from "vitest";
import { buildSimpleReadingPrompt, SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { buildReadingContext } from "@/lib/reading-context";
import { CARD_CATALOG, getCardCatalogMap } from "@/lib/card-catalog";

const cardsMap = getCardCatalogMap();
const deck = [...CARD_CATALOG].sort((a, b) => a.id - b.id);

describe("system prompt: person roles", () => {
  it("assigns Man and Woman only when the question or spread makes the role clear", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/assign Man and Woman only when the question or the spread makes the role clear/);
  });

  it("forbids assigning a person to a card or a pronoun the question does not establish", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Never assign a person to a card, or a pronoun to a person/);
  });
});

describe("system prompt: no overinterpretation", () => {
  it("ties card senses to position, neighbours and subject, not to the question's worry", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Meanings come from the combinations, not from the question's worry/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Snake, Fox or Book as infidelity or deceit unless the cards around them support that/);
  });

  it("keeps counter-cards such as Anchor and Mountain in the reading", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Anchor or Mountain against temptation/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/is part of the reading and is not discarded/);
  });

  it("states that weak or mixed evidence must be said so, not turned into a dramatic conclusion", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/when the evidence is weak or mixed, say so/);
  });

  it("forbids named periods and frames any time indication as a symbolic estimate", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/do not name specific periods such as months or weeks/i);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/symbolic estimate, never as a fact/);
  });

  it("asks for a direct answer before the detailed reading", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Answer first/);
  });

  it("keeps the prompt compact", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT.length).toBeLessThan(2600);
  });
});

describe("reading prompt: person roles are not invented", () => {
  it("does not add a named person role to the user prompt when no significator is chosen", () => {
    const cards = Array.from({ length: 3 }, (_, i) => {
      const c = deck[i];
      return { id: c.id, name: c.name, keywords: c.keywords, coreMeaning: c.meaning.general, position: i };
    });
    const prompt = buildSimpleReadingPrompt(buildReadingContext("sentence-3", "Will Mahican and Willem reconcile?", cards, cardsMap));
    expect(prompt).not.toMatch(/Reading focus: (Man|Woman)/);
  });

  it("never emits a fixed period such as '6 to 9 months' in the built prompt", () => {
    const cards = Array.from({ length: 5 }, (_, i) => {
      const c = deck[i];
      return { id: c.id, name: c.name, keywords: c.keywords, coreMeaning: c.meaning.general, position: i };
    });
    const prompt = buildSimpleReadingPrompt(buildReadingContext("sentence-5", "When will it happen?", cards, cardsMap));
    expect(prompt).not.toMatch(/\b\d+\s*(?:-|–|to)\s*\d+\s*(?:months?|weeks?)\b/i);
  });
});
