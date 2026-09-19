import { describe, expect, it } from "vitest";
import { renderSimpleAnswer, SimpleAnswerSchema } from "@/lib/simple-answer";

describe("simple reading contract", () => {
  it("renders the compact producer output without legacy Prediction fields", () => {
    const answer = SimpleAnswerSchema.parse({
      directAnswer: "The cards support a cautious opening.",
      interpretation: "The line combines a practical opening with uncertainty.",
      cards: [{ combination: "Clover + Ring", meaning: "A small opening around a bond." }],
      timing: null,
      housesAndMirrors: [],
    });
    const rendered = renderSimpleAnswer(answer);
    expect(rendered).toContain("## Answer");
    expect(rendered).toContain("The cards support a cautious opening.");
    expect(rendered).not.toContain("Most likely development");
  });
});
