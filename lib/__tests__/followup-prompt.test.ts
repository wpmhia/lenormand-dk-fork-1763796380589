import { describe, it, expect } from "vitest";
import {
  FOLLOWUP_SYSTEM_PROMPT,
  FOLLOWUP_MAX_OUTPUT_TOKENS,
} from "@/lib/followup-prompt";

describe("follow-up system prompt", () => {
  it("caps output at 1-2 sentences", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/1-2 short sentences/i);
  });

  it("forbids headings, sections, bullets, or a new reading", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/Do not produce headings, sections, bullets, card-by-card explanations, or a new reading/i);
  });

  it("forbids repeating the previous interpretation", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/Do not repeat the previous interpretation/i);
  });

  it("instructs the model to answer yes/no or one clear likely outcome directly", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/If the question can be answered yes\/no or with one clear likely outcome, state that conclusion immediately/i);
  });

  it("instructs the model to condense when the follow-up repeats the original question", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/If the follow-up substantially repeats the original question/i);
  });

  it("is much shorter than the full reading system prompt and stays under 50 lines", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT.split("\n").length).toBeLessThan(20);
  });

  it("caps output tokens well below the full reading budget", () => {
    expect(FOLLOWUP_MAX_OUTPUT_TOKENS).toBeLessThanOrEqual(200);
  });
});
