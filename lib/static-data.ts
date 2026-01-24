import { getCombinationMeaning } from "./data";

// Pre-compute all card combinations at build time for O(1) lookup
const STATIC_COMBINATIONS = new Map<string, string>();

// Fast O(1) lookup instead of O(n) search
export function getStaticCombination(card1Id: number, card2Id: number): string | null {
  const key1 = `${card1Id}-${card2Id}`;
  const key2 = `${card2Id}-${card1Id}`;
  
  return STATIC_COMBINATIONS.get(key1) || STATIC_COMBINATIONS.get(key2) || null;
}

// Initialize combinations when needed
export async function initializeStaticCombinations() {
  if (STATIC_COMBINATIONS.size > 0) return; // Already initialized
  
  try {
    // This is a placeholder - in production, this would be hydrated from a pre-built file
    // For now, we rely on the dynamic getCombinationMeaning function
  } catch (error) {
    console.error("Error initializing static combinations:", error);
  }
}
