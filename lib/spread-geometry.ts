/**
 * Pure spread geometry.
 *
 * Everything here is arithmetic on a row-major grid: coordinates, orthogonal
 * neighbours, diagonal lines, knight's moves and distances between positions. There is no
 * meaning, weight, relevance or Lenormand rule in this file by design.
 *
 * The distinction the architecture rests on: "these two cards sit next to each other" is
 * a computer fact; "that means X" is the model's job. So this module may answer every
 * "what is where" question completely and must never answer a "so what" question at all.
 *
 * A Grand Tableau that reports only orthogonal neighbours leaves the model unable to see
 * a diagonal, a knight's move or the distance between two significators, which are all
 * facts a reader checks. Completeness is what makes the model able to decide for itself.
 */

export interface GeometryPair {
  a: number;
  b: number;
}

export interface DiagonalLine {
  /** Left-to-right order of the positions on this diagonal. */
  cells: number[];
  slope: 1 | -1;
}

export interface GridRelation {
  rowDelta: number;
  columnDelta: number;
  /** Chess-knight distance. */
  distance: number;
  label: string;
}

const KNIGHT_STEP_SET = [
  [1, 2],
  [1, -2],
  [2, 1],
  [2, -1],
] as const;

/** Orthogonal neighbours: every horizontal and vertical adjacency, in row-major order. */
export function adjacentPairs(rowCount: number, columnCount: number): GeometryPair[] {
  const pairs: GeometryPair[] = [];
  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount - 1; column++) {
      pairs.push({ a: row * columnCount + column, b: row * columnCount + column + 1 });
    }
  }
  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount - 1; row++) {
      pairs.push({ a: row * columnCount + column, b: (row + 1) * columnCount + column });
    }
  }
  return pairs;
}

/**
 * Every diagonal line of two or more cells, both slopes.
 *
 * A line is emitted once, starting from where it enters the grid, and is ordered
 * left-to-right so the model reads it the same way it reads the rows.
 */
export function diagonalLines(rowCount: number, columnCount: number): DiagonalLine[] {
  const lines: DiagonalLine[] = [];
  const seen = new Set<string>();

  for (const slope of [1, -1] as const) {
    for (let row = 0; row < rowCount; row++) {
      for (let column = 0; column < columnCount; column++) {
        // Walk only from where this diagonal enters the grid, so each line is emitted once.
        const previousRow = row - 1;
        const previousColumn = column - slope;
        const hasPredecessor =
          previousRow >= 0 && previousRow < rowCount && previousColumn >= 0 && previousColumn < columnCount;
        if (hasPredecessor) continue;

        const cells: number[] = [];
        let currentRow = row;
        let currentColumn = column;
        while (currentRow >= 0 && currentRow < rowCount && currentColumn >= 0 && currentColumn < columnCount) {
          cells.push(currentRow * columnCount + currentColumn);
          currentRow += 1;
          currentColumn += slope;
        }
        if (cells.length < 2) continue;

        const key = cells.slice().sort((left, right) => left - right).join(",");
        if (seen.has(key)) continue;
        seen.add(key);

        lines.push({ cells: slope === -1 ? cells.slice().reverse() : cells, slope });
      }
    }
  }

  return lines.sort((left, right) => left.cells[0] - right.cells[0] || left.slope - right.slope);
}

/** Every pair of cells a knight's move apart, in row-major order and never duplicated. */
export function knightPairs(rowCount: number, columnCount: number): GeometryPair[] {
  const pairs: GeometryPair[] = [];
  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount; column++) {
      const from = row * columnCount + column;
      for (const [rowStep, columnStep] of KNIGHT_STEP_SET) {
        const targetRow = row + rowStep;
        const targetColumn = column + columnStep;
        if (targetRow < 0 || targetRow >= rowCount || targetColumn < 0 || targetColumn >= columnCount) continue;
        const to = targetRow * columnCount + targetColumn;
        if (to > from) pairs.push({ a: from, b: to });
      }
    }
  }
  return pairs;
}

/**
 * The exact spatial relation between two positions. Descriptive only: it names the
 * geometry and never assigns it meaning.
 */
export function gridRelation(a: number, b: number, columnCount: number): GridRelation {
  const rowA = Math.floor(a / columnCount);
  const columnA = a % columnCount;
  const rowB = Math.floor(b / columnCount);
  const columnB = b % columnCount;
  const rowDelta = rowB - rowA;
  const columnDelta = columnB - columnA;
  const rowDistance = Math.abs(rowDelta);
  const columnDistance = Math.abs(columnDelta);
  const distance = Math.max(rowDistance, columnDistance);

  const isKnight = (rowDistance === 1 && columnDistance === 2) || (rowDistance === 2 && columnDistance === 1);

  let label: string;
  if (rowDistance === 0 && columnDistance === 0) label = "same position";
  else if (isKnight) label = "knight's move apart";
  else if (rowDistance === 0) label = columnDistance === 1 ? "immediately to the side" : `same row, ${columnDistance} columns apart`;
  else if (columnDistance === 0) label = rowDistance === 1 ? "immediately above or below" : `same column, ${rowDistance} rows apart`;
  else if (rowDistance === 1 && columnDistance === 1) label = "diagonal neighbour";
  else label = `${rowDistance} rows and ${columnDistance} columns apart`;

  return { rowDelta, columnDelta, distance, label };
}