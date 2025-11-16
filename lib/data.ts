import { Card, Reading, ReadingCard } from './types'
import cardsData from '../public/data/cards.json'

// Load cards from JSON file
export function getCards(): Card[] {
  // Use imported JSON data for both server and client
  const data = cardsData as Card[]
  console.log('✅ Cards loaded:', data.length, 'cards')
  return data
}

export function getCardById(cards: Card[], id: number): Card | undefined {
  return cards.find(card => card.id === id)
}



// Encode reading data for URL sharing
export function encodeReadingForUrl(reading: Reading): string {
  const data = {
    t: reading.title,
    q: reading.question,
    l: reading.layoutType,
    c: reading.cards.map(card => ({
      i: card.id,
      p: card.position
    }))
  }
  return btoa(JSON.stringify(data)).replace(/[+/=]/g, c => ({
    '+': '-', '/': '_', '=': ''
  })[c] || c)
}

// Decode reading data from URL
export function decodeReadingFromUrl(encoded: string): Partial<Reading> | null {
  try {
    // Reverse the base64 URL encoding
    const base64 = encoded.replace(/[-_]/g, c => ({ '-': '+', '_': '/' })[c] || c)
    const json = atob(base64 + '=='.slice(0, (3 - base64.length % 3) % 3))
    const data = JSON.parse(json)
    
    return {
      title: data.t,
      question: data.q,
      layoutType: data.l,
      cards: data.c.map((card: any) => ({
        id: card.i,
        position: card.p
      }))
    }
  } catch {
    return null
  }
}

// Draw cards for reading - ensures complete randomness with no repetition
export function drawCards(cards: Card[], count: number): ReadingCard[] {
  if (count > cards.length) {
    throw new Error(`Cannot draw ${count} cards from a deck of ${cards.length}`)
  }

  // Create a copy of the cards array to avoid modifying the original
  const availableCards = [...cards]
  const drawnCards: Card[] = []

  // Draw cards randomly without replacement for complete uniqueness
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * availableCards.length)
    const drawnCard = availableCards.splice(randomIndex, 1)[0]
    drawnCards.push(drawnCard)
  }

  return drawnCards.map((card, index) => ({
    id: card.id,
    position: index
  }))
}

// Get combination meaning between two cards
export function getCombinationMeaning(card1: Card, card2: Card, card1Position?: number, card2Position?: number): string | null {
  // For directional combinations, use the card that appears first in the spread
  const useCard1Perspective = card1Position !== undefined && card2Position !== undefined
    ? card1Position <= card2Position
    : true // fallback to original behavior if positions not provided

  const primaryCard = useCard1Perspective ? card1 : card2
  const secondaryCard = useCard1Perspective ? card2 : card1

  const combos = Array.isArray(primaryCard.combos) ? primaryCard.combos : []
  const combo = combos.find(c => c.withCardId === secondaryCard.id)
  return combo?.meaning || null
}

// Get adjacent cards for linear layouts (3, 5, 9 cards)
export function getLinearAdjacentCards(cards: ReadingCard[], currentIndex: number): ReadingCard[] {
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
export function getGrandTableauAdjacentCards(cards: ReadingCard[], currentIndex: number): ReadingCard[] {
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