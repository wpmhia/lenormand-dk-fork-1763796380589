import { describe, expect, it } from "vitest";
import {
  buildFollowupPrompt,
  buildFollowupRequestPayload,
  FOLLOWUP_SYSTEM_PROMPT,
} from "@/lib/followup-prompt";
import { SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";

describe("follow-up system prompt and payload", () => {
  it("builds on the same reader and principles as the reading", () => {
    expect(FOLLOWUP_SYSTEM_PROMPT.startsWith(SIMPLE_LENORMAND_SYSTEM_PROMPT)).toBe(true);
  });

  it("carries only the original question, the active follow-up and the spread facts", () => {
    const prompt = buildFollowupPrompt({
      spreadFacts: "Drawn cards, in order:\n1. Rider",
      originalQuestion: "Will the project advance?",
      activeQuestion: "What suggests a delay?",
    });
    expect(prompt).toContain("Original question:\nWill the project advance?");
    expect(prompt).toContain("Active follow-up question:\nWhat suggests a delay?");
    expect(prompt).toContain("1. Rider");
  });

  it("does not carry earlier assistant turns into the prompt", () => {
    const prompt = buildFollowupPrompt({
      spreadFacts: "1. Rider",
      originalQuestion: "Q",
      activeQuestion: "Follow-up",
    });
    expect(prompt).not.toContain("Earlier assistant answer");
  });

  it("serializes only the current follow-up inputs, even when display history exists", () => {
    const input = {
      followUpQuestion: "What suggests a delay?",
      originalQuestion: "Will the project advance?",
      cards: [{ id: 1, name: "Rider", position: 0 }],
      spreadId: "sentence-3",
      significatorPreference: "both" as const,
      followUpHistory: [{ role: "assistant", content: "Earlier assistant answer" }],
      notes: "Private note",
    };
    const payload = buildFollowupRequestPayload(input);

    expect(payload).toEqual({
      followUpQuestion: input.followUpQuestion,
      originalQuestion: input.originalQuestion,
      cards: input.cards,
      spreadId: input.spreadId,
      significatorPreference: "both",
    });
    expect(JSON.stringify(payload)).not.toContain("Earlier assistant answer");
    expect(JSON.stringify(payload)).not.toContain("Private note");
  });
});
