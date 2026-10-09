import { describe, it, expect } from "vitest";
import {
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
    expect(FOLLOWUP_SYSTEM_PROMPT).toMatch(/Previous AI wording and conversation history are context, not evidence/i);
  });

  it("is much shorter than the full reading system prompt and stays under 50 lines", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT.split("\n").length).toBeLessThan(20);
  });

  it("caps output tokens well below the full reading budget", () => {
    expect(FOLLOWUP_MAX_OUTPUT_TOKENS).toBeLessThanOrEqual(200);
  });
});
