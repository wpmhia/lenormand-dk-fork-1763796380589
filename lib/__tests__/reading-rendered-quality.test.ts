import { describe, it, expect } from "vitest";
import {
  validateReadingOutput,
  validateReadingMarkdown,
  isCriticalIssue,
} from "@/lib/reading-validator";
import { buildPredictionContext, formatPredictionEvidenceBlock } from "@/lib/prediction-context";
import { buildPredictionTimingLine } from "@/lib/timing";
import { buildReadingContext } from "@/lib/reading-context";
import type { Card } from "@/lib/types";

const cardsMap = new Map<number, Card>();
function normalized(ids: number[]) {
  return ids.map((id) => {
    const c: Card = cardsMap.get(id) ?? {
      id, name: `Card ${id}`, number: id, keywords: [`kw${id}`],
      uprightMeaning: "", meaning: { general: "", positive: [], negative: [] },
      combos: [], imageUrl: null,
    };
    return { id: c.id, name: c.name, keywords: c.keywords, strength: c.strength };
  });
}
for (let i = 1; i <= 36; i++) {
  cardsMap.set(i, {
    id: i, name: `Card ${i}`, number: i, keywords: [`kw${i}`],
    uprightMeaning: "", meaning: { general: "", positive: [], negative: [] },
    combos: [], imageUrl: null,
  });
}

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
  };
}

const GOLDEN_THREE_CARD = `## Reading

Communication is likely to open the next stage of this situation. You are likely to receive or exchange information that makes the possibility more concrete, but not everything is settled yet.

## Key combinations

- **Birds + Letter**: News, calls, emails, discussion or correspondence becomes the immediate vehicle through which the situation develops.
- **Letter + Book**: The message contains information that is not yet fully known: details, paperwork, conditions or something that still needs to be discovered.

## Prediction

**Most likely development:** Communication opens the next stage of this situation, and you receive or exchange information that makes the possibility substantially more concrete.
**Likely timing:** Within days.
**Watch for:** A call, email, or message arrives that introduces new details.
**Practical action:** Respond promptly to the first piece of communication that arrives.`;

describe("golden: validateReadingOutput content invariants", () => {
  it("rejects a reading whose ## Reading section is empty (regression: previously passed)", () => {
    const bad = `## Reading\n\n## Key combinations\n\n- **Birds + Letter**: news.\n\n## Prediction\n\nSomething is likely.`;
    const result = validateReadingOutput(bad, [12, 27, 26], "sentence-3");
    const empty = result.issues.find((i) => i.type === "empty_section" && i.message.toLowerCase().includes("reading"));
    expect(empty).toBeDefined();
    expect(result.valid).toBe(false);
  });

  it("rejects a reading whose ## Key combinations section has no bullets (regression: previously passed)", () => {
    const bad = `## Reading\n\nA meaningful sentence about Birds, Letter and Book and how they develop together.\n\n## Key combinations\n\n## Prediction\n\nSomething is likely to happen.`;
    const result = validateReadingOutput(bad, [12, 27, 26], "sentence-3");
    const empty = result.issues.find(
      (i) => i.type === "empty_section" && i.message.toLowerCase().includes("key combinations"),
    );
    expect(empty).toBeDefined();
  });

  it("rejects a reading whose ## Prediction section is empty (regression: previously passed)", () => {
    const bad = `## Reading\n\nA meaningful sentence about the situation and the cards.\n\n## Key combinations\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n`;
    const result = validateReadingOutput(bad, [12, 27, 26], "sentence-3");
    const empty = result.issues.find(
      (i) => i.type === "empty_section" && i.message.toLowerCase().includes("prediction"),
    );
    expect(empty).toBeDefined();
  });

  it("accepts the golden 3-card reading without any empty_section issues", () => {
    const result = validateReadingOutput(GOLDEN_THREE_CARD, [12, 27, 26], "sentence-3");
    const empty = result.issues.filter((i) => i.type === "empty_section");
    expect(empty).toEqual([]);
  });
});

describe("golden: unsupported_timing regex catches range expressions", () => {
  it("catches 'Within 1-3 weeks' (regression: previously slipped through)", () => {
    const reading = `## Reading\n\nA meaningful sentence about Clover, Whip and Paths and how they develop together as a chain.\n\n## Key combinations\n\n- **Clover + Whip**: news.\n\n## Prediction\n\nWithin 1-3 weeks this develops.`;
    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
    expect(result.valid).toBe(false);
  });

  it("catches '1–3 weeks' with en-dash", () => {
    const reading = `## Reading\n\nA meaningful sentence about Clover, Whip and Paths and how they develop together.\n\n## Key combinations\n\n- **Clover + Whip**: news.\n\n## Prediction\n\n1\u20133 weeks later.`;
    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });

  it("catches '1 to 3 weeks'", () => {
    const reading = `## Reading\n\nA meaningful sentence about Clover, Whip and Paths and how they develop together.\n\n## Key combinations\n\n- **Clover + Whip**: news.\n\n## Prediction\n\nAbout 1 to 3 weeks from now.`;
    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });

  it("still catches bare '3 weeks'", () => {
    const reading = `## Reading\n\nA meaningful sentence about Clover, Whip and Paths and how they develop together.\n\n## Key combinations\n\n- **Clover + Whip**: news.\n\n## Prediction\n\nAbout 3 weeks from now.`;
    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });

  it("does NOT flag timing when a primary timing card (Birds) is drawn", () => {
    const reading = `## Reading\n\nA meaningful sentence about Birds, Letter and Book and how they develop together in a near-term cycle.\n\n## Key combinations\n\n- **Birds + Letter**: news.\n\n## Prediction\n\nWithin days.`;
    const result = validateReadingOutput(reading, [12, 27, 26], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeUndefined();
  });

  it("flags '2 years' when only Birds is drawn (mismatched range)", () => {
    const reading = `## Reading\n\nA meaningful sentence about Birds and Letter and how they develop together.\n\n## Key combinations\n\n- **Birds + Letter**: news.\n\n## Prediction\n\nThis develops over 2 years.`;
    const result = validateReadingOutput(reading, [12, 27], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
    expect(timingIssue?.message).toMatch(/outside the range/i);
  });

  it("flags 'within weeks' when only Birds (days) is drawn", () => {
    const reading = `## Reading\n\nA meaningful sentence about Birds and Letter and how they develop together.\n\n## Key combinations\n\n- **Birds + Letter**: news.\n\n## Prediction\n\nThis resolves within weeks.`;
    const result = validateReadingOutput(reading, [12, 27], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });

  it("flags 'over the coming weeks' (nonnumeric) when no timing card is drawn", () => {
    const reading = `## Reading\n\nA meaningful sentence about Rider Clover Ship.\n\n## Key combinations\n\n- **Rider + Clover**: news.\n\n## Prediction\n\nThis develops over the coming weeks.`;
    const result = validateReadingOutput(reading, [1, 2, 3], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });
});

describe("golden: Clover+Whip+Paths spread never produces '1-3 weeks'", () => {
  it("with no primary timing card drawn, the validator forbids any range expression", () => {
    const reading = `## Reading

A meaningful synthesis about Clover, Whip and Paths and how they connect the situation through conflict and decision-making.

## Key combinations

- **Clover + Whip**: Lucky conflict resolution, fortunate passion, positive energy.
- **Whip + Paths**: Conflict at a crossroads, passionate decision.

## Prediction

This resolves within 1-3 weeks.`;

    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });
});

describe("golden: empty_section is a critical issue (forces fallback)", () => {
  it("treats empty_section as critical so the route regenerates or falls back", () => {
    expect(isCriticalIssue({ type: "empty_section", message: "x" })).toBe(true);
  });
});

describe("golden: validateReadingMarkdown + structural checks work together", () => {
  it("the exact bad output from the regression is rejected by the content validator", () => {
    const bad = `## Reading\n\n## Key combinations\n\n- **Birds + Letter**: news.\n\n## Prediction\n\nSomething is likely.`;
    const out1 = validateReadingOutput(bad, [12, 27, 26], "sentence-3");
    expect(out1.issues.some((i) => i.type === "empty_section")).toBe(true);
    expect(out1.valid).toBe(false);
  });

  it("markdown validator still checks headings exist", () => {
    const bad = `## Reading\n\n## Key combinations\n\n- **Birds + Letter**: news.\n\n## Prediction\n\nSomething is likely.`;
    const out2 = validateReadingMarkdown(bad, "sentence-3");
    expect(out2.valid).toBe(true);
  });
});

describe("golden: Prediction contract requires the four mandatory labels", () => {
  const readingWithoutLabels = `## Reading

A meaningful sentence about Birds and Letter and how they develop together.

## Key combinations

- **Birds + Letter**: news.

## Prediction

Just some prose without any required labels at all.`;

  it("rejects Prediction that has no bold labels (regression: six words was previously enough)", () => {
    const result = validateReadingOutput(readingWithoutLabels, [12, 27], "sentence-3");
    const labelIssues = result.issues.filter(
      (i) => i.type === "empty_section" && i.message.includes("## Prediction is missing required label"),
    );
    expect(labelIssues.length).toBeGreaterThanOrEqual(4);
    expect(result.valid).toBe(false);
  });

  it("accepts Prediction with all four labels and at least 2 words per label", () => {
    const good = `## Reading

A meaningful sentence about Birds and Letter and how they develop together.

## Key combinations

- **Birds + Letter**: news.

## Prediction

**Most likely development:** Communication opens the next stage and a piece of news arrives.
**Likely timing:** Within days.
**Watch for:** A specific call or message introducing new details.
**Practical action:** Respond to the first message that arrives.`;
    const result = validateReadingOutput(good, [12, 27], "sentence-3");
    const labelIssues = result.issues.filter(
      (i) => i.type === "empty_section" && i.message.includes("## Prediction is missing required label"),
    );
    expect(labelIssues).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

describe("golden: Prediction synthesis evidence is produced for every applicable spread", () => {
  it("emits a Prediction synthesis evidence block for sentence-3", () => {
    const cards = normalized([12, 27, 26]);
    const ctx = buildReadingContext("sentence-3", "Will I hear back soon?", cards, cardsMap);
    const out = buildPredictionContext(ctx);
    expect(out.outcomeCard).toBeDefined();
    expect(out.developmentCard).toBeDefined();
    expect(out.timingEvidence.length).toBeGreaterThan(0);
    expect(formatPredictionEvidenceBlock(out)).toContain("Primary outcome:");
    expect(formatPredictionEvidenceBlock(out)).toContain("Strongest transition:");
  });

  it("uses deterministic timing output for the Birds card", () => {
    const out = buildPredictionTimingLine([{ cardId: 12, cardName: "Birds", range: "days" }]);
    expect(out).toBe("Within days or very soon.");
  });

  it("uses deterministic timing output for the Tree card without the months/years ambiguity", () => {
    const out = buildPredictionTimingLine([{ cardId: 5, cardName: "Tree", range: "long-term" }]);
    expect(out).toBe("Long-term; likely months to years.");
  });

  it("falls back to Not clearly shown when no timing card is drawn", () => {
    const out = buildPredictionTimingLine([]);
    expect(out).toBe("Not clearly shown by these cards.");
  });
});
