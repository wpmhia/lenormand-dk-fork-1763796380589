import { describe, expect, it } from "vitest";
import { canGenerateAIReading } from "@/lib/ai-access";

describe("central AI access gate", () => {
  it("allows primary readings and follow-ups within the existing rate limits", () => {
    expect(canGenerateAIReading({ kind: "reading" })).toEqual({ allowed: true });
    expect(canGenerateAIReading({ kind: "followup" })).toEqual({ allowed: true });
  });

  it("decides from the server-side context only, not from client-supplied flags", () => {
    const decision = canGenerateAIReading({ kind: "reading" } as { kind: "reading" });
    expect(decision.allowed).toBe(true);
  });
});
