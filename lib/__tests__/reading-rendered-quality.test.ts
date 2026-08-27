import { describe, it, expect } from "vitest";
import {
  validateReadingOutput,
  validateReadingMarkdown,
  isCriticalIssue,
} from "@/lib/reading-validator";
import { buildPredictionContext, formatPredictionEvidenceBlock } from "@/lib/prediction-context";
import { buildPredictionTimingLine } from "@/lib/timing";
import { buildReadingContext } from "@/lib/reading-context";
import { buildPromptFromContext } from "@/lib/prompt-builder";
import { getStructuredReadingSchema, renderStructuredReading } from "@/lib/structured-reading";
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

const GOLDEN_THREE_CARD = `## Interpretation

Communication is likely to open the next stage of this situation. You are likely to receive or exchange information that makes the possibility more concrete, but not everything is settled yet.

## Cards

- **Birds + Letter**: News, calls, emails, discussion or correspondence becomes the immediate vehicle through which the situation develops.
- **Letter + Book**: The message contains information that is not yet fully known: details, paperwork, conditions or something that still needs to be discovered.

## Prediction

**Most likely development:** Communication opens the next stage of this situation, and you receive or exchange information that makes the possibility substantially more concrete.
**Likely timing:** Within days.
**Watch for:** A call, email, or message arrives that introduces new details.
**Practical action:** Respond promptly to the first piece of communication that arrives.`;

describe("golden: validateReadingOutput content invariants", () => {
  it("rejects a reading whose ## Interpretation section is empty (regression: previously passed)", () => {
    const bad = `## Interpretation\n\n## Cards\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n**Most likely development:** Something is likely.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(bad, [12, 27, 26], "sentence-3");
    const empty = result.issues.find((i) => i.type === "empty_section" && i.message.toLowerCase().includes("interpretation"));
    expect(empty).toBeDefined();
    expect(result.valid).toBe(false);
  });

  it("rejects a reading whose ## Cards section has no bullets (regression: previously passed)", () => {
    const bad = `## Interpretation\n\nA meaningful sentence about Birds, Letter and Book and how they develop together.\n\n## Cards\n\n## Prediction\n\n**Most likely development:** Something is likely to happen.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(bad, [12, 27, 26], "sentence-3");
    const empty = result.issues.find(
      (i) => i.type === "empty_section" && i.message.toLowerCase().includes("cards"),
    );
    expect(empty).toBeDefined();
  });

  it("rejects a reading whose ## Prediction section is empty (regression: previously passed)", () => {
    const bad = `## Interpretation\n\nA meaningful sentence about the situation and the cards.\n\n## Cards\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n**Most likely development:** \n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
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

describe("spread-aware structured reading contract", () => {
  it.each([
    ["sentence-3", 3],
    ["sentence-5", 5],
    ["comprehensive", 9],
  ])("uses the multi-card contract for %s (%i cards)", (spreadId) => {
    const parsed = getStructuredReadingSchema(spreadId).safeParse({
      interpretation: "The cards describe a concrete situation developing through linked events and practical circumstances.",
      evidence: [{ pair: "Card A + Card B", evidenceIds: ["pair-1"], implication: "The combination gives the situation a clear direction." }],
      prediction: { development: "The situation develops through a clear practical next step.", timing: "Not clearly shown by these cards.", watchFor: null, practicalAction: null },
    });
    expect(parsed.success).toBe(true);
  });

  it("renders single-card as Interpretation only", () => {
    const parsed = getStructuredReadingSchema("single-card").parse({
      interpretation: "The card points to a concrete development in the situation that requires attention.",
    });
    const rendered = renderStructuredReading(parsed, "single-card");
    expect(rendered).toBe("## Interpretation\nThe card points to a concrete development in the situation that requires attention.");
    expect(rendered).not.toContain("## Cards");
    expect(validateReadingOutput(rendered, [12], "single-card").valid).toBe(true);
  });

  it("renders Grand Tableau houses and mirrors before card evidence", () => {
    const parsed = getStructuredReadingSchema("grand-tableau").parse({
      interpretation: "The tableau shows a practical situation developing through people, choices, and unresolved conditions.",
      housesAndMirrors: [{ house: "House of Communication", meaning: "A message or discussion occupies this life area and makes the issue more concrete." }],
      evidence: [{ pair: "Birds + Letter", evidenceIds: ["pair-1"], implication: "Communication becomes the active mechanism in this situation." }],
      prediction: { development: "A concrete exchange is the most likely next development.", timing: "Within days.", watchFor: null, practicalAction: null },
    });
    const rendered = renderStructuredReading(parsed, "grand-tableau");
    expect(rendered).toContain("## Houses and mirrors");
    expect(rendered.indexOf("## Houses and mirrors")).toBeLessThan(rendered.indexOf("## Cards"));
    expect(validateReadingOutput(rendered, [12, 27], "grand-tableau").issues.some((i) => i.type === "missing_section")).toBe(false);
  });
});

describe("golden: unsupported_timing regex catches range expressions", () => {
  it("catches 'Within 1-3 weeks' (regression: previously slipped through)", () => {
    const reading = `## Interpretation\n\nA meaningful sentence about Clover, Whip and Paths and how they develop together as a chain.\n\n## Cards\n\n- **Clover + Whip**: news.\n\n## Prediction\n\n**Most likely development:** Within 1-3 weeks this develops.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
    expect(result.valid).toBe(false);
  });

  it("catches '1–3 weeks' with en-dash", () => {
    const reading = `## Interpretation\n\nA meaningful sentence about Clover, Whip and Paths and how they develop together.\n\n## Cards\n\n- **Clover + Whip**: news.\n\n## Prediction\n\n**Most likely development:** 1\u20133 weeks later.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });

  it("catches '1 to 3 weeks'", () => {
    const reading = `## Interpretation\n\nA meaningful sentence about Clover, Whip and Paths and how they develop together.\n\n## Cards\n\n- **Clover + Whip**: news.\n\n## Prediction\n\n**Most likely development:** About 1 to 3 weeks from now.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });

  it("still catches bare '3 weeks'", () => {
    const reading = `## Interpretation\n\nA meaningful sentence about Clover, Whip and Paths and how they develop together.\n\n## Cards\n\n- **Clover + Whip**: news.\n\n## Prediction\n\n**Most likely development:** About 3 weeks from now.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(reading, [2, 11, 22], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });

  it("does NOT flag timing when a primary timing card (Birds) is drawn", () => {
    const reading = `## Interpretation\n\nA meaningful sentence about Birds, Letter and Book and how they develop together in a near-term cycle.\n\n## Cards\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n**Most likely development:** Within days.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(reading, [12, 27, 26], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeUndefined();
  });

  it("flags '2 years' when only Birds is drawn (mismatched range)", () => {
    const reading = `## Interpretation\n\nA meaningful sentence about Birds and Letter and how they develop together.\n\n## Cards\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n**Most likely development:** This develops over 2 years.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(reading, [12, 27], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
    expect(timingIssue?.message).toMatch(/outside the range/i);
  });

  it("flags 'within weeks' when only Birds (days) is drawn", () => {
    const reading = `## Interpretation\n\nA meaningful sentence about Birds and Letter and how they develop together.\n\n## Cards\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n**Most likely development:** This resolves within weeks.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(reading, [12, 27], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });

  it("flags 'over the coming weeks' (nonnumeric) when no timing card is drawn", () => {
    const reading = `## Interpretation\n\nA meaningful sentence about Rider Clover Ship.\n\n## Cards\n\n- **Rider + Clover**: news.\n\n## Prediction\n\n**Most likely development:** This develops over the coming weeks.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const result = validateReadingOutput(reading, [1, 2, 3], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });
});

describe("golden: Clover+Whip+Paths spread never produces '1-3 weeks'", () => {
  it("with no primary timing card drawn, the validator forbids any range expression", () => {
    const reading = `## Interpretation

A meaningful synthesis about Clover, Whip and Paths and how they connect the situation through conflict and decision-making.

## Cards

- **Clover + Whip**: Lucky conflict resolution, fortunate passion, positive energy.
- **Whip + Paths**: Conflict at a crossroads, passionate decision.

## Prediction

**Most likely development:** ## Prediction

**Most likely development:** This resolves within 1-3 weeks.
**Likely timing:** Not clearly shown by these cards.
**Watch for:** The development described above begins to appear in practical form.
**Practical action:** Respond to the first concrete sign of this development.
**Likely timing:** Not clearly shown by these cards.
**Watch for:** The development described above begins to appear in practical form.
**Practical action:** Respond to the first concrete sign of this development.`;

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
    const bad = `## Interpretation\n\n## Cards\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n**Most likely development:** Something is likely.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const out1 = validateReadingOutput(bad, [12, 27, 26], "sentence-3");
    expect(out1.issues.some((i) => i.type === "empty_section")).toBe(true);
    expect(out1.valid).toBe(false);
  });

  it("markdown validator still checks headings exist", () => {
    const bad = `## Interpretation\n\n## Cards\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n**Most likely development:** Something is likely.\n**Likely timing:** Not clearly shown by these cards.\n**Watch for:** The development described above begins to appear in practical form.\n**Practical action:** Respond to the first concrete sign of this development.`;
    const out2 = validateReadingMarkdown(bad, "sentence-3");
    expect(out2.valid).toBe(true);
  });
});

describe("golden: Prediction contract requires the required labels (Most likely development, Likely timing)", () => {
  const readingWithoutLabels = `## Interpretation

A meaningful sentence about Birds and Letter and how they develop together.

## Cards

- **Birds + Letter**: news.

## Prediction

Just some prose without any required labels at all.`;

  it("rejects Prediction that has no bold labels (regression: six words was previously enough)", () => {
    const result = validateReadingOutput(readingWithoutLabels, [12, 27], "sentence-3");
    const labelIssues = result.issues.filter(
      (i) => i.type === "empty_section" && i.message.includes("## Prediction is missing required label"),
    );
    expect(labelIssues.length).toBeGreaterThanOrEqual(2);
    expect(result.valid).toBe(false);
  });

  it("accepts Prediction with the two required labels (Watch for and Practical action are now optional)", () => {
    const good = `## Interpretation

A meaningful sentence about Birds and Letter and how they develop together.

## Cards

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

  it("accepts Prediction that omits optional Watch for and Practical action when evidence cannot support them", () => {
    const minimal = `## Interpretation

A meaningful sentence about Cross, Snake and Coffin and how they develop together as a difficult line.

## Cards

- **Cross + Snake**: burden becomes complication.
- **Snake + Coffin**: complication reaches an ending.

## Prediction

**Most likely development:** The line leans against the path the question asks about; the route encounters complications and closes rather than becoming established.
**Likely timing:** Not clearly shown by these cards.`;
    const result = validateReadingOutput(minimal, [36, 7, 8], "sentence-3");
    const labelIssues = result.issues.filter(
      (i) => i.type === "empty_section" && i.message.includes("## Prediction is missing required label"),
    );
    expect(labelIssues).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("rejects an empty optional label when it IS included (defends against empty filler)", () => {
    const withEmptyOptional = `## Interpretation

A meaningful sentence about Cross, Snake and Coffin and how they develop together.

## Cards

- **Cross + Snake**: burden becomes complication.

## Prediction

**Most likely development:** The cards lean against the current path.
**Likely timing:** Not clearly shown by these cards.
**Watch for:** 
**Practical action:** `;
    const result = validateReadingOutput(withEmptyOptional, [36, 7], "sentence-3");
    const emptyOptional = result.issues.filter(
      (i) => i.type === "empty_section" && i.message.includes("has too little content"),
    );
    expect(emptyOptional.length).toBeGreaterThan(0);
    expect(result.valid).toBe(false);
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
    expect(formatPredictionEvidenceBlock(out)).toContain("Primary outcome");
    expect(formatPredictionEvidenceBlock(out)).toContain("Strongest transition");
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

describe("golden: Interpretation / Cards / Prediction are distinct sections", () => {
  const GOOD_LINEAR = `## Interpretation

A meaningful sentence about Birds and Letter and how they develop together.

## Cards

- **Birds + Letter**: news.

## Prediction

**Most likely development:** Communication opens the next stage.
**Likely timing:** Within days.
**Watch for:** A call or message arrives.
**Practical action:** Respond to the first message.`;

  it("accepts a reading that uses Interpretation / Cards / Prediction in that order", () => {
    const result = validateReadingOutput(GOOD_LINEAR, [12, 27], "sentence-3");
    expect(result.valid).toBe(true);
  });

  it("rejects a reading still using the old ## Reading heading", () => {
    const oldStyle = GOOD_LINEAR.replace("## Interpretation", "## Reading").replace("## Cards", "## Key combinations");
    const result = validateReadingOutput(oldStyle, [12, 27], "sentence-3");
    const missing = result.issues.filter((i) => i.type === "missing_section");
    expect(missing.length).toBeGreaterThan(0);
  });

  it("requires at least 12 words of interpretive prose in ## Interpretation", () => {
    const tooShort = `## Interpretation\n\nShort.\n\n## Cards\n\n- **Birds + Letter**: news.\n\n## Prediction\n\n**Most likely development:** X.\n**Likely timing:** Within days.\n**Watch for:** Y.\n**Practical action:** Z.`;
    const result = validateReadingOutput(tooShort, [12, 27], "sentence-3");
    const empty = result.issues.find(
      (i) => i.type === "empty_section" && i.message.toLowerCase().includes("interpretation"),
    );
    expect(empty).toBeDefined();
  });
});

describe("golden: prompt mandates the three-part arc", () => {
  it("instructs Interpretation to hold back the final forecast", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([12, 27, 26]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/Do not give the final predicted outcome or timing here/);
  });

  it("instructs Cards to be evidence, not forecast", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([12, 27, 26]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/evidence, not forecast/);
  });

  it("instructs Prediction to be one synthesized forward-looking conclusion that does not repeat the Interpretation", () => {
    const ctx = buildReadingContext("sentence-3", "Will I move?", normalized([12, 27, 26]), cardsMap);
    const prompt = buildPromptFromContext(ctx);
    expect(prompt).toMatch(/Do not repeat the Interpretation/);
  });
});

describe("golden: timing validation only scans the Prediction section", () => {
  it("does not flag 'long-term stability' in the Interpretation section (Lily + Anchor case)", () => {
    // Lily + Anchor — no timing card drawn. The Mistral reading could legitimately
    // describe "long-term professional stability" in Interpretation. That phrase is
    // descriptive, not a timing claim, so it must not trigger unsupported_timing.
    const reading = `## Interpretation

This line points to long-term professional stability. The drawn cards describe a steady outcome that does not require a specific timeframe.

## Cards

- **Lily + Anchor**: peace and stability over the long arc.

## Prediction

**Most likely development:** A stable, secure outcome is the primary tendency of this line.
**Likely timing:** Not clearly shown by these cards.
**Watch for:** The development begins to appear in concrete form.
**Practical action:** Move toward the stable outcome in a calm way.`;
    const result = validateReadingOutput(reading, [30, 35], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeUndefined();
    expect(result.valid).toBe(true);
  });

  it("does not flag 'within weeks' or 'soon' in the Interpretation or Cards sections", () => {
    const reading = `## Interpretation

This line develops soon around a short-cycle discussion. The drawn cards describe an active period in the next while.

## Cards

- **Birds + Letter**: communication within days.

## Prediction

**Most likely development:** A concrete conversation is the primary tendency of this line.
**Likely timing:** Not clearly shown by these cards.
**Watch for:** A call or message arrives.
**Practical action:** Respond to the first message.`;
    const result = validateReadingOutput(reading, [12, 27], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeUndefined();
  });

  it("STILL flags timing inside the Prediction section (so the four-label contract is enforced)", () => {
    const reading = `## Interpretation

A meaningful sentence about the cards and the situation.

## Cards

- **Birds + Letter**: communication.

## Prediction

**Most likely development:** This resolves within 2 years.
**Likely timing:** Not clearly shown by these cards.
**Watch for:** The development begins to appear.
**Practical action:** Respond when you see it.`;
    const result = validateReadingOutput(reading, [12, 27], "sentence-3");
    const timingIssue = result.issues.find((i) => i.type === "unsupported_timing");
    expect(timingIssue).toBeDefined();
  });
});
