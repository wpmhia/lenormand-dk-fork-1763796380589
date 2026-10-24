/**
 * Deterministic combination engine for the classic analysis.
 *
 * Combinations are read only from a curated registry (`CURATED_PAIR_MEANINGS`). Every entry must
 * carry a source id and a review status. The engine never generates text: when no curated entry
 * exists for a pair, it reports the pair as unknown and the caller shows the individual card
 * meanings and positions instead.
 */

export type CombinationTone = "supportive" | "challenging" | "mixed";

export interface CuratedPairEntry {
  /** Card ids in the order they appear in the spread: first card, then second card. */
  first: number;
  second: number;
  /** Interpretation of this ordered pair, written as a short, non-predictive statement. */
  meaning: string;
  tone: CombinationTone;
  /** Source ids from public/data/card-meaning-sources.json that support this entry. */
  sourceIds: string[];
  /** Review status. Entries are used only when this is "source-cited". */
  reviewStatus: "source-cited" | "expert-reviewed";
}

/**
 * The curated registry. It is empty until an entry is cited to a source in
 * public/data/card-meaning-sources.json. An empty registry is the honest state: the engine then
 * reports pairs as unknown rather than inventing combination meanings.
 */
export const CURATED_PAIR_MEANINGS: CuratedPairEntry[] = [];

export interface PairLink {
  /** Position of the first card (1-based, in drawn order). */
  fromPosition: number;
  toPosition: number;
  fromId: number;
  toId: number;
  /** Why the pair was selected: adjacency or a structural line. */
  relation: string;
}

export interface ResolvedCombination {
  relation: string;
  fromPosition: number;
  toPosition: number;
  fromName: string;
  toName: string;
  meaning: string;
  tone: CombinationTone;
  sourceIds: string[];
}

export interface UnknownCombination {
  relation: string;
  fromPosition: number;
  toPosition: number;
  fromName: string;
  toName: string;
}

const KEY = (first: number, second: number) => `${first}>${second}`;

/** Index the registry by ordered pair. Reversed pairs are separate keys, never inferred. */
export function indexPairs(entries: CuratedPairEntry[]): Map<string, CuratedPairEntry> {
  const map = new Map<string, CuratedPairEntry>();
  for (const entry of entries) {
    if (entry.reviewStatus !== "source-cited" && entry.reviewStatus !== "expert-reviewed") continue;
    if (entry.sourceIds.length === 0) continue;
    map.set(KEY(entry.first, entry.second), entry);
  }
  return map;
}

/**
 * Resolves each candidate link against the registry. A link becomes a resolved combination only
 * when an entry exists for that exact ordered pair; every other link is reported as unknown, so
 * the output shows what the cards are without claiming a meaning.
 */
export function resolveLinks(
  links: PairLink[],
  cardNames: Map<number, string>,
  registry: CuratedPairEntry[] = CURATED_PAIR_MEANINGS,
): { resolved: ResolvedCombination[]; unknown: UnknownCombination[] } {
  const index = indexPairs(registry);
  const resolved: ResolvedCombination[] = [];
  const unknown: UnknownCombination[] = [];
  for (const link of links) {
    const fromName = cardNames.get(link.fromId) ?? `Card ${link.fromId}`;
    const toName = cardNames.get(link.toId) ?? `Card ${link.toId}`;
    const entry = index.get(KEY(link.fromId, link.toId));
    if (entry) {
      resolved.push({
        relation: link.relation,
        fromPosition: link.fromPosition,
        toPosition: link.toPosition,
        fromName,
        toName,
        meaning: entry.meaning,
        tone: entry.tone,
        sourceIds: entry.sourceIds,
      });
    } else {
      unknown.push({ relation: link.relation, fromPosition: link.fromPosition, toPosition: link.toPosition, fromName, toName });
    }
  }
  return { resolved, unknown };
}

/** Links for a line of cards read in order: each card with the next one. */
export function sequenceLinks(ids: number[]): PairLink[] {
  const links: PairLink[] = [];
  for (let i = 0; i < ids.length - 1; i++) {
    links.push({
      fromPosition: i + 1,
      toPosition: i + 2,
      fromId: ids[i],
      toId: ids[i + 1],
      relation: "next in the line",
    });
  }
  return links;
}

/**
 * Links for a grid of `rows` by `columns`, read as the spec requires: for a square centre grid,
 * the centre with its eight neighbours; then each row, each column and each diagonal in order.
 * Only real cells count; there is no wrap-around from one row to the next.
 */
export function gridLinks(ids: number[], rows: number, columns: number): PairLink[] {
  const links: PairLink[] = [];
  const at = (r: number, c: number) => r * columns + c;
  const add = (a: number, b: number, relation: string) =>
    links.push({ fromPosition: a + 1, toPosition: b + 1, fromId: ids[a], toId: ids[b], relation });

  if (rows === columns && rows % 2 === 1) {
    const centre = Math.floor(rows / 2);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        add(at(centre, centre), at(centre + dr, centre + dc), "centre with neighbour");
      }
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns - 1; c++) add(at(r, c), at(r, c + 1), `row ${r + 1}`);
  }
  for (let c = 0; c < columns; c++) {
    for (let r = 0; r < rows - 1; r++) add(at(r, c), at(r + 1, c), `column ${c + 1}`);
  }
  if (rows === columns) {
    for (let i = 0; i < rows - 1; i++) {
      add(at(i, i), at(i + 1, i + 1), "diagonal top-left to bottom-right");
      add(at(i, columns - 1 - i), at(i + 1, columns - 2 - i), "diagonal top-right to bottom-left");
    }
  }
  return links;
}

/** Keeps links relevant to the centre or to the significators, and drops the rest. */
export function selectMostRelevant(links: PairLink[], focusPositions: number[], limit: number): PairLink[] {
  const focus = new Set(focusPositions);
  const score = (link: PairLink) =>
    (focus.has(link.fromPosition) ? 2 : 0) + (focus.has(link.toPosition) ? 2 : 0) +
    (link.relation.startsWith("centre") ? 1 : 0);
  return [...links].sort((a, b) => score(b) - score(a)).slice(0, limit);
}
