import { describe, it, expect } from 'vitest'

// Fisher-Yates shuffle implementation (same as in Deck component)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Draw cards without replacement
function drawCards<T>(deck: T[], count: number): { drawn: T[], remaining: T[] } {
  const shuffled = shuffleArray(deck)
  const drawn = shuffled.slice(0, count)
  const remaining = shuffled.slice(count)
  return { drawn, remaining }
}

describe('Shuffle Algorithm', () => {
  const testDeck = Array.from({ length: 36 }, (_, i) => i + 1)

  it('should maintain the same number of elements after shuffling', () => {
    const shuffled = shuffleArray(testDeck)
    expect(shuffled).toHaveLength(testDeck.length)
  })

  it('should contain all original elements after shuffling', () => {
    const shuffled = shuffleArray(testDeck)
    expect(shuffled.sort()).toEqual(testDeck.sort())
  })

  it('should produce different order on multiple shuffles (high probability)', () => {
    const shuffle1 = shuffleArray(testDeck)
    const shuffle2 = shuffleArray(testDeck)
    
    // The probability of getting the exact same shuffle twice is extremely low
    // (1/36! ≈ 1.4×10^-41), so this should almost never fail
    expect(shuffle1).not.toEqual(shuffle2)
  })

  it('should not modify the original array', () => {
    const original = [...testDeck]
    shuffleArray(testDeck)
    expect(testDeck).toEqual(original)
  })

  it('should handle empty array', () => {
    const empty: number[] = []
    const shuffled = shuffleArray(empty)
    expect(shuffled).toEqual([])
  })

  it('should handle single element array', () => {
    const single = [1]
    const shuffled = shuffleArray(single)
    expect(shuffled).toEqual([1])
  })
})

describe('Card Drawing', () => {
  const testDeck = Array.from({ length: 36 }, (_, i) => ({ id: i + 1, name: `Card ${i + 1}` }))

  it('should draw correct number of cards', () => {
    const { drawn } = drawCards(testDeck, 5)
    expect(drawn).toHaveLength(5)
  })

  it('should not draw more cards than available', () => {
    const { drawn } = drawCards(testDeck, 40)
    expect(drawn).toHaveLength(testDeck.length)
  })

  it('should not have duplicates in drawn cards', () => {
    const { drawn } = drawCards(testDeck, 10)
    const drawnIds = drawn.map(card => card.id)
    const uniqueIds = new Set(drawnIds)
    expect(uniqueIds.size).toBe(drawnIds.length)
  })

  it('should have correct number of remaining cards', () => {
    const drawCount = 10
    const { remaining } = drawCards(testDeck, drawCount)
    expect(remaining).toHaveLength(testDeck.length - drawCount)
  })

  it('should separate drawn and remaining cards correctly', () => {
    const drawCount = 15
    const { drawn, remaining } = drawCards(testDeck, drawCount)
    
    const drawnIds = new Set(drawn.map(card => card.id))
    const remainingIds = new Set(remaining.map(card => card.id))
    
    // No overlap between drawn and remaining
    const overlap = Array.from(drawnIds).filter(id => remainingIds.has(id))
    expect(overlap).toHaveLength(0)

    // Combined they should make the full deck
    const combinedIds = new Set([...Array.from(drawnIds), ...Array.from(remainingIds)])
    expect(combinedIds.size).toBe(testDeck.length)
  })

  it('should handle zero draw count', () => {
    const { drawn, remaining } = drawCards(testDeck, 0)
    expect(drawn).toHaveLength(0)
    expect(remaining).toHaveLength(testDeck.length)
  })

  it('should handle full deck draw', () => {
    const { drawn, remaining } = drawCards(testDeck, testDeck.length)
    expect(drawn).toHaveLength(testDeck.length)
    expect(remaining).toHaveLength(0)
  })
})

describe('Randomness Distribution', () => {
  const testDeck = [1, 2, 3, 4, 5]
  const iterations = 1000

  it('should distribute cards evenly across positions over many shuffles', () => {
    const positionCounts: Record<number, number[]> = {}
    
    // Initialize position counts
    for (let i = 0; i < testDeck.length; i++) {
      positionCounts[i] = new Array(testDeck.length).fill(0)
    }
    
    // Run many shuffles and count positions
    for (let i = 0; i < iterations; i++) {
      const shuffled = shuffleArray(testDeck)
      shuffled.forEach((card, position) => {
        positionCounts[card - 1][position]++
      })
    }
    
    // Check that each card appears in each position roughly equally
    // Allow for some variance (±20% of expected)
    const expectedCount = iterations / testDeck.length
    const tolerance = expectedCount * 0.2
    
    for (let card = 0; card < testDeck.length; card++) {
      for (let position = 0; position < testDeck.length; position++) {
        const count = positionCounts[card][position]
        expect(count).toBeGreaterThanOrEqual(expectedCount - tolerance)
        expect(count).toBeLessThanOrEqual(expectedCount + tolerance)
      }
    }
  })
})