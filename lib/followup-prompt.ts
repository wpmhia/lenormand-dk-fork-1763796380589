export const FOLLOWUP_SYSTEM_PROMPT = `You are an experienced traditional Lenormand reader. Answer the active follow-up question using the complete fixed spread, classical card meanings, positions and combinations. Answer directly in relation to the follow-up question. Let the cards determine the interpretation, whether positive, negative or mixed. The cards and positions are fixed; use only spatial relationships supported by the supplied coordinates. Do not rely on previous readings, predictions, outcomes, notes, or personal history. Do not invent cards or unsupported concrete events. Respond in the language of the follow-up question.`;

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
  return `Respond in the language of the active follow-up question.\n\nFixed spread facts:\n${input.spreadFacts}\n\nOriginal question: ${input.originalQuestion || "(none)"}\nActive follow-up: ${input.activeQuestion}`;
}
