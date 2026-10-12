import { describe, expect, it } from "vitest";
import { detectQuestionLanguage } from "@/lib/question-language";

describe("question language hint", () => {
  it("identifies clear English and Dutch questions without translating them", () => {
    expect(detectQuestionLanguage("Will my project succeed?" )).toBe("English");
    expect(detectQuestionLanguage("Hoe ontwikkelt mijn relatie zich?" )).toBe("Dutch");
  });

  it("does not force a language when the text is short or ambiguous", () => {
    expect(detectQuestionLanguage("OK?" )).toBeNull();
    expect(detectQuestionLanguage("Is it?" )).toBeNull();
  });
});
