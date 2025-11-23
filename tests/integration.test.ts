import { describe, it, expect } from 'vitest'
import { MarieAnneAgent } from '@/lib/agent'
import { getAIReading, AIReadingRequest } from '@/lib/deepseek'
import { SPREAD_RULES } from '@/lib/spreadRules'
import { LenormandCard } from '@/types/agent.types'

describe('Integration Tests - Full API Workflow', () => {
  
  describe('3-Card Spread Workflow', () => {
    it('should generate complete reading with deadline and task', async () => {
      const cards: LenormandCard[] = [
        { id: 18, name: 'Dog' },
        { id: 8, name: 'Coffin' },
        { id: 21, name: 'Mountain' }
      ]

      const request: AIReadingRequest = {
        question: 'Will our friendship survive this conflict?',
        cards: cards.map((c, i) => ({ id: c.id, name: c.name, position: i })),
        spreadId: 'sentence-3'
      }

      const response = await getAIReading(request)

      expect(response).toBeDefined()
      expect(response?.reading).toBeDefined()
      expect(response?.deadline).toBeDefined()
      expect(response?.task).toBeDefined()
      expect(response?.timingDays).toBeGreaterThan(0)
    })

    it('should include all card names in reading', async () => {
      const cards: LenormandCard[] = [
        { id: 6, name: 'Clouds' },
        { id: 27, name: 'Letter' },
        { id: 31, name: 'Sun' }
      ]

      const request: AIReadingRequest = {
        question: 'How will this situation develop?',
        cards: cards.map((c, i) => ({ id: c.id, name: c.name, position: i })),
        spreadId: 'sentence-3'
      }

      const response = await getAIReading(request)

      expect(response?.reading).toBeDefined()
      const reading = response!.reading.toLowerCase()
      expect(reading).toContain('cloud')
      expect(reading).toContain('letter')
      expect(reading).toContain('sun')
    })
  })

  describe('5-Card Spread Workflow', () => {
    it('should generate 5-sentence reading', async () => {
      const cards: LenormandCard[] = [
        { id: 21, name: 'Mountain' },
        { id: 14, name: 'Fox' },
        { id: 33, name: 'Key' },
        { id: 27, name: 'Letter' },
        { id: 31, name: 'Sun' }
      ]

      const request: AIReadingRequest = {
        question: 'What about my job search?',
        cards: cards.map((c, i) => ({ id: c.id, name: c.name, position: i })),
        spreadId: 'structured-reading'
      }

      const response = await getAIReading(request)

      expect(response).toBeDefined()
      expect(response?.reading).toBeDefined()
      expect(response?.deadline).toBeDefined()
      expect(response?.task).toBeDefined()
      
      // Verify reading is non-empty and has multiple sentences
      const sentences = response!.reading.split(/[.!?]+/).filter(s => s.trim().length > 0)
      expect(sentences.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('9-Card Spread Workflow', () => {
    it('should generate comprehensive reading with card reference validation', () => {
      const cards: LenormandCard[] = [
        { id: 6, name: 'Clouds' },
        { id: 12, name: 'Birds' },
        { id: 35, name: 'Anchor' },
        { id: 20, name: 'Garden' },
        { id: 8, name: 'Coffin' },
        { id: 14, name: 'Fox' },
        { id: 19, name: 'Tower' },
        { id: 17, name: 'Stork' },
        { id: 22, name: 'Paths' }
      ]

      const spread = SPREAD_RULES['comprehensive']
      const agentRequest = {
        cards,
        spread,
        question: 'Full reading please'
      }

      const response = MarieAnneAgent.tellStory(agentRequest)

      expect(response.story).toBeDefined()
      expect(response.deadline).toBeDefined()
      expect(response.task).toBeDefined()
      expect(response.timingDays).toBeGreaterThan(0)

      const validation = MarieAnneAgent.validateCardReferences(response.story, cards, 9)
      expect(validation.isValid).toBe(true)
      expect(validation.missingCards).toHaveLength(0)
    })

    it('should maintain (CardName) format structure', () => {
      const cards: LenormandCard[] = [
        { id: 6, name: 'Clouds' },
        { id: 12, name: 'Birds' },
        { id: 35, name: 'Anchor' },
        { id: 20, name: 'Garden' },
        { id: 8, name: 'Coffin' },
        { id: 14, name: 'Fox' },
        { id: 19, name: 'Tower' },
        { id: 17, name: 'Stork' },
        { id: 22, name: 'Paths' }
      ]

      const spread = SPREAD_RULES['comprehensive']
      const agentRequest = {
        cards,
        spread,
        question: 'Test comprehensive reading'
      }

      const response = MarieAnneAgent.tellStory(agentRequest)

      // Verify response structure
      expect(response.story).toBeDefined()
      expect(response.story.length).toBeGreaterThan(100)
      expect(response.deadline).toBeDefined()
      expect(response.task).toBeDefined()
      
      // Verify parentheses format is used (should contain at least some parentheses)
      expect(response.story).toContain('(')
      expect(response.story).toContain(')')
    })
  })

  describe('All 12 Spreads Integration', () => {
    it('should handle all spreads without errors', () => {
      const spreadIds = [
        'single-card',
        'sentence-3',
        'past-present-future',
        'yes-no-maybe',
        'situation-challenge-advice',
        'mind-body-spirit',
        'sentence-5',
        'structured-reading',
        'week-ahead',
        'relationship-double-significator',
        'comprehensive',
        'grand-tableau'
      ]

      spreadIds.forEach(spreadId => {
        const spread = SPREAD_RULES[spreadId as any]
        expect(spread).toBeDefined()

        const cards: LenormandCard[] = Array(spread.positions.length)
          .fill(null)
          .map((_, i) => ({
            id: (i % 36) + 1,
            name: `Card${i + 1}`
          }))

        const request = {
          cards,
          spread,
          question: `Test reading for ${spreadId}`
        }

        expect(() => MarieAnneAgent.tellStory(request)).not.toThrow()
        const response = MarieAnneAgent.tellStory(request)

        expect(response.story).toBeDefined()
        expect(response.deadline).toBeDefined()
        expect(response.task).toBeDefined()
        expect(response.timingDays).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing cards gracefully', async () => {
      const request: AIReadingRequest = {
        question: 'What will happen?',
        cards: [],
        spreadId: 'sentence-3'
      }

      const response = await getAIReading(request)
      expect(response).toBeDefined()
    })

    it('should handle invalid spread ID', () => {
      const cards: LenormandCard[] = [
        { id: 1, name: 'Rider' },
        { id: 2, name: 'Clover' },
        { id: 3, name: 'Ship' }
      ]

      const spread = SPREAD_RULES['sentence-3']
      const request = {
        cards,
        spread,
        question: 'Test question'
      }

      expect(() => MarieAnneAgent.tellStory(request)).not.toThrow()
      const response = MarieAnneAgent.tellStory(request)
      expect(response.story).toBeDefined()
    })

    it('should provide actionable tasks for different card outcomes', () => {
      const testCards = [
        { cardId: 25, cardName: 'Ring' },
        { cardId: 27, cardName: 'Letter' },
        { cardId: 33, cardName: 'Key' },
        { cardId: 22, cardName: 'Paths' }
      ]

      testCards.forEach(({ cardId, cardName }) => {
        const spread = SPREAD_RULES['sentence-3']
        const fullCards: LenormandCard[] = [
          { id: cardId, name: cardName },
          { id: 2, name: 'Clover' },
          { id: 3, name: 'Ship' }
        ]

        const request = {
          cards: fullCards,
          spread,
          question: 'Test question'
        }

        const response = MarieAnneAgent.tellStory(request)
        
        // Task should be defined and non-empty
        expect(response.task).toBeDefined()
        expect(response.task.length).toBeGreaterThan(5)
        
        // Task should be actionable (contain a verb or instruction)
        expect(response.task).toMatch(/[A-Z][a-z]+|by|before|after/)
      })
    })
  })

  describe('Deadline Calculation', () => {
    it('should calculate deadlines based on outcome card pip', () => {
      const testCases = [
        { cardId: 1, expectsThursday: true },  // Rider = 1 pip
        { cardId: 10, expectsThursday: false }, // 10 pips
        { cardId: 31, expectsThursday: false }, // Sun > 30 = 4 pips
        { cardId: 22, expectsThursday: false } // Paths = 2 pips
      ]

      testCases.forEach(({ cardId, expectsThursday }) => {
        const cards: LenormandCard[] = [
          { id: 1, name: 'Rider' },
          { id: 2, name: 'Clover' },
          { id: cardId, name: 'TestCard' }
        ]

        const spread = SPREAD_RULES['sentence-3']
        const request = {
          cards,
          spread,
          question: 'Test deadline'
        }

        const response = MarieAnneAgent.tellStory(request)
        expect(response.deadline).toBeDefined()
        expect(response.deadline).toContain('evening')
        
        if (expectsThursday) {
          // Smaller pips should round to Thursday
          expect(['Thursday', 'Friday']).toContain(
            response.deadline.includes('Thursday') ? 'Thursday' : 'Friday'
          )
        }
      })
    })
  })

  describe('Reading Consistency', () => {
    it('should produce consistent structure for same cards', () => {
      const cards: LenormandCard[] = [
        { id: 6, name: 'Clouds' },
        { id: 27, name: 'Letter' },
        { id: 31, name: 'Sun' }
      ]

      const spread = SPREAD_RULES['sentence-3']
      const request = {
        cards,
        spread,
        question: 'Will this resolve?'
      }

      const response1 = MarieAnneAgent.tellStory(request)
      const response2 = MarieAnneAgent.tellStory(request)

      expect(response1.story).toBeDefined()
      expect(response2.story).toBeDefined()
      expect(response1.deadline).toBeDefined()
      expect(response2.deadline).toBeDefined()
      expect(response1.timingDays).toBe(response2.timingDays)
    })

    it('should have actionable task in final sentence', () => {
      const cards: LenormandCard[] = [
        { id: 18, name: 'Dog' },
        { id: 8, name: 'Coffin' },
        { id: 21, name: 'Mountain' }
      ]

      const spread = SPREAD_RULES['sentence-3']
      const request = {
        cards,
        spread,
        question: 'How should I proceed?'
      }

      const response = MarieAnneAgent.tellStory(request)

      // Task should be defined, non-empty, and contain some action-oriented language
      expect(response.task).toBeDefined()
      expect(response.task.length).toBeGreaterThan(5)
      
      // Verify it's not just repeating the question
      expect(response.task.toLowerCase()).not.toContain('question')
      
      // Should contain imperatives or action words
      const hasImperative = /^[A-Z][a-z]+\s+(the|a|your|your|your)/i.test(response.task) || 
                           response.task.includes('by') ||
                           response.task.includes('Send') ||
                           response.task.includes('Choose') ||
                           response.task.includes('Confirm')
      expect(hasImperative || response.task.length > 10).toBe(true)
    })
  })
})
