import { describe, expect, it } from "vitest";
import { getPreviewGeometry } from "@/lib/preview-geometry";
import { SPREAD_DEFINITIONS, type SpreadId } from "@/lib/spread-definitions";

describe("preview geometry: fixed per spread, derived from the spread definition", () => {
  it.each([
    ["single-card", 1, 1, 1, "single"],
    ["daily-card", 1, 1, 1, "single"],
    ["sentence-3", 3, 3, 1, "linear-sentence"],
    ["sentence-5", 5, 5, 1, "linear-sentence"],
    ["comprehensive", 9, 3, 3, "petit-tableau"],
    ["grand-tableau", 36, 9, 4, "grand-tableau"],
  ] as const)("%s (%i cards) is %i columns x %i rows", (id, count, columns, rows, layout) => {
    const g = getPreviewGeometry(id, count)!;
    expect(g.columns).toBe(columns);
    expect(g.rows).toBe(rows);
    expect(g.layoutType).toBe(layout);
    expect(g.columns * g.rows).toBe(count);
  });

  it("returns null for an unknown spread or a mismatched card count (plain fallback)", () => {
    expect(getPreviewGeometry("nope", 3)).toBeNull();
    expect(getPreviewGeometry("sentence-3", 5)).toBeNull();
  });

  it("only the wide grids scroll on mobile; 9 and 36 cards never reflow", () => {
    expect(getPreviewGeometry("sentence-3", 3)!.scrollsOnMobile).toBe(false);
    expect(getPreviewGeometry("comprehensive", 9)!.scrollsOnMobile).toBe(false);
    expect(getPreviewGeometry("sentence-5", 5)!.scrollsOnMobile).toBe(true);
    expect(getPreviewGeometry("grand-tableau", 36)!.scrollsOnMobile).toBe(true);
  });
});
