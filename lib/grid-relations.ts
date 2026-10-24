/**
 * Deterministic card relations for a grid spread, computed from coordinates. The interpretation
 * model is given these facts and must not recalculate positions, neighbours or directions.
 *
 * Direction names are literal: "above" is one row up in the same column, "upperLeft" is one row up
 * and one column left. Relations never wrap from the end of one row to the start of the next.
 * A house relation (the card in position N belongs to the house of deck number N) is a separate
 * fact and is never a spatial neighbour.
 */

export type Direction =
  | "left"
  | "right"
  | "above"
  | "below"
  | "upperLeft"
  | "upperRight"
  | "lowerLeft"
  | "lowerRight";

export interface CellRelations {
  /** 1-based position in drawn order. */
  position: number;
  row: number;
  column: number;
  /** Cards that are directly adjacent, keyed by direction. A missing key means no card there. */
  neighbours: Partial<Record<Direction, { position: number; name: string }>>;
}

const DELTAS: Record<Direction, [number, number]> = {
  left: [0, -1],
  right: [0, 1],
  above: [-1, 0],
  below: [1, 0],
  upperLeft: [-1, -1],
  upperRight: [-1, 1],
  lowerLeft: [1, -1],
  lowerRight: [1, 1],
};

/** Relations for every cell of a grid with `rows` rows and `columns` columns, read row by row. */
export function gridRelations(names: string[], rows: number, columns: number): CellRelations[] {
  const at = (r: number, c: number) => r * columns + c;
  return names.map((name, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const neighbours: CellRelations["neighbours"] = {};
    for (const [direction, [dr, dc]] of Object.entries(DELTAS) as [Direction, [number, number]][]) {
      const r = row + dr;
      const c = column + dc;
      if (r < 0 || r >= rows || c < 0 || c >= columns) continue;
      const other = at(r, c);
      neighbours[direction] = { position: other + 1, name: names[other] };
    }
    return { position: index + 1, row: row + 1, column: column + 1, neighbours };
  });
}

/** One literal line per card: its cell, then each direction that has a neighbour. */
export function describeRelations(relations: CellRelations[], nameOf: (position: number) => string): string[] {
  const order: Direction[] = ["left", "right", "above", "below", "upperLeft", "upperRight", "lowerLeft", "lowerRight"];
  return relations.map((cell) => {
    const parts = order
      .filter((direction) => cell.neighbours[direction])
      .map((direction) => `${direction}: ${nameOf(cell.neighbours[direction]!.position)}`);
    return `${nameOf(cell.position)} (position ${cell.position}, row ${cell.row}, column ${cell.column}) — ${parts.join("; ") || "no adjacent cards"}`;
  });
}
