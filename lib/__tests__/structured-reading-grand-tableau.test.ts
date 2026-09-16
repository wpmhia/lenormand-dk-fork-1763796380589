import { describe, expect, it } from "vitest";
import { buildReadingContext } from "@/lib/reading-context";
import { getStructuredReadingSchema, validateStructuredReading } from "@/lib/structured-reading";

describe("Grand Tableau positional evidence", () => {
  it("accepts valid position evidence references", () => {
    const cards = Array.from({ length: 36 }, (_, position) => ({ id: position + 1, name: `Card ${position + 1}`, keywords: [], position }));
    const context = buildReadingContext("grand-tableau", "What develops?", cards, new Map());
    const reading = getStructuredReadingSchema("grand-tableau").parse({
      mode: "forecast",
      interpretation: "The tableau describes a developing situation with several interacting themes.",
      evidence: [{ pair: "tableau positions", evidenceIds: ["position-3"], implication: "Position three contributes context to the reading." }],
      prediction: { development: "The situation develops through the supplied tableau evidence.", evidenceIds: ["position-3"], timing: "Not clearly shown by these cards.", watchFor: null, practicalAction: null },
      housesAndMirrors: [{ house: "House of Heart", meaning: "A relevant relationship theme is present." }],
    });
    expect(validateStructuredReading(reading, context).some((issue) => issue.message.includes('position-3'))).toBe(false);
  });
});
