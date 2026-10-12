import { describe, it, expect } from "vitest";
import {
  buildFollowupPrompt,
  FOLLOWUP_SYSTEM_PROMPT,
  FOLLOWUP_MAX_OUTPUT_TOKENS,
} from "@/lib/followup-prompt";

describe("follow-up system prompt", () => {
  it("allows enough explanation to address the active follow-up", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/Answer the active follow-up directly, with enough explanation to address what was asked/i);
  });

  it("does not force a conclusion-first or fixed short-answer format", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).not.toMatch(/conclusion first|state that conclusion immediately/i);
    expect(FOLLOWUP_SYSTEM_PROMPT).not.toMatch(/1-2 short sentences|1-4 concise sentences/i);
  });

  it("keeps the spread fixed and grounded in supplied evidence", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/The cards and positions are fixed/i);
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/Use only spatial relationships supported by the supplied coordinates/i);
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/Interpret this follow-up independently/i);
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/Do not rely on previous readings, predictions, outcomes, notes, or personal history/i);
    expect(FOLLOWUP_SYSTEM_PROMPT).not.toMatch(/conversation history/i);
  });

  it("builds follow-up input only from the fixed spread and current questions", () => {
    const prompt = buildFollowupPrompt({
      spreadFacts: "position 1: Rider",
      originalQuestion: "Will the project advance?",
      activeQuestion: "What suggests a delay?",
    });
    expect(prompt).toContain("position 1: Rider");
    expect(prompt).toContain("Original question: Will the project advance?");
    expect(prompt).toContain("Active follow-up: What suggests a delay?");
    expect(prompt).not.toContain("Earlier assistant answer");
    expect(prompt).not.toContain("previous outcome");
  });

  it("is much shorter than the full reading system prompt and stays under 50 lines", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT.split("\n").length).toBeLessThan(20);
  });

  it("caps output tokens well below the full reading budget", () => {
    expect(FOLLOWUP_MAX_OUTPUT_TOKENS).toBeLessThanOrEqual(200);
  });
});
