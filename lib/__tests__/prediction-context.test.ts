import { describe, it, expect } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { buildPredictionContext, formatPredictionEvidenceBlock } from "@/lib/prediction-context";
import { CARD_CATALOG } from "@/lib/card-catalog";

/**
 * `prediction-context.ts` is no longer part of any LLM path: the model-first pipeline
 * ships `buildSpreadFacts()` instead, because this module does exactly what the
 * architecture forbids in production — it ranks pairs by weight and selects a focus, a
 * core driver, a primary pair, supporting pairs, a capped house list and a capped topic
 * list before the model ever sees the spread.
 *
 * The module is kept as the rule-based fallback reader, so it keeps its unit coverage
 * here. What is deliberately NOT tested is any connection to a prompt: if a future
 * change wires this back into an LLM route, the source-level assertions in
 * `model-first-architecture.test.ts` ("keeps prediction-context out of every LLM route")
 * will fail.
 */

const cardsMap = new Map(CARD_CATALOG.map((c) => [c.id, c]));

function normalized(ids: number[]) {
  return ids.map((id) => {
    const card = cardsMap.get(id)!;
    return { id: card.id, name: card.name, keywords: card.keywords };
  });
}

function block(spreadId: "sentence-5" | "comprehensive" | "grand-tableau", ids: number[], question = "Will I move?") {
  const ctx = buildReadingContext(spreadId, question, normalized(ids), cardsMap);
  return { ctx, pe: buildPredictionContext(ctx), block: formatPredictionEvidenceBlock(buildPredictionContext(ctx)) };
}

describe("prediction-context: per-spread hierarchy stays local to its layout", () => {
  it("gives the linear spread its closing-card/closing-pair directive", () => {
    const { block: text } = block("sentence-5", [1, 2, 3, 4, 5]);
    expect(text).toMatch(/Linear spread hierarchy/);
    expect(text).toMatch(/closing card and the closing pair dominate/);
  });

  it("gives the Petit Tableau a centre-based hierarchy and no linear language", () => {
    const { block: text } = block("comprehensive", [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(text).toMatch(/Petit Tableau hierarchy/);
    expect(text).toMatch(/center card is the heart/);
    expect(text).not.toMatch(/closing card and the closing pair dominate/);
    expect(text).not.toMatch(/Strongest transition \(closing pair\)/);
  });

  it("gives the Grand Tableau a significator-based hierarchy and no linear language", () => {
    const { block: text } = block("grand-tableau", Array.from({ length: 36 }, (_, i) => i + 1), "Full picture?");
    expect(text).toMatch(/significator surroundings/);
    expect(text).not.toMatch(/closing card and the closing pair dominate/);
    expect(text).not.toMatch(/Strongest transition \(closing pair\)/);
  });
});

describe("prediction-context: evidence labels per layout", () => {
  it("labels a linear spread's outcome as the closing card and its core as the middle card", () => {
    const { block: text } = block("sentence-5", [3, 31, 9, 17, 6], "Will the deal close?");
    expect(text).toMatch(/Primary outcome \(closing card\)/);
    expect(text).toMatch(/Central situation \(middle card\)/);
  });

  it("labels the Petit Tableau centre and middle line explicitly", () => {
    const { block: text } = block("comprehensive", [1, 2, 3, 4, 5, 6, 7, 8, 9], "What will the month bring?");
    expect(text).toMatch(/Directional outcome \(right end of middle line\)/);
    expect(text).toMatch(/Center card \(heart of tableau\)/);
    expect(text).toMatch(/Development path \(left end of middle line\)/);
    expect(text).not.toMatch(/Primary outcome \(center/);
  });
});

describe("prediction-context: never invents an anchor", () => {
  // A Grand Tableau is always 36 distinct catalog cards, so Man and Woman are always
  // present and the "no significator drawn" branch is unreachable defensive code. What
  // is reachable, and what matters, is that an *unbound* person card never becomes an
  // asserted anchor.
  it("does not claim a primary significator in an unbound Grand Tableau", () => {
    const { pe, block: text } = block("grand-tableau", Array.from({ length: 36 }, (_, i) => i + 1));
    expect(text).toMatch(/No primary significator/i);
    expect(text).not.toMatch(/Significator \(anchor of the read\)/);
    expect(pe.coreDriverCard).toBeNull();
  });
});