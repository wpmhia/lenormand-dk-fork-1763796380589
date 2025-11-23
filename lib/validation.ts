/**
 * Request and response validation utilities
 * Provides centralized validation for API requests and responses
 */

export interface ValidationError {
  valid: boolean
  error?: string
  details?: Record<string, string>
}

export interface Card {
  id: number
  name: string
  [key: string]: any
}

export interface AIReadingRequestBody {
  cards: Card[]
  question: string
  spreadId?: string
  [key: string]: any
}

export class Validator {
  /**
   * Validate AI reading request
   */
  static validateAIReadingRequest(body: any): ValidationError {
    if (!body) {
      return { valid: false, error: 'Request body is empty' }
    }

    const errors: Record<string, string> = {}

    if (!body.cards || !Array.isArray(body.cards)) {
      errors.cards = 'Cards must be provided as an array'
    } else {
      if (body.cards.length === 0) {
        errors.cards = 'At least one card is required'
      } else if (body.cards.length > 36) {
        errors.cards = 'Maximum 36 cards allowed'
      } else {
        for (let i = 0; i < body.cards.length; i++) {
          const card = body.cards[i]
          if (!card.id || !card.name) {
            errors[`card_${i}`] = 'Card is missing id or name'
          } else if (typeof card.id !== 'number' || card.id < 1 || card.id > 36) {
            errors[`card_${i}_id`] = `Invalid id: ${card.id}`
          } else if (typeof card.name !== 'string' || card.name.trim() === '') {
            errors[`card_${i}_name`] = `Invalid name: ${card.name}`
          }
        }
      }
    }

    if (!body.question || typeof body.question !== 'string') {
      errors.question = 'Question must be a non-empty string'
    } else if (body.question.trim().length === 0) {
      errors.question = 'Question cannot be empty'
    } else if (body.question.trim().length > 500) {
      errors.question = 'Question cannot exceed 500 characters'
    }

    if (body.spreadId !== undefined) {
      const validSpreads = [
        'sentence-3',
        'horseshoe-7',
        'celtic-cross-10',
        'pyramid-9',
        'pairs',
        'trio',
        'daily-3',
        'weekly-4',
        'monthly-5',
        'past-present-future',
        'situation-action-outcome',
        'four-seasons'
      ]

      if (typeof body.spreadId !== 'string' || !validSpreads.includes(body.spreadId)) {
        errors.spreadId = `Invalid spread ID: ${body.spreadId}`
      }
    }

    if (Object.keys(errors).length > 0) {
      return {
        valid: false,
        error: 'Validation failed',
        details: errors
      }
    }

    return { valid: true }
  }

  /**
   * Validate health check response structure
   */
  static validateHealthResponse(data: any): ValidationError {
    const errors: Record<string, string> = {}

    if (!data.status) {
      errors.status = 'Status is required'
    }
    if (!data.timestamp) {
      errors.timestamp = 'Timestamp is required'
    }
    if (!data.service || typeof data.service !== 'object') {
      errors.service = 'Service information is required'
    }
    if (typeof data.uptime !== 'number') {
      errors.uptime = 'Uptime must be a number'
    }
    if (!data.memory || typeof data.memory !== 'object') {
      errors.memory = 'Memory information is required'
    }

    if (Object.keys(errors).length > 0) {
      return {
        valid: false,
        error: 'Health response validation failed',
        details: errors
      }
    }

    return { valid: true }
  }

  /**
   * Validate API response structure
   */
  static validateAPIResponse(data: any): ValidationError {
    if (!data) {
      return { valid: false, error: 'Response data is empty' }
    }

    if (typeof data !== 'object') {
      return { valid: false, error: 'Response must be an object' }
    }

    return { valid: true }
  }

  /**
   * Sanitize input string
   */
  static sanitizeString(input: string, maxLength: number = 500): string {
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>\"']/g, '') // Basic XSS prevention
  }

  /**
   * Validate array of card IDs
   */
  static validateCardIds(cardIds: any[]): ValidationError {
    if (!Array.isArray(cardIds)) {
      return { valid: false, error: 'Card IDs must be an array' }
    }

    for (let i = 0; i < cardIds.length; i++) {
      const id = cardIds[i]
      if (typeof id !== 'number' || id < 1 || id > 36) {
        return {
          valid: false,
          error: `Invalid card ID at index ${i}: ${id}`
        }
      }
    }

    return { valid: true }
  }
}

export default Validator
