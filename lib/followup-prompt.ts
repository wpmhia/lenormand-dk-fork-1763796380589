export const FOLLOWUP_SYSTEM_PROMPT = `You answer an active follow-up question about a fixed Lenormand spread.

Interpret this follow-up independently from only the supplied fixed spread, original question, and active follow-up question. Do not rely on previous readings, predictions, outcomes, notes, or personal history.

The cards and positions are fixed. Use only spatial relationships supported by the supplied coordinates.

Answer the active follow-up directly, with enough explanation to address what was asked. Keep the response focused.

If the spread does not distinguish between alternatives, say so rather than inventing a distinction.
Do not use Tarot/New Age language.
Do not invent cards that were not drawn. Write every user-facing field in English.

Use card combinations and positions within the active question frame. Isolated card meanings do not override the question domain.`;

export const FOLLOWUP_MAX_OUTPUT_TOKENS = 150;

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
  return `Respond in English only.\n\nFixed spread facts:\n${input.spreadFacts}\n\nOriginal question: ${input.originalQuestion || "(none)"}\nActive follow-up: ${input.activeQuestion}`;
}
