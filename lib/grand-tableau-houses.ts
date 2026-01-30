// Traditional Grand Tableau House Meanings
// 36-house overlay system for Grand Tableau readings
// Each position (1-36) has a traditional house meaning that modifies the card in that position

export interface HouseMeaning {
  position: number;
  name: string;
  meaning: string;
  timing: string;
  special?: string;
}

// ============================================================================
// HOUSE MEANINGS DATABASE
// Based on traditional Lenormand methodology and historical sources
// ============================================================================

export const GRAND_TABLEAU_HOUSES: Record<number, HouseMeaning> = {
  1: {
    position: 1,
    name: "The Rider",
    meaning:
      "News arriving quickly, messages from afar, swift movement approaching",
    timing: "Days or weeks (Rider's speed)",
    special: "Speed and initiative - sets tempo of reading",
  },
  2: {
    position: 2,
    name: "The Clover",
    meaning: "Small luck and opportunity, brief blessing or chance encounter",
    timing: "Days to week (temporary)",
    special: "Fortune's gift - often the first positive sign",
  },
  3: {
    position: 3,
    name: "The Ship",
    meaning: "Long journeys, foreign matters, travel abroad or distance",
    timing: "Weeks to months (Ship's journey time)",
    special: "Distance and separation from querent",
  },
  4: {
    position: 4,
    name: "The House",
    meaning: "Home, family, property, stability, foundation, domestic matters",
    timing: "Months to years (House's stability)",
    special: "Foundation and security of the entire reading",
  },
  5: {
    position: 5,
    name: "The Tree",
    meaning: "Health, growth, roots, family heritage, longevity and well-being",
    timing: "Months to years (Tree's slow growth)",
    special: "Health indicator and generational matters",
  },
  6: {
    position: 6,
    name: "The Clouds",
    meaning: "Confusion, uncertainty, doubt, hidden information, mental fog",
    timing: "Unclear (Clouds obscure timing)",
    special: "Indicator of clarity needed in reading",
  },
  7: {
    position: 7,
    name: "The Snake",
    meaning:
      "Betrayal, complication, deception, wisdom through adversity, winding path",
    timing: "Delayed (Snake's twisting nature)",
    special: "Warning card - often negative but can show transformation",
  },
  8: {
    position: 8,
    name: "The Coffin",
    meaning:
      "Endings, transformation, closure, death of old situation, release",
    timing: "End of current cycle",
    special: "Definitive marker - signals major change is complete",
  },
  9: {
    position: 9,
    name: "The Bouquet",
    meaning: "Gifts, celebration, beauty, gratitude, recognition, joy",
    timing: "Soon (Bouquet's generosity)",
    special: "Reward and appreciation indicator",
  },
  10: {
    position: 10,
    name: "The Scythe",
    meaning:
      "Sudden change, cutting ties, harvesting results, decisions, endings",
    timing: "Immediate (Scythe's sudden action)",
    special: "Card of action - requires immediate attention",
  },
  11: {
    position: 11,
    name: "The Whip",
    meaning: "Conflict, arguments, discipline, repetitive patterns, passion",
    timing: "Ongoing cycles (Whip's repeated nature)",
    special: "Indicator of struggle or tension in reading",
  },
  12: {
    position: 12,
    name: "The Birds",
    meaning:
      "Communication, gossip, conversation, pairs, anxiety, multiple messages",
    timing: "Quick conversations",
    special: "Nervousness and information overload indicator",
  },
  13: {
    position: 13,
    name: "The Child",
    meaning:
      "New beginnings, innocence, youth, small things, potential, creativity",
    timing: "Beginning of new cycle",
    special: "Fresh start and creative potential",
  },
  14: {
    position: 14,
    name: "The Fox",
    meaning: "Cunning, deception, strategy, workplace matters, caution needed",
    timing: "Strategic delay (Fox's planning nature)",
    special: "Warning card - requires caution and verification",
  },
  15: {
    position: 15,
    name: "The Bear",
    meaning: "Strength, power, protection, authority, mother figure, wealth",
    timing: "Powerful and controlling",
    special: "Card of power - often indicates important person or matter",
  },
  16: {
    position: 16,
    name: "The Stars",
    meaning: "Hope, wishes, dreams, intuition, spiritual guidance, aspirations",
    timing: "Evenings and nights (Stars' celestial nature)",
    special: "Dreams and desires indicator",
  },
  17: {
    position: 17,
    name: "The Stork",
    meaning: "Change, movement, new life, transition, progress, relocation",
    timing: "Change coming soon",
    special: "Indicator of transformation and movement",
  },
  18: {
    position: 18,
    name: "The Dog",
    meaning:
      "Loyalty, friendship, trust, faithful companion, protection, devotion",
    timing: "Loyal and steadfast",
    special: "Reliability and support indicator",
  },
  19: {
    position: 19,
    name: "The Tower",
    meaning:
      "Authority, government, institutions, isolation, structure, rules, official matters",
    timing: "Institutional pace",
    special:
      "Hierarchical and distancing - often indicates separation or formal matters",
  },
  20: {
    position: 20,
    name: "The Garden",
    meaning:
      "Public life, community, social events, gatherings, public recognition",
    timing: "Social timing (depends on event)",
    special: "Outward-facing and social indicator",
  },
  21: {
    position: 21,
    name: "The Mountain",
    meaning: "Obstacles, challenges, delay, perseverance, height, difficulty",
    timing: "Delayed (Mountain blocks progress)",
    special: "Primary obstacle card - reading's main challenge",
  },
  22: {
    position: 22,
    name: "The Crossroads",
    meaning:
      "Choices, decisions, alternatives, multiple paths, options, uncertainty",
    timing: "Decision point (imminent)",
    special: "Fork in the road - requires clear choice",
  },
  23: {
    position: 23,
    name: "The Mice",
    meaning: "Loss, stress, small problems, erosion, theft, anxiety",
    timing: "Gradual erosion",
    special: "Problem card - gradual decline if not addressed",
  },
  24: {
    position: 24,
    name: "The Heart",
    meaning:
      "Love, emotions, relationships, feelings, romantic matters, passions",
    timing: "Emotional reality",
    special: "Heart of the reading - central emotional core",
  },
  25: {
    position: 25,
    name: "The Ring",
    meaning:
      "Commitment, contracts, cycles, partnership, marriage, binding agreements",
    timing: "Cyclical or contracted",
    special: "Binding and commitment indicator",
  },
  26: {
    position: 26,
    name: "The Book",
    meaning:
      "Secrets, knowledge, learning, hidden information, education, documents",
    timing: "Hidden until revealed",
    special: "Mystery card - information waiting to be discovered",
  },
  27: {
    position: 27,
    name: "The Letter",
    meaning:
      "Communication, documents, news in writing, official correspondence",
    timing: "Written or formal",
    special: "Concrete information and documentation",
  },
  28: {
    position: 28,
    name: "The Man",
    meaning:
      "First Person, primary subject, querent, central figure (not gender-specific)",
    timing: "Present moment (the here and now)",
    special: "Central significator - the reading revolves around this position",
  },
  29: {
    position: 29,
    name: "The Woman",
    meaning:
      "Second Person, other key figure, related person, secondary perspective",
    timing: "Present moment (her perspective)",
    special: "Secondary significator - the other key person in the reading",
  },
  30: {
    position: 30,
    name: "The Lilies",
    meaning: "Peace, harmony, purity, wisdom, maturity, ethics, sexual matters",
    timing: "Peaceful and elder (Lilies' maturity)",
    special: "Wisdom and tranquility indicator",
  },
  31: {
    position: 31,
    name: "The Sun",
    meaning:
      "Success, happiness, clarity, vitality, victory, achievement, illumination",
    timing: "Daytime and soon (Sun's radiance)",
    special: "Most positive card - brings light to darkness",
  },
  32: {
    position: 32,
    name: "The Moon",
    meaning:
      "Emotions, intuition, imagination, dreams, cycles, psychic matters",
    timing: "Evenings and cycles (Moon's nocturnal nature)",
    special: "Emotional and subconscious indicator",
  },
  33: {
    position: 33,
    name: "The Key",
    meaning:
      "Solutions, answers, unlocking, access, important discoveries, breakthrough",
    timing: "Immediate solution",
    special: "Card of access - opens doors and provides answers",
  },
  34: {
    position: 34,
    name: "The Fish",
    meaning:
      "Abundance, wealth, money, business, fertility, multiplication of resources",
    timing: "Flowing and ongoing",
    special: "Prosperity indicator - often shows financial matters",
  },
  35: {
    position: 35,
    name: "The Anchor",
    meaning:
      "Stability, security, long-term, grounding, safety, patience, permanence",
    timing: "Long-term (Anchor's staying power)",
    special: "Foundation card - provides stability to entire reading",
  },
  36: {
    position: 36,
    name: "The Cross",
    meaning:
      "Burden, sacrifice, faith, destiny, karma, spiritual weight, life lessons",
    timing: "Burden and karmic",
    special: "Final card - the weight carried through the journey",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get house meaning for a specific position (1-36)
 * Positions are 0-indexed in code, so add 1 for display
 */
export function getHouseMeaning(position: number): HouseMeaning | null {
  const house = GRAND_TABLEAU_HOUSES[position + 1];
  return house || null;
}

/**
 * Get combined interpretation of card in a house position
 * Combines card's inherent meaning with house overlay meaning
 */
export function getCardInHouseMeaning(
  cardNumber: number,
  position: number,
): {
  card: string;
  cardName: string;
  position: number;
  positionName: string;
  positionMeaning: string;
  combined: string;
} {
  const house = getHouseMeaning(position);
  const cardMeaning = house?.name || "Unknown";

  return {
    card: cardNumber.toString(),
    cardName: cardMeaning,
    position: position,
    positionName: house?.name || "Unknown",
    positionMeaning: house?.meaning || "Unknown position",
    combined: `${cardMeaning} in House of ${house?.name || "Unknown"}`,
  };
}

/**
 * Check if a position is a special house position
 */
export function isSpecialHouse(position: number): boolean {
  const house = getHouseMeaning(position);
  return !!house?.special;
}

/**
 * Get timing based on house position
 */
export function getHouseTiming(position: number): string {
  const house = getHouseMeaning(position);
  return house?.timing || "Standard timing";
}

/**
 * Get cards in specific house positions
 */
export function getCardsInHouses(positions: number[]): number[] {
  return positions.map((pos) => pos + 1);
}

/**
 * Traditional 36-house system explanation
 * For educational purposes
 */
export const HOUSE_SYSTEM_EXPLANATION = {
  title: "The 36-House Overlay System",
  description: `
    In traditional Lenormand Grand Tableau readings, each of the 36 cards 
    sits in one of 36 "house" positions. The house position 
    adds a layer of meaning to whatever card appears there, creating 
    a rich, multi-dimensional interpretation.

    For example, if The Rider (1) falls in House 4 (The House),
    you read: "News about family coming to my home" - combining 
    Rider's message with House's domestic meaning.

    This system works alongside other Grand Tableau techniques:
    - Significator positions (Man/Woman cards)
    - Directional zones (left=past, right=future, etc.)
    - Diagonals showing flow
    - Knight moves revealing hidden patterns
  `,
  corePrinciples: [
    "Each house has its own meaning independent of the card",
    "House meanings add temporal and environmental context",
    "The same card has different interpretations in different houses",
    "Cards of Fate (Sun, Moon, Key, Fish) in houses carry extra weight",
  ],
};

// ============================================================================
// KNIGHT'S MOVE (CAVALIER'S MOVE) READING SYSTEM
// ============================================================================
// Traditional Lenormand technique where cards influence each other
// in an L-shaped pattern (2+1 or 1+2 positions), like a chess knight

export interface KnightMoveConnection {
  sourcePosition: number;
  targetPosition: number;
  sourceCard: number;
  targetCard: number;
  interpretation: string;
  strength: "strong" | "moderate" | "subtle";
}

export interface KnightMovePath {
  cards: number[];
  interpretations: string[];
  startPosition: number;
  endPosition: number;
}

/**
 * Get row and column for a position (0-indexed, 0-35)
 * Grid is 4 rows x 9 columns
 */
export function getPositionCoords(position: number): {
  row: number;
  col: number;
} {
  return {
    row: Math.floor(position / 9),
    col: position % 9,
  };
}

/**
 * Get position from row and column (0-indexed)
 */
export function getPositionFromCoords(row: number, col: number): number | null {
  if (row < 0 || row > 3 || col < 0 || col > 8) {
    return null;
  }
  return row * 9 + col;
}

/**
 * Calculate all valid knight move targets from a position
 * Knight moves: 2 in one direction, 1 perpendicular
 * Returns positions (0-indexed)
 */
export function getKnightTargets(position: number): number[] {
  const { row, col } = getPositionCoords(position);
  const moves = [
    { row: row - 2, col: col - 1 },
    { row: row - 2, col: col + 1 },
    { row: row - 1, col: col - 2 },
    { row: row - 1, col: col + 2 },
    { row: row + 1, col: col - 2 },
    { row: row + 1, col: col + 2 },
    { row: row + 2, col: col - 1 },
    { row: row + 2, col: col + 1 },
  ];

  const validTargets: number[] = [];
  for (const move of moves) {
    const target = getPositionFromCoords(move.row, move.col);
    if (target !== null) {
      validTargets.push(target);
    }
  }
  return validTargets;
}

/**
 * Check if position A can influence position B via knight's move
 */
export function isKnightMove(source: number, target: number): boolean {
  const targets = getKnightTargets(source);
  return targets.includes(target);
}

/**
 * Get all knight move connections for a specific card in the tableau
 */
export function getCardKnightConnections(
  cardNumber: number,
  cardPosition: number,
  allCards: Map<number, number>,
): KnightMoveConnection[] {
  const connections: KnightMoveConnection[] = [];
  const targets = getKnightTargets(cardPosition);

  for (const targetPos of targets) {
    const targetCard = allCards.get(targetPos);
    if (targetCard !== undefined) {
      const interpretation = interpretKnightMove(
        cardNumber,
        targetCard,
        cardPosition,
        targetPos,
      );
      connections.push({
        sourcePosition: cardPosition,
        targetPosition: targetPos,
        sourceCard: cardNumber,
        targetCard,
        interpretation,
        strength: "moderate",
      });
    }
  }

  return connections;
}

/**
 * Interpret a knight move between two cards
 */
export function interpretKnightMove(
  sourceCard: number,
  targetCard: number,
  sourcePosition: number,
  targetPosition: number,
): string {
  const sourceCoords = getPositionCoords(sourcePosition);
  const targetCoords = getPositionCoords(targetPosition);

  const direction = getDirectionDescription(sourceCoords, targetCoords);

  return `Card ${sourceCard} influences Card ${targetCard} via knight's move ${direction}`;
}

function getDirectionDescription(
  source: { row: number; col: number },
  target: { row: number; col: number },
): string {
  const rowDiff = target.row - source.row;
  const colDiff = target.col - source.col;

  const rowDesc = rowDiff < 0 ? "upward" : rowDiff > 0 ? "downward" : "";
  const colDesc = colDiff < 0 ? "leftward" : colDiff > 0 ? "rightward" : "";

  if (rowDesc && colDesc) {
    return `(${rowDesc}, ${colDesc})`;
  } else if (rowDesc) {
    return `(${rowDesc})`;
  } else if (colDesc) {
    return `(${colDesc})`;
  }
  return "";
}

/**
 * Find knight move paths through the tableau
 * Starting from a position, follow knight moves to create interpretation chains
 */
export function findKnightMovePaths(
  startPosition: number,
  maxDepth: number,
  allCards: Map<number, number>,
): KnightMovePath[] {
  const paths: KnightMovePath[] = [];
  const visited = new Set<number>();

  function explore(
    currentPos: number,
    depth: number,
    path: number[],
    interpretations: string[],
  ) {
    if (depth > maxDepth) {
      paths.push({
        cards: [...path],
        interpretations: [...interpretations],
        startPosition: startPosition,
        endPosition: currentPos,
      });
      return;
    }

    const targets = getKnightTargets(currentPos);
    for (const targetPos of targets) {
      if (visited.has(targetPos)) continue;

      const targetCard = allCards.get(targetPos);
      if (targetCard === undefined) continue;

      visited.add(targetPos);
      path.push(targetCard);

      const interp = interpretKnightMove(
        path[path.length - 2],
        targetCard,
        currentPos,
        targetPos,
      );
      interpretations.push(interp);

      explore(targetPos, depth + 1, path, interpretations);

      path.pop();
      interpretations.pop();
      visited.delete(targetPos);
    }
  }

  visited.add(startPosition);
  const startCard = allCards.get(startPosition);
  if (startCard !== undefined) {
    explore(startPosition, 1, [startCard], []);
  }

  return paths;
}

/**
 * Get all knight move connections in the entire tableau
 */
export function getAllKnightConnections(
  allCards: Map<number, number>,
): KnightMoveConnection[] {
  const allConnections: KnightMoveConnection[] = [];

  for (let pos = 0; pos < 36; pos++) {
    const card = allCards.get(pos);
    if (card !== undefined) {
      const connections = getCardKnightConnections(card, pos, allCards);
      allConnections.push(...connections);
    }
  }

  return allConnections;
}

/**
 * Get key knight move connections (most significant)
 * Filters for cards of fate, topic cards, and significators
 */
export function getKeyKnightConnections(
  allCards: Map<number, number>,
): KnightMoveConnection[] {
  const allConnections = getAllKnightConnections(allCards);
  const keyCards = [31, 32, 33, 34, 35, 24, 5, 28, 29]; // Cards of Fate + Topics + Significators

  return allConnections.filter(
    (conn) =>
      keyCards.includes(conn.sourceCard) || keyCards.includes(conn.targetCard),
  );
}

/**
 * Traditional knight's move explanation for educational purposes
 */
export const KNIGHT_MOVE_EXPLANATION = {
  title: "The Knight's Move (Cavalier's Move)",
  description: `
    The Knight's Move is a traditional Lenormand reading technique used primarily
    in Grand Tableau readings. Named after the chess knight's L-shaped movement,
    this technique reveals how cards influence each other across the tableau.

    When a card "knights" another, it means the source card affects, modifies,
    or colors the meaning of the target card. This creates a dynamic, interconnected
    reading rather than isolated card meanings.
  `,
  howItWorks: [
    "A knight's move is 2 positions in one direction + 1 position perpendicular",
    "From any position, there are 2-8 possible knight move targets",
    "Cards influence their knight-move neighbors significantly",
    "Multiple knight moves create chains of influence through the tableau",
    "Cards of Fate (Sun, Moon, Key, Fish) carry extra weight when knighting",
  ],
  interpretationGuidelines: [
    "Source card's energy flows into target card's meaning",
    "Strong knight moves often indicate hidden connections",
    "Chain of knight moves shows how situations evolve",
    "Knight move from past zone to future zone shows timeline progression",
    "Knight move to/from topic card focuses on that life area",
  ],
  example: `
    Example: If The Rider (1) knights The Heart (24), read:
    "The news brings emotional impact" or "A message affects love matters"

    The Rider's swift, incoming energy flows into the Heart's emotional domain,
    suggesting the news will have personal/emotional consequences.
  `,
};

// Pre-calculated knight move targets for each position (0-indexed)
export const KNIGHT_MOVE_TABLE: number[][] = [
  [10, 12], // Position 0
  [11, 13], // Position 1
  [8, 14], // Position 2
  [9, 15], // Position 3
  [1, 7, 11, 13, 17, 19, 21, 23], // Position 4
  [2, 6, 12, 14, 18, 20, 22, 24], // Position 5
  [1, 5, 11, 13, 15, 21, 23, 25], // Position 6
  [0, 4, 12, 14, 16, 22, 24, 26], // Position 7
  [2, 4, 14, 16, 18, 24, 26, 28], // Position 8
  [3, 5, 15, 17, 19, 25, 27, 29], // Position 9
  [0, 2, 8, 16, 18, 20, 26, 28, 30], // Position 10
  [1, 3, 9, 17, 19, 21, 27, 29, 31], // Position 11
  [0, 4, 6, 10, 18, 20, 22, 28, 30, 32], // Position 12
  [1, 5, 7, 11, 19, 21, 23, 29, 31, 33], // Position 13
  [2, 4, 8, 12, 20, 22, 24, 30, 32, 34], // Position 14
  [3, 5, 9, 13, 21, 23, 25, 31, 33, 35], // Position 15
  [4, 6, 10, 22, 24, 26, 32, 34], // Position 16
  [5, 7, 11, 23, 25, 27, 33, 35], // Position 17
  [2, 8, 10, 14, 24, 26, 28, 34], // Position 18
  [3, 9, 11, 15, 25, 27, 29, 35], // Position 19
  [4, 8, 10, 12, 16, 26, 28, 30], // Position 20
  [5, 9, 11, 13, 17, 27, 29, 31], // Position 21
  [6, 10, 12, 14, 18, 28, 30, 32], // Position 22
  [7, 11, 13, 15, 19, 29, 31, 33], // Position 23
  [4, 8, 12, 14, 16, 20, 30, 32, 34], // Position 24
  [5, 9, 13, 15, 17, 21, 31, 33, 35], // Position 25
  [6, 10, 14, 16, 18, 22, 32, 34], // Position 26
  [7, 11, 15, 17, 19, 23, 33, 35], // Position 27
  [8, 12, 16, 18, 20, 24, 34], // Position 28
  [9, 13, 17, 19, 21, 25, 35], // Position 29
  [10, 14, 20, 22, 26, 28, 32], // Position 30
  [11, 15, 21, 23, 27, 29, 33], // Position 31
  [12, 16, 22, 24, 26, 30, 34], // Position 32
  [13, 17, 23, 25, 27, 31, 35], // Position 33
  [14, 18, 24, 26, 28, 32], // Position 34
  [15, 19, 25, 27, 29, 33], // Position 35
];

export function getKnightTargetsFromTable(position: number): number[] {
  if (position < 0 || position > 35) return [];
  return KNIGHT_MOVE_TABLE[position];
}
