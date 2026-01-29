import { getCombinationMeaning } from "./data";

const STATIC_COMBINATIONS = new Map<string, string>();

export function getStaticCombination(card1Id: number, card2Id: number): string | null {
  const key1 = `${card1Id}-${card2Id}`;
  const key2 = `${card2Id}-${card1Id}`;

  return STATIC_COMBINATIONS.get(key1) || STATIC_COMBINATIONS.get(key2) || null;
}
