import { SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";

/**
 * The follow-up uses the same reader and principles as the reading. It differs only in that
 * the spread is fixed and the answer addresses the active follow-up question.
 */
export const FOLLOWUP_SYSTEM_PROMPT = `${SIMPLE_LENORMAND_SYSTEM_PROMPT}

This is a follow-up to an existing spread. The cards and positions are fixed; use only spatial relationships supported by the supplied grid. Answer the active follow-up question, not a new reading, and do not rely on previous readings or personal history.`;

export interface FollowupPromptInput {
  spreadFacts: string;
  originalQuestion: string;
  activeQuestion: string;
}

export interface FollowupRequestPayloadInput {
  followUpQuestion: string;
  originalQuestion: string;
  cards: Array<{ id: number; name: string; position?: number }>;
  spreadId: string;
  significatorPreference: "woman" | "man" | "both";
}

export function buildFollowupRequestPayload(input: FollowupRequestPayloadInput) {
  return {
    followUpQuestion: input.followUpQuestion,
    originalQuestion: input.originalQuestion,
    cards: input.cards,
    spreadId: input.spreadId,
    significatorPreference: input.significatorPreference,
  };
}

export function buildFollowupPrompt(input: FollowupPromptInput): string {
  return [
    `Original question:\n${input.originalQuestion || "(none)"}`,
    `Active follow-up question:\n${input.activeQuestion}`,
    input.spreadFacts,
  ].join("\n\n");
}
