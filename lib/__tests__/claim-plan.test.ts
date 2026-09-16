import { describe, expect, it } from "vitest";
import { buildClaimPlan } from "@/lib/claim-plan";
import { buildReadingContext } from "@/lib/reading-context";

describe("deterministic ClaimPlan", () => {
  it("keeps the question predicate and pair provenance explicit", () => {
    const cards = [13, 12, 11].map((id, position) => ({ id, name: `Card ${id}`, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Will Mahican stay with me?", cards, new Map(), "both", "", {
      mode: "forecast",
      domain: "love",
      predicate: "stay",
      subject: "Mahican",
      counterparty: "questioner",
      timeframe: null,
    });
    const plan = buildClaimPlan(context);
    const questionClaim = plan.claims.find((claim) => claim.id === "question-predicate");
    expect(questionClaim).toMatchObject({ subject: "Mahican", predicate: "stay", object: "questioner" });
    expect(plan.claims.filter((claim) => claim.id.startsWith("pair-")).every((claim) => claim.evidenceIds.length === 1)).toBe(true);
  });

  it("marks an unreviewed pair unresolved instead of inventing a proposition", () => {
    const cards = [16, 24, 14].map((id, position) => ({ id, name: `Card ${id}`, keywords: [], position }));
    const context = buildReadingContext("sentence-3", "Did this happen?", cards, new Map(), "both", "", {
      mode: "retrospective_event",
      domain: "love_sexual",
      predicate: "sexting",
      subject: "Mahican",
      counterparty: "questioner",
      timeframe: null,
    });
    const plan = buildClaimPlan(context);
    expect(plan.claims.some((claim) => claim.modality === "unresolved" && claim.proposition === null)).toBe(true);
  });
});
