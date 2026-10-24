import { getDefinition, type LayoutType } from "@/lib/spread-definitions";

/**
 * The fixed grid of the results-page card preview, derived from the spread's own layout and never
 * from the viewport width. The reading order is always the drawn order (index 0 first).
 *
 * - single: one card, one column.
 * - linear-sentence (3 and 5 cards): one row, left to right.
 * - petit-tableau (9 cards): a 3x3 grid, row by row.
 * - grand-tableau (36 cards): a 9-column by 4-row grid, row by row.
 */
export interface PreviewGeometry {
  layoutType: LayoutType;
  columns: number;
  rows: number;
  /** Wide grids scroll horizontally on small screens instead of reflowing into other rows. */
  scrollsOnMobile: boolean;
}

const GEOMETRY: Record<LayoutType, (count: number) => { columns: number; rows: number }> = {
  single: () => ({ columns: 1, rows: 1 }),
  "linear-sentence": (count) => ({ columns: count, rows: 1 }),
  "petit-tableau": () => ({ columns: 3, rows: 3 }),
  "grand-tableau": () => ({ columns: 9, rows: 4 }),
};

/**
 * Resolves the preview geometry for a spread. Returns null when the spread is unknown or its drawn
 * card count does not match the spread definition, so the caller can fall back to a plain list.
 */
export function getPreviewGeometry(spreadId: string, cardCount: number): PreviewGeometry | null {
  const definition = getDefinition(spreadId);
  if (!definition || definition.cardCount !== cardCount) return null;
  const { columns, rows } = GEOMETRY[definition.layoutType](cardCount);
  return {
    layoutType: definition.layoutType,
    columns,
    rows,
    scrollsOnMobile: columns > 3,
  };
}

/** Tailwind grid-column class for a fixed column count. Written out in full so the classes are kept. */
export function gridColumnsClass(columns: number): string {
  switch (columns) {
    case 1: return "grid-cols-1";
    case 3: return "grid-cols-3";
    case 5: return "grid-cols-5";
    case 9: return "grid-cols-9";
    default: return "grid-cols-3";
  }
}
