import { describe, it, expect } from 'vitest'

interface Card {
  id: number
  name: string
  combos: Array<{ withCardId: number; meaning: string }>
}

interface ReadingCard {
  id: number
  position: number
  x?: number
  y?: number
}

// Mock card data for testing
const mockCards: Card[] = [
  {
    id: 1,
    name: "Rider",
    combos: [
      { withCardId: 2, meaning: "News about clover - lucky message" },
      { withCardId: 28, meaning: "News from man - male messenger" },
    ]
  },
  {
    id: 2,
    name: "Clover",
    combos: [
      { withCardId: 1, meaning: "Lucky news - fortunate message" },
      { withCardId: 21, meaning: "Lucky mountain - overcoming obstacles" },
    ]
  },
  {
    id: 28,
    name: "Man",
    combos: [
      { withCardId: 1, meaning: "Male news - masculine message" },
      { withCardId: 29, meaning: "Man and woman - couple" },
    ]
  },
  {
    id: 29,
    name: "Woman",
    combos: [
      { withCardId: 28, meaning: "Woman and man - couple" },
      { withCardId: 24, meaning: "Woman in love - romantic female" },
    ]
  }
]

// Get adjacent cards for linear layouts (3, 5, 9 cards)
function getLinearAdjacentCards(cards: ReadingCard[], currentIndex: number): ReadingCard[] {
  const adjacent: ReadingCard[] = []
  
  // Check if currentIndex is valid
  if (currentIndex < 0 || currentIndex >= cards.length) {
    return adjacent
  }
  
  if (currentIndex > 0) {
    adjacent.push(cards[currentIndex - 1])
  }
  if (currentIndex < cards.length - 1) {
    adjacent.push(cards[currentIndex + 1])
  }
  
  return adjacent
}

// Get adjacent cards for Grand Tableau (36 cards in 9x4 grid)
function getGrandTableauAdjacentCards(cards: ReadingCard[], currentIndex: number): ReadingCard[] {
  const adjacent: ReadingCard[] = []
  
  // Check if currentIndex is valid
  if (currentIndex < 0 || currentIndex >= 36) {
    return adjacent
  }
  
  const row = Math.floor(currentIndex / 4)
  const col = currentIndex % 4
  
  // Adjacent positions in grid (top, bottom, left, right)
  const adjacentPositions = [
    { r: row - 1, c: col },     // top
    { r: row + 1, c: col },     // bottom
    { r: row, c: col - 1 },     // left
    { r: row, c: col + 1 },     // right
  ].filter(pos => pos.r >= 0 && pos.r < 9 && pos.c >= 0 && pos.c < 4)
  
  adjacentPositions.forEach(pos => {
    const adjIndex = pos.r * 4 + pos.c
    const adjCard = cards.find(card => card.position === adjIndex)
    if (adjCard) adjacent.push(adjCard)
  })
  
  return adjacent
}

// Get combination meaning between two cards
function getCombinationMeaning(card1: Card, card2: Card): string | null {
  const combos = Array.isArray(card1.combos) ? card1.combos : []
  const combo = combos.find(c => c.withCardId === card2.id)
  return combo?.meaning || null
}

// Get card by ID
function getCardById(cards: Card[], id: number): Card | undefined {
  return cards.find(card => card.id === id)
}

describe('Card Combination Logic', () => {
  describe('Linear Layout Adjacency', () => {
    const linearReading: ReadingCard[] = [
      { id: 1, position: 0 },
      { id: 2, position: 1 },
      { id: 28, position: 2 },
    ]

    it('should find correct adjacent cards for middle position', () => {
      const adjacent = getLinearAdjacentCards(linearReading, 1)
      expect(adjacent).toHaveLength(2)
      expect(adjacent.map(c => c.id)).toEqual([1, 28])
    })

    it('should find correct adjacent cards for first position', () => {
      const adjacent = getLinearAdjacentCards(linearReading, 0)
      expect(adjacent).toHaveLength(1)
      expect(adjacent[0].id).toBe(2)
    })

    it('should find correct adjacent cards for last position', () => {
      const adjacent = getLinearAdjacentCards(linearReading, 2)
      expect(adjacent).toHaveLength(1)
      expect(adjacent[0].id).toBe(2)
    })

    it('should handle single card reading', () => {
      const singleCard: ReadingCard[] = [{ id: 1, position: 0 }]
      const adjacent = getLinearAdjacentCards(singleCard, 0)
      expect(adjacent).toHaveLength(0)
    })
  })

  describe('Grand Tableau Adjacency', () => {
    const grandTableauReading: ReadingCard[] = Array.from({ length: 36 }, (_, i) => ({
      id: (i % 4) + 1, // Just for testing adjacency, not realistic card IDs
      position: i,
      x: i % 4,
      y: Math.floor(i / 4)
    }))

    it('should find correct adjacent cards for center position', () => {
      // Position 10 (row 2, col 2) - should have 4 adjacent cards
      const adjacent = getGrandTableauAdjacentCards(grandTableauReading, 10)
      expect(adjacent).toHaveLength(4)
      
      const adjacentPositions = adjacent.map(c => c.position).sort()
      const expectedPositions = [6, 9, 11, 14] // top, left, right, bottom
      expect(adjacentPositions).toEqual(expect.arrayContaining(expectedPositions))
      expect(adjacentPositions).toHaveLength(expectedPositions.length)
    })

    it('should find correct adjacent cards for corner position', () => {
      // Position 0 (row 0, col 0) - should have 2 adjacent cards
      const adjacent = getGrandTableauAdjacentCards(grandTableauReading, 0)
      expect(adjacent).toHaveLength(2)
      
      const adjacentPositions = adjacent.map(c => c.position).sort()
      const expectedPositions = [1, 4] // right, bottom
      expect(adjacentPositions).toEqual(expectedPositions)
    })

    it('should find correct adjacent cards for edge position', () => {
      // Position 1 (row 0, col 1) - should have 3 adjacent cards
      const adjacent = getGrandTableauAdjacentCards(grandTableauReading, 1)
      expect(adjacent).toHaveLength(3)
      
      const adjacentPositions = adjacent.map(c => c.position).sort()
      const expectedPositions = [0, 2, 5] // left, right, bottom
      expect(adjacentPositions).toEqual(expectedPositions)
    })
  })

  describe('Combination Meanings', () => {
    it('should find existing combination meaning', () => {
      const rider = getCardById(mockCards, 1)!
      const clover = getCardById(mockCards, 2)!
      
      const meaning = getCombinationMeaning(rider, clover)
      expect(meaning).toBe("News about clover - lucky message")
    })

    it('should return null for non-existing combination', () => {
      const rider = getCardById(mockCards, 1)!
      const woman = getCardById(mockCards, 29)!
      
      const meaning = getCombinationMeaning(rider, woman)
      expect(meaning).toBeNull()
    })

    it('should handle card with no combinations', () => {
      const cardWithNoCombos: Card = {
        id: 99,
        name: "Test Card",
        combos: []
      }
      
      const rider = getCardById(mockCards, 1)!
      const meaning = getCombinationMeaning(cardWithNoCombos, rider)
      expect(meaning).toBeNull()
    })

    it('should handle undefined combos array', () => {
      const cardWithUndefinedCombos: Card = {
        id: 98,
        name: "Test Card 2",
        combos: undefined as any
      }
      
      const rider = getCardById(mockCards, 1)!
      const meaning = getCombinationMeaning(cardWithUndefinedCombos, rider)
      expect(meaning).toBeNull()
    })
  })

  describe('Integration Tests', () => {
    it('should generate correct combination meanings for linear reading', () => {
      const reading: ReadingCard[] = [
        { id: 1, position: 0 }, // Rider
        { id: 2, position: 1 }, // Clover
        { id: 28, position: 2 }, // Man
      ]

      // Test combinations for middle card (Clover)
      const currentIndex = 1
      const currentCard = getCardById(mockCards, reading[currentIndex].id)!
      const adjacentCards = getLinearAdjacentCards(reading, currentIndex)
      
      expect(adjacentCards).toHaveLength(2)
      
      // Check combination with previous card (Rider)
      const prevCard = getCardById(mockCards, adjacentCards[0].id)!
      const prevMeaning = getCombinationMeaning(currentCard, prevCard)
      expect(prevMeaning).toBe("Lucky news - fortunate message")
      
      // Check combination with next card (Man)
      const nextCard = getCardById(mockCards, adjacentCards[1].id)!
      const nextMeaning = getCombinationMeaning(currentCard, nextCard)
      expect(nextMeaning).toBeNull() // No Clover + Man combo defined
    })

    it('should generate correct combination meanings for Grand Tableau', () => {
      const reading: ReadingCard[] = [
        { id: 1, position: 0, x: 0, y: 0 },  // Rider
        { id: 2, position: 1, x: 1, y: 0 },  // Clover
        { id: 28, position: 4, x: 0, y: 1 }, // Man
        { id: 29, position: 5, x: 1, y: 1 }, // Woman
      ]

      // Test combinations for position 1 (Clover)
      const currentIndex = 1
      const currentCard = getCardById(mockCards, reading[currentIndex].id)!
      const adjacentCards = getGrandTableauAdjacentCards(reading, currentIndex)
      
      expect(adjacentCards).toHaveLength(2) // left, bottom (right is empty)
      
      // Should find Rider (left) and Woman (bottom)
      const adjacentIds = adjacentCards.map(c => c.id)
      expect(adjacentIds).toContain(1) // Rider
      expect(adjacentIds).toContain(29) // Woman
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty reading', () => {
      const adjacent = getLinearAdjacentCards([], 0)
      expect(adjacent).toHaveLength(0)
    })

    it('should handle invalid index', () => {
      const reading: ReadingCard[] = [{ id: 1, position: 0 }]
      const adjacent = getLinearAdjacentCards(reading, 5)
      expect(adjacent).toHaveLength(0)
    })

    it('should handle Grand Tableau with missing positions', () => {
      const partialReading: ReadingCard[] = [
        { id: 1, position: 0, x: 0, y: 0 },
        { id: 2, position: 5, x: 1, y: 1 }, // Skip some positions
      ]
      
      const adjacent = getGrandTableauAdjacentCards(partialReading, 0)
      expect(adjacent).toHaveLength(0) // No adjacent cards found
    })
  })
})