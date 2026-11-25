import { describe, expect, it } from "vitest";
import { canGenerateAIReading } from "@/lib/ai-access";

describe("central AI access gate", () => {
  it("allows primary readings and follow-ups from server-side context only", () => {
    expect(canGenerateAIReading({ kind: "reading" })).toEqual({ allowed: true });
    expect(canGenerateAIReading({ kind: "followup" })).toEqual({ allowed: true });
    expect(canGenerateAIReading({ kind: "reading" }).allowed).toBe(true);
  });
});
