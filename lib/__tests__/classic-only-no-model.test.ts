import { describe, expect, it, vi, beforeEach } from "vitest";

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", () => ({ generateText }));

import { buildClassicAnalysis } from "@/lib/classic-analysis";
import { CARD_CATALOG } from "@/lib/card-catalog";
import type { ReadingCard } from "@/lib/types";

const drawn = (n: number): ReadingCard[] => Array.from({ length: n }, (_, i) => ({ id: CARD_CATALOG[i].id, position: i }));

describe("classical-only readings make zero DeepSeek requests", () => {
  beforeEach(() => generateText.mockReset());

  it.each([
    ["single-card", 1],
    ["sentence-3", 3],
    ["sentence-5", 5],
    ["comprehensive", 9],
    ["grand-tableau", 36],
  ] as const)("%s builds the classic analysis without any model call", (spreadId, count) => {
    buildClassicAnalysis(spreadId, "Will this move forward?", drawn(count));
    expect(generateText).toHaveBeenCalledTimes(0);
  });
});
