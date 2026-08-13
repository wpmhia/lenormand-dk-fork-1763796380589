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

const GOLDEN_THREE_CARD = `## Reading

Communication is likely to open the next stage of this situation. You are likely to receive or exchange information that makes the possibility more concrete, but not everything is settled yet.

## Key combinations

- **Birds + Letter**: News, calls, emails, discussion or correspondence becomes the immediate vehicle through which the situation develops.
- **Letter + Book**: The message contains information that is not yet fully known: details, paperwork, conditions or something that still needs to be discovered.

## Prediction

**Most likely development:** Communication appears to open the next stage of this situation. You are likely to receive or exchange information that makes the possibility substantially more concrete, but not everything is settled yet.
**Likely timing:** Within days to a few weeks.
**Observable sign:** A call, email, or message arrives that introduces new details.
**Practical action:** Respond promptly to the first piece of communication; do not wait for full clarity before acting.`;

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

  it("does not treat extra_section as critical (formatting only)", () => {
    expect(isCriticalIssue({ type: "extra_section", message: "x" })).toBe(false);
  });

  it("does not treat missing_section as critical (LLM may continue anyway)", () => {
    expect(isCriticalIssue({ type: "missing_section", message: "x" })).toBe(false);
  });
});

describe("golden output: validateReadingMarkdown", () => {
  it("accepts the golden reading markdown", () => {
    const result = validateReadingMarkdown(GOLDEN_THREE_CARD, "sentence-3");
    expect(result.valid).toBe(true);
  });

  it("rejects markdown with a leading paragraph before ## Reading", () => {
    const bad = "Some preamble.\n\n## Reading\n\nHello.\n\n## Key combinations\n\nx\n\n## Prediction\n\ny";
    const result = validateReadingMarkdown(bad, "sentence-3");
    expect(result.valid).toBe(false);
  });
});

describe("golden output: normalizeMarkdown is non-destructive", () => {
  it("preserves prose content while normalizing structure", () => {
    const input = GOLDEN_THREE_CARD;
    const out = normalizeMarkdown(input);
    expect(out).toContain("Communication is likely to open the next stage");
    expect(out).toContain("## Key combinations");
    expect(out).toContain("## Prediction");
  });

  it("downgrades H1/H3 headings to ## without dropping text", () => {
    const input = "# Reading\n\nHello.\n\n### Key combinations\n\nx\n\n## Prediction\n\ny";
    const out = normalizeMarkdown(input);
    expect(out).toContain("## Reading");
    expect(out).toContain("## Key combinations");
    expect(out).toContain("Hello.");
  });

  it("strips markdown tables without dropping surrounding text", () => {
    const input = "## Reading\n\nHello.\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n## Prediction\n\ny";
    const out = normalizeMarkdown(input);
    expect(out).toContain("Hello.");
    expect(out).not.toMatch(/\|/);
    expect(out).toContain("## Prediction");
  });
});

describe("golden output: buildDeterministicFallback uses traditional pair meanings", () => {
  it("uses provided traditional pair meaning verbatim in the bullets", () => {
    const drawn = [
      { id: 12, name: "Birds", keywords: ["communication"], meaning: undefined, traditionalPairMeaning: "Lucky knowledge" },
      { id: 26, name: "Book", keywords: ["knowledge"], meaning: undefined, traditionalPairMeaning: "Learning something new" },
    ];
    const out = buildDeterministicFallback(drawn, "sentence-3", "Will I hear back soon?");
    expect(out).toContain("## Reading");
    expect(out).toContain("## Key combinations");
    expect(out).toContain("## Prediction");
    expect(out).toContain("Lucky knowledge");
    expect(out).toContain("Learning something new");
    expect(out).toContain("**Most likely development:**");
    expect(out).toContain("**Likely timing:**");
    expect(out).toContain("**Observable sign:**");
    expect(out).toContain("**Practical action:**");
  });

  it("returns a Reading block even with empty card list", () => {
    const out = buildDeterministicFallback([], "single-card", "");
    expect(out).toContain("## Reading");
    expect(out).toContain("No cards were drawn");
  });
});
