/**
 * Central, server-side decision on whether an AI generation may run. Every model-backed route
 * asks this before calling DeepSeek. Today AI is free within the existing rate limits, so the
 * answer is always "allowed"; a future paid tier changes this one function, not the routes or
 * the interface. Nothing here reads client input for the decision.
 */
export type AIAccessDecision =
  | { allowed: true }
  | { allowed: false; reason: "not-entitled" };

export interface AIAccessContext {
  /** The route that wants to generate: a primary reading or a follow-up. */
  kind: "reading" | "followup";
}

export function canGenerateAIReading(_context: AIAccessContext): AIAccessDecision {
  return { allowed: true };
}
