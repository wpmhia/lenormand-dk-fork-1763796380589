import { Card } from '@/lib/types'

/**
 * Converts card name mentions in text to markdown links
 * E.g., "The Rider suggests speed" → "The [Rider](/cards/1) suggests speed"
 */
export function linkifyCardNames(text: string, allCards: Card[]): string {
  if (!text || !allCards || allCards.length === 0) {
    return text
  }

  // Create a map of card names to IDs for quick lookup
  const cardMap = new Map<string, number>()
  allCards.forEach(card => {
    cardMap.set(card.name.toLowerCase(), card.id)
  })

  // Sort card names by length (longest first) to avoid partial matches
  const sortedNames = Array.from(cardMap.keys()).sort((a, b) => b.length - a.length)

  // Build a regex that matches whole words only
  // This prevents "The Rider" from being matched in "Rider-like" or "Riders"
  let result = text

  for (const cardName of sortedNames) {
    const cardId = cardMap.get(cardName)!
    
    // Create regex that matches the card name as a whole word (case-insensitive)
    // Using word boundaries to ensure we don't match partial words
    const regex = new RegExp(`\\b${cardName}\\b`, 'gi')

    // Don't link if already part of a markdown link
    // Check for patterns like [Card Name](/path) or existing markdown links
    result = result.replace(regex, (match) => {
      // Look for existing markdown link syntax around this match
      const startIndex = result.indexOf(match)
      if (startIndex === -1) return match

      // Check if this is already in a markdown link
      const beforeText = result.substring(Math.max(0, startIndex - 50))
      const afterText = result.substring(startIndex + match.length, Math.min(result.length, startIndex + match.length + 50))
      
      // If we're already inside brackets or parentheses of a link, don't link again
      if (beforeText.includes('[') && !beforeText.includes(']')) {
        return match
      }
      if (beforeText.includes('](') && !afterText.includes(')')) {
        return match
      }

      // Create the markdown link
      return `[${match}](/cards/${cardId})`
    })
  }

  return result
}

/**
 * Extract unique card names mentioned in text
 */
export function extractMentionedCards(text: string, allCards: Card[]): Card[] {
  if (!text || !allCards) return []

  const mentioned = new Set<number>()
  const cardMap = new Map<string, number>()

  allCards.forEach(card => {
    cardMap.set(card.name.toLowerCase(), card.id)
  })

  // Find all card name mentions in text
  cardMap.forEach((cardId, cardName) => {
    const regex = new RegExp(`\\b${cardName}\\b`, 'gi')
    if (regex.test(text)) {
      mentioned.add(cardId)
    }
  })

  // Return the actual card objects
  return allCards.filter(card => mentioned.has(card.id))
}
