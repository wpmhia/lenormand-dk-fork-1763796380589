import { describe, expect, it } from "vitest";
import { buildCopyForAIText, copyInstructions } from "@/lib/copy-for-ai";
import { SIMPLE_LENORMAND_SYSTEM_PROMPT } from "@/lib/prompt-builder";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { RawDrawnCard } from "@/lib/lenormand-context";

const raw = (n: number): RawDrawnCard[] =>
  Array.from({ length: n }, (_, i) => ({ id: CARD_CATALOG[i].id, position: i }));

const COPY_WORK_ORDER =
  "Work order: first weigh the cards and formulate the reading. Then state the answer in one or two plain sentences, directly addressing the user's question. Present the Reading section first and the Answer section last.";

describe("Copy for AI: work order is plain prose, with no JSON reference", () => {
  it("carries the exact replacement work-order sentence", () => {
    expect(buildCopyForAIText("sentence-3", "Q", raw(3))).toContain(COPY_WORK_ORDER);
  });

  it("contains no JSON reference in the work-order line or the output format", () => {
    const text = buildCopyForAIText("grand-tableau", "Q", raw(36));
    const workOrder = text.split("\n").find((line) => line.startsWith("Work order:"))!;
    expect(workOrder).not.toMatch(/JSON|field order|in this order/i);
    const output = text.slice(text.indexOf("## Output format"));
    expect(output).not.toMatch(/return only one JSON object|field order/i);
    expect(output).toContain('"Reading"');
    expect(output).toContain('"Answer"');
  });

  it("states the reading before the answer in the exported prompt", () => {
    const text = buildCopyForAIText("sentence-5", "Q", raw(5));
    expect(text.indexOf("Present the Reading section first")).toBeGreaterThan(-1);
    expect(text.indexOf('headed "Reading"')).toBeLessThan(text.indexOf('heading "Answer"'));
  });

  it("changes only the work-order line: every other instruction line is unchanged", () => {
    const before = SIMPLE_LENORMAND_SYSTEM_PROMPT.split("\n");
    const after = copyInstructions(SIMPLE_LENORMAND_SYSTEM_PROMPT).split("\n");
    expect(after).toHaveLength(before.length);
    const changed = before.map((l, i) => [l, after[i]]).filter(([a, b]) => a !== b);
    expect(changed).toHaveLength(1);
    expect(changed[0][1]).toBe(COPY_WORK_ORDER);
  });

  it("leaves the API system prompt unchanged", () => {
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).toContain(
      'Work order: first weigh the cards and write the "reading".',
    );
    expect(SIMPLE_LENORMAND_SYSTEM_PROMPT).not.toContain("formulate the reading");
  });

  it("fails loudly if the work-order sentence disappears from the shared instructions", () => {
    expect(() => copyInstructions("no work order here")).toThrow(/work-order/);
  });
});
