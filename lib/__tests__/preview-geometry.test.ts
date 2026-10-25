import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { getPreviewGeometry, gridColumnsClass } from "@/lib/preview-geometry";
import { buildClassicAnalysis } from "@/lib/classic-analysis";
import { CARD_CATALOG } from "@/lib/card-catalog";
import { SPREAD_DEFINITIONS, type SpreadId } from "@/lib/spread-definitions";
import { ClassicAnalysisWithAI } from "@/components/AIReadingDisplay";
import { TooltipProvider } from "@/components/ui/tooltip";

globalThis.React = React;

const cardsFor = (count: number) => CARD_CATALOG.slice(0, count).map((c, i) => ({ id: c.id, position: i }));

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

  it("uses the spread definition, not the viewport: every spread id resolves", () => {
    for (const id of Object.keys(SPREAD_DEFINITIONS) as SpreadId[]) {
      const def = SPREAD_DEFINITIONS[id];
      expect(getPreviewGeometry(id, def.cardCount), id).not.toBeNull();
    }
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

  it("maps columns to fixed Tailwind classes (no responsive prefixes)", () => {
    for (const c of [1, 3, 5, 9]) {
      expect(gridColumnsClass(c)).toBe(`grid-cols-${c}`);
    }
    expect(gridColumnsClass(9)).not.toMatch(/sm:|md:|lg:/);
  });
});
