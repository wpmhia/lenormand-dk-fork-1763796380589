import cardsData from './data/cards.json';
import cardCombinationsData from './data/card-combinations.json';

// Question categories for better matching
export const QUESTION_CATEGORIES = {
  LOVE: ['love', 'relationship', 'partner', 'romance', 'heart', 'feelings', 'emotion', 'dating'],
  CAREER: ['career', 'job', 'work', 'business', 'money', 'finance', 'professional', 'success'],
  HEALTH: ['health', 'healing', 'body', 'wellness', 'medical', 'fitness'],
  GENERAL: ['what', 'how', 'when', 'where', 'advice', 'guidance', 'future', 'outcome']
} as const;

export interface StaticInterpretation {
  meaning: string;
  context: string;
  examples: string[];
  category: string;
  strength: string;
  source: 'static' | 'generated';
}

export interface CachedReading {
  interpretation: string;
  timestamp: number;
  source: 'static' | 'ai';
  ttl: number;
}

// In-memory cache with TTL
const memoryCache = new Map<string, CachedReading>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function categorizeQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  for (const [category, keywords] of Object.entries(QUESTION_CATEGORIES)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      return category;
    }
  }
  
  return 'GENERAL';
}

export function generateCacheKey(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  questionCategory: string
): string {
  // Sort card IDs for deterministic key
  const sortedCardIds = cards.map(c => c.id).sort((a, b) => a - b);
  const cardSignature = sortedCardIds.join('-');
  return `${spreadId}-${cardSignature}-${questionCategory}`;
}

export function getStaticInterpretation(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  questionCategory: string
): StaticInterpretation | null {
  // For single cards
  if (cards.length === 1) {
    const card = cardsData.find((c: any) => c.id === cards[0].id);
    if (card) {
      return {
        meaning: card.uprightMeaning || '',
        context: `Single ${card.name} card in ${questionCategory.toLowerCase()} context`,
        examples: [card.uprightMeaning || ''],
        category: questionCategory,
        strength: 'neutral',
        source: 'static'
      };
    }
  }

  // For 2-card combinations - check our pre-combinations
  if (cards.length === 2) {
    const [card1, card2] = cards;
    const combinationKey1 = `${card1.id}-${card2.id}`;
    const combinationKey2 = `${card2.id}-${card1.id}`;
    
    const combination = cardCombinationsData[combinationKey1] || cardCombinationsData[combinationKey2];
    
    if (combination) {
      // Filter by category relevance
      if (isCategoryRelevant(combination.category, questionCategory)) {
        return {
          ...combination,
          source: 'static'
        };
      }
    }
  }

  // For 3+ card combinations, use synthesis approach
  if (cards.length >= 3) {
    return synthesizeMultiCardInterpretation(cards, spreadId, questionCategory);
  }

  return null;
}

export function synthesizeMultiCardInterpretation(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  questionCategory: string
): StaticInterpretation | null {
  // Build interpretation from individual card meanings and pair combinations
  let interpretation = '';
  let contexts: string[] = [];
  let examples: string[] = [];

  // Get individual card meanings
  const cardMeanings = cards.map(card => {
    const cardData = cardsData.find((c: any) => c.id === card.id);
    return cardData ? cardData.uprightMeaning : '';
  }).filter(Boolean);

  // Get pair combinations for adjacent cards
  const pairMeanings: string[] = [];
  for (let i = 0; i < cards.length - 1; i++) {
    const card1 = cards[i];
    const card2 = cards[i + 1];
    const pairKey1 = `${card1.id}-${card2.id}`;
    const pairKey2 = `${card2.id}-${card1.id}`;
    
    const combination = cardCombinationsData[pairKey1] || cardCombinationsData[pairKey2];
    if (combination && isCategoryRelevant(combination.category, questionCategory)) {
      pairMeanings.push(combination.meaning);
      contexts.push(combination.context);
      examples.push(...combination.examples.slice(0, 1)); // Take first example
    }
  }

  // Synthesize interpretation
  if (cardMeanings.length > 0) {
    interpretation += `Key cards: ${cardMeanings.join('; ')}. `;
  }
  
  if (pairMeanings.length > 0) {
    interpretation += `Card interactions: ${pairMeanings.join('; ')}. `;
  }

  // Add context-specific guidance
  interpretation += getQuestionSpecificGuidance(questionCategory, cards);

  return {
    meaning: interpretation,
    context: contexts.join('; '),
    examples: examples.slice(0, 3),
    category: questionCategory,
    strength: 'moderate',
    source: 'static'
  };
}

function isCategoryRelevant(combinationCategory: string, questionCategory: string): boolean {
  if (combinationCategory === questionCategory.toLowerCase()) return true;
  if (questionCategory === 'GENERAL') return true;
  
  // Allow cross-category matching for broader relevance
  const relevantCategories = {
    'LOVE': ['love', 'relationships'],
    'CAREER': ['career', 'finance', 'success'],
    'HEALTH': ['health', 'wellness'],
    'GENERAL': ['love', 'career', 'health', 'general']
  };

  return relevantCategories[questionCategory as keyof typeof relevantCategories]?.includes(combinationCategory) || false;
}

function getQuestionSpecificGuidance(category: string, cards: Array<{ id: number; name: string }>): string {
  const guidance = {
    LOVE: 'Focus on emotional connections and relationship dynamics. The cards suggest patterns in your romantic journey.',
    CAREER: 'Consider professional opportunities and financial growth. The cards point to career development and success.',
    HEALTH: 'Pay attention to physical and emotional wellness. The cards highlight areas needing care and attention.',
    GENERAL: 'Look for broader life patterns and opportunities for growth. The cards offer guidance for your path forward.'
  };

  return guidance[category as keyof typeof guidance] || guidance.GENERAL;
}

// Memory cache functions
export function getCachedReading(cacheKey: string): CachedReading | null {
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached;
  }
  
  // Remove expired cache entry
  if (cached) {
    memoryCache.delete(cacheKey);
  }
  
  return null;
}

export function setCachedReading(
  cacheKey: string,
  interpretation: string,
  source: 'static' | 'ai' = 'static'
): void {
  memoryCache.set(cacheKey, {
    interpretation,
    timestamp: Date.now(),
    source,
    ttl: CACHE_TTL
  });
}

export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, cached] of memoryCache.entries()) {
    if (now - cached.timestamp >= cached.ttl) {
      memoryCache.delete(key);
    }
  }
}

// Cleanup cache periodically
setInterval(clearExpiredCache, 60 * 60 * 1000); // Every hour