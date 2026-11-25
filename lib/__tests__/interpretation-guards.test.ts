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

  it("orders the work: the reading is written first and the answer last, as the JSON fields are", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Work order: first weigh the cards and write the "reading"/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Then state the "answer"/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).not.toMatch(/Answer first/);
  });

  it("makes spread geometry validation mandatory and sequence-reading forbidden for grids", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Mandatory spread geometry validation/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/silently validate every named combination/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/the numbered card order is not a sentence or a chronology/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/neighbours or as part of a supplied line/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/never join the last card of one row to the first card of the next/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/Explicitly supplied relations, such as house relations, remain valid/);
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toMatch(/not from the numerical sequence of the cards/);
  });

  it("keeps the system prompt within a bounded size", () => {
    // The work-order clarification lengthened the system prompt to about 2.7k characters. The
    // mandatory spread-geometry validation block, with its supplied-relation clarification, is a
    // deliberate addition and brings it to about 3.7k; the bound guards against further growth.
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT.length).toBeLessThan(3800);
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
