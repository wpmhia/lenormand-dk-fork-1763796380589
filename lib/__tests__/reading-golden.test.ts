import { describe, it, expect } from "vitest";
import {
  validateReadingOutput,
  validateReadingMarkdown,
  normalizeMarkdown,
  isCriticalIssue,
  buildDeterministicFallback,
} from "@/lib/reading-validator";
import type { Card } from "@/lib/types";

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

const cardsMap = new Map<number, Card>(
  Array.from({ length: 36 }, (_, i) => [i + 1, makeCard(i + 1, `Card ${i + 1}`)] as const),
);

const GOLDEN_THREE_CARD = `## Interpretation

Communication is likely to open the next stage of this situation. The cards show that information exchange is the active force, while a hidden detail still needs to surface. The direction is forward, but not yet settled.

## Cards

- **Birds + Letter**: News, calls, emails, discussion or correspondence becomes the immediate vehicle through which the situation develops.
- **Letter + Book**: The message contains information that is not yet fully known: details, paperwork, conditions or something that still needs to be discovered.

## Prediction

**Most likely development:** Communication appears to open the next stage and a piece of news arrives that makes the possibility substantially more concrete.
**Likely timing:** Within days.
**Watch for:** A call, email, or message arrives that introduces new details.
**Practical action:** Respond promptly to the first piece of communication that arrives.`;

describe("golden output: validateReadingOutput", () => {
  it("accepts a fluent 3-card reading with Prediction", () => {
    const drawn = [12, 27, 26];
    const result = validateReadingOutput(GOLDEN_THREE_CARD, drawn, "sentence-3");
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("flags invented cards without disturbing the rest of the reading", () => {
    const bad = GOLDEN_THREE_CARD + " The Tower suggests a sudden change.";
    const result = validateReadingOutput(bad, [12, 27, 26], "sentence-3");
    const invented = result.issues.find((i) => i.type === "invented_card");
    expect(invented).toBeDefined();
  });

  it("treats invented-card issues as critical", () => {
    expect(isCriticalIssue({ type: "invented_card", message: "x" })).toBe(true);
  });

  it("treats banned-term issues as critical", () => {
    expect(isCriticalIssue({ type: "banned_term", message: "x" })).toBe(true);
  });

  it("treats unsupported-timing issues as critical", () => {
    expect(isCriticalIssue({ type: "unsupported_timing", message: "x" })).toBe(true);
  });

  it("treats extra_section as critical (model must follow heading contract)", () => {
    expect(isCriticalIssue({ type: "extra_section", message: "x" })).toBe(true);
  });

  it("treats missing_section as critical (model must include required headings)", () => {
    expect(isCriticalIssue({ type: "missing_section", message: "x" })).toBe(true);
  });
});

describe("golden output: validateReadingMarkdown", () => {
  it("accepts the golden reading markdown", () => {
    const result = validateReadingMarkdown(GOLDEN_THREE_CARD, "sentence-3");
    expect(result.valid).toBe(true);
  });

  it("rejects markdown with a leading paragraph before ## Interpretation", () => {
    const bad = "Some preamble.\n\n## Interpretation\n\nHello.\n\n## Cards\n\nx\n\n## Prediction\n\ny";
    const result = validateReadingMarkdown(bad, "sentence-3");
    expect(result.valid).toBe(false);
  });
});

describe("golden output: normalizeMarkdown is non-destructive", () => {
  it("preserves prose content while normalizing structure", () => {
    const input = GOLDEN_THREE_CARD;
    const out = normalizeMarkdown(input);
    expect(out).toContain("Communication is likely to open the next stage");
    expect(out).toContain("## Cards");
    expect(out).toContain("## Prediction");
  });

  it("downgrades H1/H3 headings to ## without dropping text", () => {
    const input = "# Interpretation\n\nHello.\n\n### Cards\n\nx\n\n## Prediction\n\ny";
    const out = normalizeMarkdown(input);
    expect(out).toContain("## Interpretation");
    expect(out).toContain("## Cards");
    expect(out).toContain("Hello.");
  });

  it("strips markdown tables without dropping surrounding text", () => {
    const input = "## Interpretation\n\nHello.\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n## Prediction\n\ny";
    const out = normalizeMarkdown(input);
    expect(out).toContain("Hello.");
    expect(out).not.toMatch(/\|/);
    expect(out).toContain("## Prediction");
  });
});

describe("golden output: buildDeterministicFallback uses traditional pair meanings", () => {
  it("uses provided pair meaning verbatim in the bullets for the correct pair", () => {
    const drawn = [
      { id: 12, name: "Birds", keywords: ["communication"] },
      { id: 26, name: "Book", keywords: ["knowledge"] },
    ];
    const pairs = [
      { indexA: 0, indexB: 1, cardAName: "Birds", cardBName: "Book", meaning: "Knowledge arriving through communication" },
    ];
    const out = buildDeterministicFallback(drawn, "sentence-3", "Will I hear back soon?", pairs);
    expect(out).toContain("## Interpretation");
    expect(out).toContain("## Cards");
    expect(out).toContain("## Prediction");
    expect(out).toContain("Knowledge arriving through communication");
    expect(out).toContain("**Most likely development:**");
    expect(out).toContain("**Likely timing:**");
    expect(out).toContain("**Watch for:**");
    expect(out).toContain("**Practical action:**");
  });

  it("returns an Interpretation block even with empty card list", () => {
    const out = buildDeterministicFallback([], "single-card", "");
    expect(out).toContain("## Interpretation");
    expect(out).toContain("No cards were drawn");
  });

  it("uses grand-tableau structure for a 36-card spread", () => {
    const drawn = Array.from({ length: 36 }, (_, i) => ({ id: i + 1, name: `Card ${i + 1}`, keywords: [`Card ${i + 1}`] }));
    const out = buildDeterministicFallback(drawn, "grand-tableau", "test");
    expect(out).toContain("## Interpretation");
    expect(out).toContain("## Houses and mirrors");
    expect(out).toContain("## Cards");
    expect(out).toContain("## Prediction");
  });
});
