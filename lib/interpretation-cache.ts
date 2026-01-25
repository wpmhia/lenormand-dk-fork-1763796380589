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

// NO CACHING for true randomness - fortune telling requires unique readings every time
export function generateCacheKey(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  questionCategory: string
): string | null {
  // FORTUNE TELLING PRINCIPLE: Every reading must be unique
  // Return null to bypass cache completely
  return null;
}

export function categorizeQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  for (const [category, keywords] of Object.entries(QUESTION_CATEGORIES)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      return category;
    }
  }
  
  return 'GENERAL';
}

export function generateUniqueInterpretation(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  questionCategory: string,
  question: string
): StaticInterpretation | null {
  // Generate truly unique reading based on divinatory principles
  
  // Create unique seed for this specific reading moment
  const readingSeed = generateDivinatorySeed(cards, spreadId, questionCategory, question);
  
  // For single cards - provide varied interpretations
  if (cards.length === 1) {
    return generateSingleCardReading(cards[0], questionCategory, readingSeed);
  }
  
  // For 2-card combinations - use dynamic variation
  if (cards.length === 2) {
    return generateTwoCardReading(cards, questionCategory, readingSeed);
  }
  
  // For 3+ cards - synthesize unique reading
  if (cards.length >= 3) {
    return generateMultiCardReading(cards, spreadId, questionCategory, readingSeed);
  }
  
  return null;
}

function generateDivinatorySeed(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  questionCategory: string,
  question: string
): number {
  // Create unique seed based on precise moment (millisecond precision)
  const preciseTime = Date.now() + Math.random() * 1000;
  
  // Include card energies, question essence, and divinatory intention
  const cardEnergies = cards.reduce((sum, card) => sum + card.id * 7, 0);
  const questionHash = question.split('').reduce((hash, char) => hash + char.charCodeAt(0) * 3, 0);
  const spreadHash = spreadId.split('').reduce((hash, char) => hash + char.charCodeAt(0) * 5, 0);
  
  // Combine with current cosmic energy
  const cosmicFactor = (preciseTime % 86400000) / 86400000; // Daily position
  
  return Math.floor((cardEnergies + questionHash + spreadHash) * cosmicFactor) % 10000;
}

function generateSingleCardReading(
  card: { id: number; name: string },
  category: string,
  seed: number
): StaticInterpretation {
  const cardData = cardsData.find((c: any) => c.id === card.id);
  if (!cardData) {
    return {
      meaning: 'Unknown card energy',
      context: 'Divinatory mystery',
      examples: [''],
      category,
      strength: 'unknown',
      source: 'static'
    };
  }
  
  // Generate multiple meaning variants based on seed
  const meaningVariants = [
    cardData.uprightMeaning,
    ...(cardData.combos?.slice(0, 3).map((combo: any) => combo.meaning) || []),
    `The ${cardData.name} brings ${cardData.keywords?.[seed % (cardData.keywords?.length || 1)]} energy`,
    `${cardData.name} signals ${cardData.number}${getNumberWord(cardData.number)} change`
  ].filter(Boolean);
  
  const selectedMeaning = meaningVariants[seed % meaningVariants.length];
  
  // Generate context based on reading energy
  const contexts = [
    `In this moment, ${cardData.name} speaks directly to your ${category.toLowerCase()} journey`,
    `The divinatory energy of ${cardData.name} illuminates your path`,
    `${cardData.name} emerges with purpose for your ${category.toLowerCase()} concerns`,
    `The cards reveal ${cardData.name} as your guiding light`
  ];
  
  const selectedContext = contexts[seed % contexts.length];
  
  return {
    meaning: selectedMeaning,
    context: selectedContext,
    examples: [selectedMeaning],
    category,
    strength: ['gentle', 'strong', 'moderate', 'intense'][seed % 4],
    source: 'static'
  };
}

function generateTwoCardReading(
  cards: Array<{ id: number; name: string }>,
  category: string,
  seed: number
): StaticInterpretation {
  const [card1, card2] = cards;
  
  // Check both order combinations for different energies
  const combinationKey1 = `${card1.id}-${card2.id}`;
  const combinationKey2 = `${card2.id}-${card1.id}`;
  
  const combination = cardCombinationsData[combinationKey1] || cardCombinationsData[combinationKey2];
  
  // Generate multiple interpretation layers
  const interpretations: string[] = [];
  
  if (combination) {
    interpretations.push(combination.meaning);
    interpretations.push(combination.context);
  }
  
  // Add card-specific energies
  const card1Data = cardsData.find((c: any) => c.id === card1.id);
  const card2Data = cardsData.find((c: any) => c.id === card2.id);
  
  if (card1Data?.uprightMeaning) {
    interpretations.push(card1Data.uprightMeaning);
  }
  
  if (card2Data?.uprightMeaning) {
    interpretations.push(card2Data.uprightMeaning);
  }
  
  // Select and blend based on seed
  const primaryInterpretation = interpretations[seed % interpretations.length];
  
  // Generate contextual narrative
  const narratives = [
    `${card1.name} meets ${card2.name}: ${primaryInterpretation}`,
    `The journey from ${card1.name} to ${card2.name} reveals ${primaryInterpretation}`,
    `${card1.name} and ${card2.name} dance together: ${primaryInterpretation}`,
    `${card1.name}'s energy flows into ${card2.name}: ${primaryInterpretation}`
  ];
  
  const narrative = narratives[seed % narratives.length];
  
  return {
    meaning: narrative,
    context: `${card1.name} → ${card2.name} dynamic interaction`,
    examples: [primaryInterpretation],
    category,
    strength: ['harmonious', 'challenging', 'transformative', 'balanced'][seed % 4],
    source: 'static'
  };
}

function generateMultiCardReading(
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  category: string,
  seed: number
): StaticInterpretation {
  // Generate complex reading with multiple layers
  
  // Get individual card energies
  const cardMeanings = cards.map((card, index) => {
    const cardData = cardsData.find((c: any) => c.id === card.id);
    if (!cardData) return '';
    
    const meaningOptions = [
      cardData.uprightMeaning,
      cardData.keywords?.[seed % (cardData.keywords?.length || 1)] || '',
      `${cardData.name} brings transformation`
    ];
    
    return meaningOptions[seed % meaningOptions.length];
  }).filter(Boolean);
  
  // Get pair interactions
  const interactions: string[] = [];
  for (let i = 0; i < cards.length - 1; i++) {
    const pairKey = `${cards[i].id}-${cards[i + 1].id}`;
    const reversePairKey = `${cards[i + 1].id}-${cards[i].id}`;
    const combination = cardCombinationsData[pairKey] || cardCombinationsData[reversePairKey];
    
    if (combination) {
      interactions.push(combination.meaning);
    }
  }
  
  // Synthesize unique narrative based on seed
  const narrativeStyles = [
    () => `The cards reveal: ${cardMeanings.join('; ')}. Their dance creates: ${interactions.join('; ')}.`,
    () => `Your journey unfolds through: ${cardMeanings.join(' → ')}. The energies combine: ${interactions.join(' + ')}.`,
    () => `Divinatory message: ${cardMeanings.join(', ')}. When these energies meet: ${interactions.join(', ')}.`,
    () => `The spread speaks: ${cardMeanings.join(' and ')}. Their collective wisdom: ${interactions.join(' or ')}.`
  ];
  
  const selectedStyle = narrativeStyles[seed % narrativeStyles.length];
  const interpretation = selectedStyle();
  
  // Generate spread-specific context
  const contexts = [
    `This ${spreadId} spread illuminates your ${category.toLowerCase()} path`,
    `Through the ${spreadId} layout, ${category.toLowerCase()} truths emerge`,
    `The ${spreadId} formation channels ${category.toLowerCase()} guidance`,
    `${category} wisdom flows through this ${spreadId} arrangement`
  ];
  
  const context = contexts[seed % contexts.length];
  
  return {
    meaning: interpretation,
    context: context,
    examples: cardMeanings.slice(0, 2),
    category,
    strength: ['profound', 'clear', 'mysterious', 'guiding'][seed % 4],
    source: 'static'
  };
}

function getNumberWord(num: number): string {
  const words = ['', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th', 'th'];
  return words[num] || 'th';
}

// Cache functions (minimal usage for unique readings)
export function getCachedReading(cacheKey: string): CachedReading | null {
  // For fortune telling, we only cache AI responses that were expensive
  // Static interpretations are always generated fresh
  return null;
}

export function setCachedReading(
  cacheKey: string,
  interpretation: string,
  source: 'static' | 'ai' = 'static'
): void {
  // Only cache expensive AI responses, not static divinatory readings
  if (source === 'ai') {
    // AI cache with short TTL (1 hour) for expensive computations
    const memoryCache = new Map<string, CachedReading>();
    memoryCache.set(cacheKey, {
      interpretation,
      timestamp: Date.now(),
      source,
      ttl: 60 * 60 * 1000 // 1 hour
    });
  }
}

export function clearExpiredCache(): void {
  // Minimal cache management for AI responses only
}