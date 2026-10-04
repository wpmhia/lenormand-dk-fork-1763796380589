import { CARD_NAME_TO_ID } from "@/lib/card-catalog";
import type { ReadingContext } from "@/lib/reading-context";
import type { SimpleAnswer } from "@/lib/simple-answer";

/** A deterministic, server-selected set of cards the model may synthesize together. */
export interface VerifiedCluster {
  id: string;
  label: string;
  cards: ReadingContext["cards"];
  positions: number[];
  facts: string;
}

function makeCluster(
  context: ReadingContext,
  id: string,
  label: string,
  zeroBasedPositions: number[],
  facts = label,
): VerifiedCluster {
  const positions = [...new Set(zeroBasedPositions)]
    .filter((position) => position >= 0 && position < context.cards.length)
    .sort((a, b) => a - b);
  const cards = positions.map((position) => context.cards[position]);
  const cardFacts = cards.map((card, index) => `${card.name} (position ${positions[index] + 1})`).join(", ");
  return {
    id,
    label,
    cards,
    positions: positions.map((position) => position + 1),
    facts: `${facts}: ${cardFacts}`,
  };
}

function gridNeighbors(index: number, rows: number, columns: number): { index: number; direction: string }[] {
  const row = Math.floor(index / columns);
  const column = index % columns;
  const deltas = [
    [-1, -1, "upper-left"], [-1, 0, "above"], [-1, 1, "upper-right"],
    [0, -1, "left"], [0, 1, "right"],
    [1, -1, "lower-left"], [1, 0, "below"], [1, 1, "lower-right"],
  ] as const;
  return deltas.flatMap(([rowDelta, columnDelta, direction]) => {
    const neighborRow = row + rowDelta;
    const neighborColumn = column + columnDelta;
    if (neighborRow < 0 || neighborRow >= rows || neighborColumn < 0 || neighborColumn >= columns) return [];
    return [{ index: neighborRow * columns + neighborColumn, direction }];
  });
}

function personNeighborhood(context: ReadingContext, cardId: 28 | 29, rows: number, columns: number): VerifiedCluster | null {
  const focusIndex = context.cards.findIndex((card) => card.id === cardId);
  if (focusIndex < 0) return null;
  const focus = context.cards[focusIndex];
  const label = cardId === 28 ? "Man" : "Woman";
  const neighbors = gridNeighbors(focusIndex, rows, columns);
  const memberPositions = [focusIndex, ...neighbors.map((neighbor) => neighbor.index)];
  let houseDetail = "";

  if (context.layout.type === "grand-tableau") {
    const placement = context.layout.houses[focusIndex];
    if (placement) {
      const houseCardPosition = context.cards.findIndex((card) => card.id === placement.houseCardId);
      if (houseCardPosition >= 0) memberPositions.push(houseCardPosition);
      houseDetail = `; ${label} occupies the ${placement.houseName} house`;
    }
  }

  const neighborDetail = neighbors.length
    ? `; immediate neighbors: ${neighbors.map(({ index, direction }) => `${direction}: ${context.cards[index].name}`).join(", ")}`
    : "; no neighboring cards";
  return makeCluster(
    context,
    `person-${cardId}`,
    `${label} and verified surroundings`,
    memberPositions,
    `${label} at position ${focusIndex + 1}${houseDetail}${neighborDetail}`,
  );
}

/**
 * Compute a small set of positions the server can prove, without meanings or question
 * parsing. For a Grand Tableau this returns (when present) Man neighborhood, Woman
 * neighborhood, the central column, and the corners: four clusters maximum.
 */
export function buildVerifiedClusters(context: ReadingContext): VerifiedCluster[] {
  if (context.layout.type === "single" || context.cards.length === 1) {
    return [makeCluster(context, "single-card", "Single drawn card", [0])];
  }

  if (context.layout.type === "linear-sentence") {
    const clusters = Array.from({ length: context.cards.length - 1 }, (_, index) =>
      makeCluster(context, `line-${index + 1}-${index + 2}`, `Consecutive line segment ${index + 1}–${index + 2}`, [index, index + 1]),
    );
    if (context.cards.length > 2) {
      clusters.push(makeCluster(context, "complete-line", "Complete line in supplied order", context.cards.map((_, index) => index)));
    }
    return clusters;
  }

  const isGrandTableau = context.layout.type === "grand-tableau";
  const rows = isGrandTableau ? 4 : 3;
  const columns = isGrandTableau ? 9 : 3;
  const clusters: VerifiedCluster[] = [];
  for (const personId of [28, 29] as const) {
    const person = personNeighborhood(context, personId, rows, columns);
    if (person) clusters.push(person);
  }

  if (isGrandTableau) {
    clusters.push(makeCluster(context, "grand-center", "Grand Tableau central column", [4, 13, 22, 31]));
    clusters.push(makeCluster(context, "grand-corners", "Grand Tableau four corners", [0, 8, 27, 35]));
    return clusters;
  }

  clusters.push(makeCluster(context, "petit-center", "Petit Tableau centre and direct neighbors", [0, 1, 2, 3, 4, 5, 6, 7, 8]));
  clusters.push(makeCluster(context, "petit-corners", "Petit Tableau four corners", [0, 2, 6, 8]));
  return clusters;
}

export function formatVerifiedClusters(context: ReadingContext): string {
  return buildVerifiedClusters(context)
    .map((item) => `- ${item.facts}; cluster cards: ${item.cards.map((card) => card.name).join(" | ")}`)
    .join("\n");
}

/** A multi-card pattern must be a subset of one selected cluster; singleton facts are free. */
export function findPatternsOutsideVerifiedClusters(
  answer: SimpleAnswer,
  context: ReadingContext,
): { index: number; cards: string[] }[] {
  const drawnIds = new Set(context.cards.map((card) => card.id));
  const clusters = buildVerifiedClusters(context);
  return answer.patterns.flatMap((pattern, index) => {
    // Resolve against the drawn cards only: CARD_NAME_TO_ID has duplicate lowercase
    // keys (e.g. "coffin" is both Clouds and Coffin), so a global lookup is ambiguous.
    const ids = pattern.cards.map((name) => {
      const key = name.trim().toLowerCase();
      const match = context.cards.find((card) => card.name.toLowerCase() === key);
      return match?.id;
    });
    if (ids.some((id) => id === undefined || !drawnIds.has(id))) return [];
    if (ids.length === 1) return [];
    const belongsToOneCluster = clusters.some((candidate) => {
      const clusterIds = new Set(candidate.cards.map((card) => card.id));
      return ids.every((id) => id !== undefined && clusterIds.has(id));
    });
    return belongsToOneCluster ? [] : [{ index, cards: pattern.cards }];
  });
}
