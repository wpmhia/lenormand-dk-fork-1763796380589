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

describe("card preview markup: layout per spread size, desktop and mobile", () => {
  // Rendered through the real component so the markup is what the user gets.

  const html = (spread: SpreadId, count: number) =>
    renderToStaticMarkup(
      React.createElement(
        TooltipProvider,
        null,
        React.createElement(ClassicAnalysisWithAI, {
          analysis: buildClassicAnalysis(spread, "Q", cardsFor(count)),
          onStartAI: () => {},
        }),
      ),
    );

  it.each([
    ["single-card", 1, "grid-cols-1", "1", "1"],
    ["sentence-3", 3, "grid-cols-3", "3", "1"],
    ["sentence-5", 5, "grid-cols-5", "5", "1"],
    ["comprehensive", 9, "grid-cols-3", "3", "3"],
    ["grand-tableau", 36, "grid-cols-9", "9", "4"],
  ] as const)("%s renders %i cards in the fixed grid", (spread, count, cls, columns, rows) => {
    const markup = html(spread, count);
    expect(markup).toContain(cls);
    expect(markup).toContain(`data-columns="${columns}"`);
    expect(markup).toContain(`data-rows="${rows}"`);
    const preview = markup.slice(markup.indexOf('data-testid="card-preview"'), markup.indexOf("</ol>", markup.indexOf('data-testid="card-preview"')));
    expect(preview.match(/<li /g)?.length).toBe(count);
  });

  it("never uses viewport-responsive column classes", () => {
    for (const [spread, count] of [["single-card", 1], ["sentence-3", 3], ["sentence-5", 5], ["comprehensive", 9], ["grand-tableau", 36]] as const) {
      const markup = html(spread, count);
      expect(markup).not.toMatch(/grid-cols-2 sm:|sm:grid-cols-3|md:grid-cols-5/);
    }
  });

  it("keeps reading order: list items follow the drawn order", () => {
    const markup = html("grand-tableau", 36);
    const names = CARD_CATALOG.slice(0, 36).map((c) => c.name);
    let last = -1;
    for (const name of names) {
      const at = markup.indexOf(`>${name}<`, last + 1);
      expect(at, name).toBeGreaterThan(last);
      last = at;
    }
  });

  it("wide grids are a labelled, keyboard-focusable scroll region on mobile", () => {
    const markup = html("grand-tableau", 36);
    expect(markup).toContain('role="region"');
    expect(markup).toContain('aria-label="Drawn cards, horizontally scrollable"');
    expect(markup).toContain('tabindex="0"');
  });

  it("narrow grids are not a scroll region", () => {
    const markup = html("sentence-3", 3);
    expect(markup).not.toContain('role="region"');
    expect(markup).not.toContain('tabindex="0"');
  });
});
