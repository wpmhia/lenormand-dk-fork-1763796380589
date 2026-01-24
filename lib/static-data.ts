import { getCards, getCombinationMeaning } from "./data";

// Pre-compute all card combinations at build time for O(1) lookup
const STATIC_COMBINATIONS = new Map<string, string>();

export function buildStaticCombinations() {
  console.log("Building static card combinations...");
  const cards = getCards();
  
  // Pre-compute all 2-card combinations
  for (let i = 0; i < cards.length; i++) {
    for (let j = i; j < cards.length; j++) {
      const card1 = cards[i];
      const card2 = cards[j];
      const meaning = getCombinationMeaning(card1, card2);
      
      // Store both combinations (A+B and B+A)
      const key1 = `${card1.id}-${card2.id}`;
      const key2 = `${card2.id}-${card1.id}`;
      
      STATIC_COMBINATIONS.set(key1, meaning);
      STATIC_COMBINATIONS.set(key2, meaning);
    }
  }
  
  console.log(`Built ${STATIC_COMBINATIONS.size} static card combinations`);
  return STATIC_COMBINATIONS.size;
}

// Fast O(1) lookup instead of O(n) search
export function getStaticCombination(card1Id: number, card2Id: number): string | null {
  const key1 = `${card1Id}-${card2Id}`;
  const key2 = `${card2Id}-${card1Id}`;
  
  return STATIC_COMBINATIONS.get(key1) || STATIC_COMBINATIONS.get(key2) || null;
}

// Build static combinations immediately
if (typeof window === 'undefined') {
  buildStaticCombinations();
}