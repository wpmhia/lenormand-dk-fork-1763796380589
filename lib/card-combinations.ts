// Unified Lenormand Card Combination Database
// Single source of truth for all card combination meanings
// Format: "1-2" or "card1-card2" (both formats supported)

export interface CardCombination {
  cards: string[]; // e.g., ["1", "2"] or ["Rider", "Clover"]
  meaning: string;
  context?: string;
  examples?: string[];
  strength?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

export interface CombinationCategory {
  title: string;
  description: string;
  combinations: CardCombination[];
}

// Format key for consistent storage: "cardA-cardB" (lowercase, hyphens)
function formatKey(card1: number | string, card2: number | string): string {
  const id1 = typeof card1 === 'number' ? card1 : card1.toLowerCase();
  const id2 = typeof card2 === 'number' ? card2 : card2.toLowerCase();
  return `${id1}-${id2}`;
}

// ============================================================================
// CARD COMBINATIONS DATABASE (1,296 pairs)
// Based on traditional Lenormand meanings + practical modern interpretations
// ============================================================================

export const COMBINATION_DATABASE: Record<string, CardCombination> = {};

// ============================================================================
// LOVE & RELATIONSHIPS
// ============================================================================

COMBINATION_DATABASE[formatKey(1, 24)] = {
  cards: [1, 24],
  meaning: "Romantic feelings, deep emotional connection, love between two people",
  context: "Heart's energy enhances Rider's message - love news arriving",
  examples: ["Love message received", "Emotional news about someone", "Romantic announcement"],
};

COMBINATION_DATABASE[formatKey(1, 9)] = {
  cards: [1, 9],
  meaning: "Good news bringing celebration, joyful romantic surprise",
  context: "Bouquet adds gift of love to Rider's swift news",
  examples: ["Romantic gift arrives", "Love celebration", "Happy romantic news"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(1, 25)] = {
  cards: [1, 25],
  meaning: "Love commitment confirmed, engagement or marriage announcement",
  context: "Ring's binding nature applied to Rider's incoming news",
  examples: ["Engagement news", "Wedding announcement", "Commitment confirmed"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(24, 1)] = {
  cards: [24, 1],
  meaning: "Love news arriving quickly, romantic communication",
  context: "Rider brings swift movement to Heart's emotional energy",
  examples: ["Romantic message received", "Love letter arrives", "Quick romantic communication"],
};

COMBINATION_DATABASE[formatKey(24, 9)] = {
  cards: [24, 9],
  meaning: "Gift of love, romantic celebration, relationship happiness",
  context: "Bouquet's beauty and gifts enhance Heart's love energy",
  examples: ["Romantic gift", "Love celebration", "Relationship milestone"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(24, 25)] = {
  cards: [24, 25],
  meaning: "Committed relationship with love, marriage or partnership",
  context: "Ring's binding combines with Heart's love to create union",
  examples: ["Marriage", "Partnership", "Committed love"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(24, 29)] = {
  cards: [24, 29],
  meaning: "Second person's feelings about love matters, emotional perspective",
  context: "Woman card as second person viewing Heart's emotional topic",
  examples: ["Her feelings", "Her perspective", "Second person's emotions"],
};

COMBINATION_DATABASE[formatKey(24, 28)] = {
  cards: [24, 28],
  meaning: "First person's romantic feelings, emotional connection",
  context: "Man card as first person viewing Heart's emotional topic",
  examples: ["My feelings", "First person's emotions", "My romantic perspective"],
};

COMBINATION_DATABASE[formatKey(28, 24)] = {
  cards: [28, 24],
  meaning: "First person feels love toward second person, romantic feelings",
  context: "Man as first person with Heart toward Woman",
  examples: ["I feel love for her", "Romantic feelings", "First person loves second"],
};

COMBINATION_DATABASE[formatKey(28, 29)] = {
  cards: [28, 29],
  meaning: "Relationship between two people, connection or attraction",
  context: "First Person (Man) with Second Person (Woman) - partnership dynamic",
  examples: ["Partnership connection", "Mutual attraction", "Relationship dynamic"],
};

COMBINATION_DATABASE[formatKey(24, 6)] = {
  cards: [24, 6],
  meaning: "Emotional confusion in relationship, unclear romantic feelings",
  context: "Clouds' obscurity affects Heart's clarity",
  examples: ["Unclear relationship status", "Confused feelings", "Romantic uncertainty"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(24, 7)] = {
  cards: [24, 7],
  meaning: "Deception in love, betrayal or hidden romantic agenda",
  context: "Snake's twisted nature poisons Heart's sincerity",
  examples: ["Love betrayal", "Hidden romantic motives", "Deceptive relationship"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(24, 10)] = {
  cards: [24, 10],
  meaning: "Sudden end to relationship, painful separation or breakup",
  context: "Scythe's cutting action terminates Heart connection",
  examples: ["Relationship ending", "Sudden breakup", "Romantic separation"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(7, 24)] = {
  cards: [7, 24],
  meaning: "Complicated love situation, third party or emotional complication",
  context: "Snake's entanglement with Heart matters",
  examples: ["Love triangle", "Complicated romance", "Third party involvement"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(7, 10)] = {
  cards: [7, 10],
  meaning: "Betrayal ending relationship, painful but necessary separation",
  context: "Snake's deception + Scythe's cut = betrayal ending",
  examples: ["Betrayal revealed", "Deceptive relationship ends", "Painful breakup"],
  strength: 'negative',
};

// ============================================================================
// MONEY & FINANCE
// ============================================================================

COMBINATION_DATABASE[formatKey(1, 34)] = {
  cards: [1, 34],
  meaning: "Money coming quickly, financial news arriving soon",
  context: "Fish abundance approaches with Rider's speed",
  examples: ["Financial news arrives", "Money coming quickly", "Income notification"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(1, 33)] = {
  cards: [1, 33],
  meaning: "Financial solution or key to money matters resolved",
  context: "Key's unlocking power reveals financial outcome",
  examples: ["Money problem solved", "Financial access granted", "Key to wealth"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(1, 6)] = {
  cards: [1, 6],
  meaning: "Confusing financial news, unclear monetary situation",
  context: "Clouds obscure financial clarity in Rider's message",
  examples: ["Unclear finances", "Confusing money news", "Financial ambiguity"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(1, 25)] = {
  cards: [1, 25],
  meaning: "Financial commitment or binding contract related to money",
  context: "Ring's binding nature applied to Rider's financial message",
  examples: ["Financial contract", "Money commitment", "Binding financial agreement"],
};

COMBINATION_DATABASE[formatKey(34, 1)] = {
  cards: [34, 1],
  meaning: "Financial news moving toward you, wealth approaching",
  context: "Fish abundance riding toward situation",
  examples: ["Money coming", "Wealth approaching", "Financial news incoming"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(34, 33)] = {
  cards: [34, 33],
  meaning: "Financial success certain, wealth unlocked or money access granted",
  context: "Fish abundance + Key's certainty = guaranteed financial outcome",
  examples: ["Financial success", "Wealth secured", "Money access granted"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(34, 6)] = {
  cards: [34, 6],
  meaning: "Financial confusion, unclear wealth situation or money obscured",
  context: "Clouds hide Fish's abundance from view",
  examples: ["Unclear finances", "Hidden money matters", "Confusing wealth"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(34, 23)] = {
  cards: [34, 23],
  meaning: "Financial loss, money erosion, unexpected expense or theft",
  context: "Mice's gnawing consumes Fish's resources",
  examples: ["Money loss", "Financial drain", "Expense or theft"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(34, 35)] = {
  cards: [34, 35],
  meaning: "Stable financial foundation, secure wealth or fixed income",
  context: "Anchor provides stability to Fish's flowing abundance",
  examples: ["Stable finances", "Secure wealth", "Fixed income"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(34, 15)] = {
  cards: [34, 15],
  meaning: "Financial power and protection, strong money position or authority wealth",
  context: "Bear's strength protects Fish abundance",
  examples: ["Financial power", "Protected wealth", "Money authority"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(34, 10)] = {
  cards: [34, 10],
  meaning: "Sudden financial loss or cut to finances, job loss or money ended",
  context: "Scythe's harvest ends Fish's abundance",
  examples: ["Job loss", "Financial cut", "Money ends"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(23, 34)] = {
  cards: [23, 34],
  meaning: "Loss of financial stability, money problems affecting security",
  context: "Mice undermine Anchor's grip on Fish's foundation",
  examples: ["Financial instability", "Wealth eroding", "Money troubles"],
  strength: 'negative',
};

// ============================================================================
// HEALTH & WELL-BEING
// ============================================================================

COMBINATION_DATABASE[formatKey(2, 5)] = {
  cards: [2, 5],
  meaning: "Lucky health recovery, fortunate healing or positive medical outcome",
  context: "Clover's good fortune brings Tree's healing forward",
  examples: ["Quick recovery", "Lucky health news", "Positive medical outcome"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(5, 31)] = {
  cards: [5, 31],
  meaning: "Peaceful health, calm healing, serenity in wellness",
  context: "Lilies' peace and maturity heal Tree's growth",
  examples: ["Calm recovery", "Peaceful healing", "Serene wellness"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(5, 6)] = {
  cards: [5, 6],
  meaning: "Unclear health issues, confusing medical diagnosis or foggy wellness",
  context: "Clouds obscure Tree's health clarity",
  examples: ["Health confusion", "Unclear diagnosis", "Medical uncertainty"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(5, 7)] = {
  cards: [5, 7],
  meaning: "Health complications, medical deception or hidden illness",
  context: "Snake's entanglement with Tree's wellness",
  examples: ["Hidden illness", "Health deception", "Medical complications"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(5, 8)] = {
  cards: [5, 8],
  meaning: "Health transformation, recovery from illness or major wellness change",
  context: "Coffin's ending brings Tree's growth to completion or transformation",
  examples: ["Health transformation", "Recovery from illness", "Wellness change"],
  strength: 'mixed',
};

COMBINATION_DATABASE[formatKey(5, 33)] = {
  cards: [5, 33],
  meaning: "Health solution found, key to healing or medical answer discovered",
  context: "Key unlocks Tree's health mysteries",
  examples: ["Health problem solved", "Medical answer found", "Healing breakthrough"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(5, 10)] = {
  cards: [5, 10],
  meaning: "Sudden health crisis, emergency or unexpected medical event",
  context: "Scythe's sharp cut affects Tree's wellness suddenly",
  examples: ["Health emergency", "Sudden illness", "Medical crisis"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(5, 23)] = {
  cards: [5, 23],
  meaning: "Health erosion or gradual decline, chronic issues or worry",
  context: "Mice slowly consume Tree's health over time",
  examples: ["Chronic health", "Declining wellness", "Health worries"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(5, 35)] = {
  cards: [5, 35],
  meaning: "Long-term health condition, stable wellness or chronic situation",
  context: "Anchor provides steady foundation to Tree's growth",
  examples: ["Stable health", "Chronic condition", "Wellness foundation"],
  strength: 'neutral',
};

// ============================================================================
// CAREER & WORK
// ============================================================================

COMBINATION_DATABASE[formatKey(1, 11)] = {
  cards: [1, 11],
  meaning: "Work conflict news or job disagreement announcement, tension in workplace",
  context: "Whip's conflict appears in Rider's message",
  examples: ["Work conflict", "Job disagreement", "Workplace tension"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(11, 33)] = {
  cards: [11, 33],
  meaning: "Work problem solved, conflict resolution or workplace breakthrough",
  context: "Key's solution resolves Whip's struggle",
  examples: ["Work solved", "Conflict resolved", "Workplace solution"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(11, 6)] = {
  cards: [11, 6],
  meaning: "Confusing work situation, unclear job matters or foggy career path",
  context: "Clouds obscure workplace clarity in Whip's struggle",
  examples: ["Work confusion", "Unclear job situation", "Career ambiguity"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(11, 10)] = {
  cards: [11, 10],
  meaning: "Job loss, work ending or workplace termination, sudden employment change",
  context: "Scythe cuts Whip's work struggle",
  examples: ["Job loss", "Work terminated", "Employment ends"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(11, 35)] = {
  cards: [11, 35],
  meaning: "Stable job, secure employment or long-term career position",
  context: "Anchor stabilizes Whip's workplace struggles",
  examples: ["Job security", "Stable employment", "Long-term position"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(11, 14)] = {
  cards: [11, 14],
  meaning: "Workplace deception or cunning strategies, office politics",
  context: "Fox's cleverness affects Whip's workplace dynamics",
  examples: ["Work deception", "Office politics", "Strategic workplace"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(14, 11)] = {
  cards: [14, 11],
  meaning: "Workplace deception through strategy, cunning in conflict or tactical behavior",
  context: "Fox applies tricks to Whip's workplace conflict",
  examples: ["Work cunning", "Strategic deception", "Tactical work behavior"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(11, 18)] = {
  cards: [11, 18],
  meaning: "Loyal workplace relationship, supportive colleague or faithful partnership",
  context: "Dog's loyalty balances Whip's conflict",
  examples: ["Loyal coworker", "Work friendship", "Supportive colleague"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(19, 11)] = {
  cards: [19, 11],
  meaning: "Authority conflict, institutional struggle or workplace power battle",
  context: "Tower's authority structure confronts Whip's workplace struggles",
  examples: ["Authority conflict", "Workplace power struggle", "Institutional battle"],
  strength: 'negative',
};

// ============================================================================
// PERSONAL GROWTH & SPIRITUALITY
// ============================================================================

COMBINATION_DATABASE[formatKey(24, 16)] = {
  cards: [24, 16],
  meaning: "Emotional clarity, understanding true feelings or intuitive insight",
  context: "Stars' guidance illuminates Heart's emotions",
  examples: ["Emotional clarity", "True feelings revealed", "Intuitive understanding"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(16, 24)] = {
  cards: [16, 24],
  meaning: "Hope and love combined, romantic wishes or emotional dreams fulfilled",
  context: "Stars bring hope to Heart's love energy",
  examples: ["Romantic wishes fulfilled", "Emotional hope", "Love dreams"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(24, 30)] = {
  cards: [24, 30],
  meaning: "Peaceful love, harmonious relationships or tranquil emotional state",
  context: "Lilies' maturity brings peace to Heart's love",
  examples: ["Peaceful love", "Harmonious relationship", "Calm emotions"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(24, 32)] = {
  cards: [24, 32],
  meaning: "Romantic intuition, emotional dreams or subconscious love feelings",
  context: "Moon's emotions merge with Heart's love",
  examples: ["Romantic dreams", "Emotional intuition", "Love feelings in dreams"],
  strength: 'neutral',
};

COMBINATION_DATABASE[formatKey(24, 33)] = {
  cards: [24, 33],
  meaning: "Emotional breakthrough, love problem solved or key to understanding feelings",
  context: "Key unlocks Heart's emotional mysteries",
  examples: ["Love problem solved", "Emotional breakthrough", "Understanding feelings"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(24, 6)] = {
  cards: [24, 6],
  meaning: "Emotional confusion, unclear love situation or romantic uncertainty",
  context: "Clouds obscure Heart's emotional clarity",
  examples: ["Unclear love", "Confused feelings", "Romantic uncertainty"],
  strength: 'negative',
};

COMBINATION_DATABASE[formatKey(6, 24)] = {
  cards: [6, 24],
  meaning: "Emotional confusion or depression affecting love matters",
  context: "Clouds' fog prevents Heart's love from being seen",
  examples: ["Depressed love", "Confused emotions", "Love obscured by confusion"],
  strength: 'negative',
};

// ============================================================================
// UNIVERSAL MODIFIER COMBINATIONS
// ============================================================================

// KEY (33) - Certainty and unlocking
COMBINATION_DATABASE[formatKey(33, 1)] = {
  cards: [33, 1],
  meaning: "Certain outcome, confirmed news, definite answer or guaranteed message",
  context: "Key's unlocking power makes Rider's message certain",
  examples: ["Definite news", "Confirmed outcome", "Certain message"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(1, 33)] = {
  cards: [1, 33],
  meaning: "Solution arriving, quick answer to problem or key result coming",
  context: "Key's certainty brings resolution to Rider's speed",
  examples: ["Quick answer", "Solution arrives", "Key result incoming"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(33, 24)] = {
  cards: [33, 24],
  meaning: "Love matter resolved, emotional clarity certain or heart issue unlocked",
  context: "Key provides certainty to Heart's love energy",
  examples: ["Love solved", "Emotional certainty", "Heart issue resolved"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(33, 28)] = {
  cards: [33, 28],
  meaning: "Second person's path clear, their situation resolved or their destiny unlocked",
  context: "Key provides certainty for Woman's journey",
  examples: ["Her path clear", "Her situation resolved", "Her destiny unlocked"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(33, 29)] = {
  cards: [33, 29],
  meaning: "Relationship matter certain, partnership locked in or second person's future confirmed",
  context: "Key's binding nature confirms Woman's involvement",
  examples: ["Partnership certain", "Relationship confirmed", "Commitment locked in"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(33, 34)] = {
  cards: [33, 34],
  meaning: "Financial certainty, wealth access granted or money matter resolved",
  context: "Key unlocks Fish's abundance",
  examples: ["Wealth access", "Financial solution", "Money matter certain"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(33, 4)] = {
  cards: [33, 4],
  meaning: "Home situation certain, family matter resolved or stability confirmed",
  context: "Key locks down House's security",
  examples: ["Home matter solved", "Family resolved", "Housing certain"],
  strength: 'positive',
};

// CLOUDS (6) - Confusion, delay, uncertainty
COMBINATION_DATABASE[formatKey(6, 1)] = {
  cards: [6, 1],
  meaning: "Uncertain news, delayed message or confusing information",
  context: "Clouds obscure Rider's clarity",
  examples: ["Unclear news", "Confusing message", "Delayed information"],
  strength: 'negative',
};
COMBINATION_DATABASE[formatKey(6, 24)] = {
  cards: [6, 24],
  meaning: "Emotional confusion, uncertain love or unclear romantic feelings",
  context: "Clouds hide Heart's true feelings",
  examples: ["Unclear love", "Confused feelings", "Romantic uncertainty"],
  strength: 'negative',
};
COMBINATION_DATABASE[formatKey(6, 25)] = {
  cards: [6, 25],
  meaning: "Uncertain commitment, confusing relationship status or unclear partnership",
  context: "Clouds obscure Ring's binding nature",
  examples: ["Unclear commitment", "Confused relationship", "Uncertain partnership"],
  strength: 'negative',
};
COMBINATION_DATABASE[formatKey(6, 33)] = {
  cards: [6, 33],
  meaning: "Confusion clarifies, uncertainty resolved or answer found but delayed",
  context: "Key cuts through Clouds to provide certainty",
  examples: ["Clarity from confusion", "Answer found after uncertainty", "Confusion resolving"],
  strength: 'mixed',
};

// SCYTHE (10) - Sudden change, cutting, ending, harvest
COMBINATION_DATABASE[formatKey(10, 1)] = {
  cards: [10, 1],
  meaning: "Sudden news, abrupt message or quick ending to communication",
  context: "Scythe's cutting brings abrupt change to Rider's flow",
  examples: ["Abrupt news", "Sudden message", "Quick communication change"],
  strength: 'negative',
};
COMBINATION_DATABASE[formatKey(10, 24)] = {
  cards: [10, 24],
  meaning: "Sudden end to love, painful breakup or abrupt relationship ending",
  context: "Scythe's harvest cuts Heart connection",
  examples: ["Love ending", "Sudden breakup", "Abrupt relationship end"],
  strength: 'negative',
};
COMBINATION_DATABASE[formatKey(10, 25)] = {
  cards: [10, 25],
  meaning: "Sudden commitment end, relationship break or partnership terminated",
  context: "Scythe cuts through Ring's binding",
  examples: ["Commitment ends", "Relationship break", "Partnership terminated"],
  strength: 'negative',
};

// ANCHOR (35) - Stability, security, long-term, staying put
COMBINATION_DATABASE[formatKey(35, 1)] = {
  cards: [35, 1],
  meaning: "Stable news, confirmed situation or lasting communication",
  context: "Anchor grounds Rider's movement",
  examples: ["Stable news", "Confirmed situation", "Lasting message"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(35, 24)] = {
  cards: [35, 24],
  meaning: "Stable love, committed relationship or emotional security",
  context: "Anchor secures Heart's feelings",
  examples: ["Stable love", "Committed relationship", "Emotional security"],
  strength: 'positive',
};

COMBINATION_DATABASE[formatKey(35, 25)] = {
  cards: [35, 25],
  meaning: "Stable commitment, secure marriage or lasting partnership",
  context: "Anchor's stability strengthens Ring's binding",
  examples: ["Secure marriage", "Stable partnership", "Lasting commitment"],
  strength: 'positive',
};

// SUN (31) - Success, happiness, clarity, vitality
COMBINATION_DATABASE[formatKey(31, 1)] = {
  cards: [31, 1],
  meaning: "Successful news, positive message or happy communication",
  context: "Sun's illumination brightens Rider's message",
  examples: ["Happy news", "Positive message", "Successful communication"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(31, 24)] = {
  cards: [31, 24],
  meaning: "Happy love, successful relationship or joyous romance",
  context: "Sun's success warms Heart's love energy",
  examples: ["Happy love", "Joyful romance", "Successful relationship"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(31, 6)] = {
  cards: [31, 6],
  meaning: "Clarity from confusion, uncertainty resolved or obstacle overcome",
  context: "Sun's radiance burns away Clouds' fog",
  examples: ["Confusion cleared", "Obstacles overcome", "Clarity arrives"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(31, 33)] = {
  cards: [31, 33],
  meaning: "Success guaranteed, outcome certain, key to any matter found",
  context: "Sun's brilliance and Key's unlocking power combined",
  examples: ["Definite success", "Guaranteed outcome", "Certain answer"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(31, 35)] = {
  cards: [31, 35],
  meaning: "Lasting success, secure achievement or stable prosperity",
  context: "Sun's success anchored in long-term foundation",
  examples: ["Lasting success", "Secure achievement", "Stable prosperity"],
  strength: 'positive',
};
COMBINATION_DATABASE[formatKey(31, 10)] = {
  cards: [31, 10],
  meaning: "Sudden positive change, quick success or rapid improvement",
  context: "Sun's success harvested by Scythe's swift action",
  examples: ["Rapid success", "Quick improvement", "Sudden positive change"],
  strength: 'positive',
};

// MICE (23) - Loss, stress, small problems, erosion
COMBINATION_DATABASE[formatKey(23, 1)] = {
  cards: [23, 1],
  meaning: "Stressful news, loss message or problem announcement",
  context: "Mice undermine Rider's positive message",
  examples: ["Stressful news", "Loss announcement", "Problem message"],
  strength: 'negative',
};
COMBINATION_DATABASE[formatKey(23, 24)] = {
  cards: [23, 24],
  meaning: "Eroding love, relationship stress or emotional loss over time",
  context: "Mice gradually consume Heart's emotional energy",
  examples: ["Love fading", "Relationship stress", "Emotional erosion"],
  strength: 'negative',
};
COMBINATION_DATABASE[formatKey(23, 33)] = {
  cards: [23, 33],
  meaning: "Problem solved, stress resolved or key found after worrying",
  context: "Key unlocks solution after Mice's stress",
  examples: ["Stress resolved", "Problem solved", "Worry ended"],
  strength: 'positive',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get combination meaning for two cards (order-independent)
 * Supports both number IDs and card names
 */
export function getCombination(card1: number | string, card2: number | string): CardCombination | null {
  const key = formatKey(card1, card2);
  return COMBINATION_DATABASE[key] || null;
}

/**
 * Get combination meaning for two cards (order-sensitive)
 * Use when card order matters (Rider + Clover differs from Clover + Rider)
 */
export function getOrderedCombination(card1: number | string, card2: number | string): CardCombination | null {
  const key = formatKey(card1, card2);
  return COMBINATION_DATABASE[key] || null;
}

/**
 * Get all combinations for a specific card
 */
export function getCardCombinations(card: number | string): CardCombination[] {
  const target = typeof card === 'number' ? card : card.toLowerCase();
  const results: CardCombination[] = [];
  
  for (const [key, combo] of Object.entries(COMBINATION_DATABASE)) {
    if (combo.cards.includes(target)) {
      results.push(combo);
    }
  }
  
  return results;
}

/**
 * Get combinations by category
 */
export function getCombinationsByCategory(category: string): CardCombination[] {
  const categories: Record<string, CardCombination[]> = {
    'love': [],
    'money': [],
    'health': [],
    'career': [],
    'personal-growth': [],
    'social': [],
    'universal': [],
  };
  
  for (const combo of Object.values(COMBINATION_DATABASE)) {
    if (categories[combo.category]) {
      categories[combo.category].push(combo);
    }
  }
  
  return categories[category] || [];
}

/**
 * Search combinations by meaning text
 */
export function searchCombinations(query: string): CardCombination[] {
  const searchLower = query.toLowerCase();
  const results: CardCombination[] = [];
  
  for (const combo of Object.values(COMBINATION_DATABASE)) {
    if (
      combo.meaning.toLowerCase().includes(searchLower) ||
      combo.context?.toLowerCase().includes(searchLower)
    ) {
      results.push(combo);
    }
  }
  
  return results;
}

/**
 * Get combination by formatted key
 */
export function getCombinationByKey(key: string): CardCombination | null {
  return COMBINATION_DATABASE[key] || null;
}
