import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isDeepSeekAvailable, parseAIResponse } from '@/lib/deepseek'

// Mock fetch globally
global.fetch = vi.fn()

describe('DeepSeek Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables
    delete process.env.DEEPSEEK_API_KEY
    delete process.env.DEEPSEEK_BASE_URL
  })

  describe('isDeepSeekAvailable', () => {
    it('returns false when API key is not set', () => {
      expect(isDeepSeekAvailable()).toBe(false)
    })

    it('returns true when API key is set', () => {
      process.env.DEEPSEEK_API_KEY = 'test-key'
      expect(isDeepSeekAvailable()).toBe(true)
    })
  })

  describe('parseAIResponse', () => {
    it('parses markdown structured response correctly', () => {
      const response = `1. **Story** Rider races to Clover but Ship blocks overseas transfer; luck arrives after delay.
2. **Risk** FX fees nibble 2-3 %.
3. **Timing** Confirmation before 4 pm, cash tomorrow morning.
4. **Act** Call your bank today.`

      const result = parseAIResponse(response)

      expect(result).toEqual({
        storyline: 'Rider races to Clover but Ship blocks overseas transfer; luck arrives after delay.',
        risk: 'FX fees nibble 2-3 %.',
        timing: 'Confirmation before 4 pm, cash tomorrow morning.',
        action: 'Call your bank today.',
        rawResponse: response
      })
    })

    it('parses bold markdown format correctly', () => {
      const response = `**Story** Rider races to Clover but Ship blocks overseas transfer; luck arrives after delay.
**Risk** FX fees nibble 2-3 %.
**Timing** Confirmation before 4 pm, cash tomorrow morning.
**Act** Call your bank today.`

      const result = parseAIResponse(response)

      expect(result.storyline).toBe('Rider races to Clover but Ship blocks overseas transfer; luck arrives after delay.')
      expect(result.risk).toBe('FX fees nibble 2-3 %.')
      expect(result.timing).toBe('Confirmation before 4 pm, cash tomorrow morning.')
      expect(result.action).toBe('Call your bank today.')
    })

    it('handles unstructured response gracefully', () => {
      const response = 'This is a general reading about your situation. The cards suggest positive changes ahead.'

      const result = parseAIResponse(response)

      expect(result.storyline).toBe('This is a general reading about your situation. The cards suggest positive changes ahead.')
      expect(result.risk).toBe('Trust your intuition and the guidance you receive')
      expect(result.timing).toBe('The timing will become clear as events unfold')
      expect(result.action).toBe('Act on the central insight that emerged from the mirror relationship between your cards')
    })

    it('falls back to numbered format', () => {
      const response = `1. Money releases within 24 hours, but FX fees will nibble; expect 98% of original sum.
2. Risk: Delays from banking bureaucracy
3. Timing: Within 48 hours
4. Act: Call your bank today`

      const result = parseAIResponse(response)

      expect(result.storyline).toBe('Money releases within 24 hours, but FX fees will nibble; expect 98% of original sum.')
      expect(result.risk).toBe('Delays from banking bureaucracy')
      expect(result.timing).toBe('Within 48 hours')
      expect(result.action).toBe('Call your bank today')
    })
  })
})