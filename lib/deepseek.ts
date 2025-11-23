import { MarieAnneAgent } from './agent'
import { SPREAD_RULES } from './spreadRules'
import { LenormandCard, SpreadId } from '@/types/agent.types'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

export interface AIReadingRequest {
  question: string
  cards: Array<{
    id: number
    name: string
    position: number
  }>
  spreadId?: string
  userLocale?: string
}

export interface AIReadingResponse {
  reading: string
  deadline?: string
  task?: string
  timingDays?: number
}

export function isDeepSeekAvailable(): boolean {
  return !!DEEPSEEK_API_KEY
}

function validateReadingLength(reading: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  if (reading.length < 50) {
    issues.push('Reading is too short - likely incomplete generation')
  }

  const sentenceCount = reading.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  if (sentenceCount > 15) {
    issues.push(`Reading exceeds reasonable length (${sentenceCount} sentences)`)
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

function buildPrompt(request: AIReadingRequest): string {
  const spreadId = (request.spreadId || 'sentence-3') as SpreadId
  const spreadRule = SPREAD_RULES[spreadId]

  const cards: LenormandCard[] = request.cards.map(c => ({
    id: c.id,
    name: c.name
  }))

  const cardsText = cards.map((c, i) => `${i + 1}. ${c.name}`).join(' — ')

  return `
You are Marie-Anne Lenormand, Paris salon fortune-teller.

QUESTION: "${request.question || 'General Reading'}"
CARDS DRAWN: ${cardsText}
SPREAD: ${spreadId.toUpperCase()} (${cards.length} cards)

INSTRUCTIONS:
- Write EXACTLY ${spreadRule.sentences} sentences.
- Each sentence chains cards into ONE story, no card explanations.
- Final sentence must end with imperative action: "send", "sign", "call", "choose", "confirm", etc.
- Never use parentheses for card names. Cards dissolve into the story.
- Never use: energy, vibes, reversed, reversed, ascending, descending.
- Use vivid metaphor (wall, weight, crack, icy, door, light, shadow, anchor).
- Brisk, conversational tone. Story first, deadline last.
- Always end with a Friday deadline.

EXAMPLE TONE:
"A close friend (Dog) ghosts you after an abrupt cut (Coffin), leaving the week stuck (Mountain). The silence breaks next Thursday—send one check-in text before then; if they don't bite, let the friendship sleep. Watch for the icy reply around Thursday evening."

NOW WRITE THE READING (exactly ${spreadRule.sentences} sentences, no preamble):
`
}

export async function getAIReading(request: AIReadingRequest): Promise<AIReadingResponse | null> {
  console.log('getAIReading: Checking availability...')
  if (!isDeepSeekAvailable()) {
    console.log('DeepSeek not available, returning fallback.')
    return {
      reading: 'The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (Note: AI analysis requires API key configuration)',
      deadline: 'by Friday',
      task: 'Trust yourself'
    }
  }

  try {
    const prompt = buildPrompt(request)

    console.log('Sending request to DeepSeek API...')
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a Lenormand fortune-teller. Follow all instructions precisely. Reply in plain paragraphs with no preamble.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 800,
        top_p: 0.9
      })
    })

    console.log('DeepSeek API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      const errorDetails = `Status: ${response.status}, Message: ${response.statusText}, Body: ${errorText}`
      console.error('DeepSeek API error:', errorDetails)

      if (response.status === 401 || response.status === 403) {
        console.error('Authentication/Authorization error - check API key')
        return {
          reading: 'The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (API authentication issue)',
          deadline: 'by Friday',
          task: 'Reconfigure API key'
        }
      }

      return {
        reading: 'The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (AI service temporarily unavailable)',
        deadline: 'by Friday',
        task: 'Try again later'
      }
    }

    const data = await response.json()
    console.log('DeepSeek API response data received')
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.log('No content in DeepSeek response')
      return {
        reading: 'The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (Unable to generate AI interpretation)',
        deadline: 'by Friday',
        task: 'Retry the reading'
      }
    }

    const trimmedContent = content.trim()
    const validation = validateReadingLength(trimmedContent)

    if (!validation.isValid) {
      console.warn('Reading validation issues:', validation.issues)
    }

    // Extract timing days from last card
    const lastCard = request.cards[request.cards.length - 1]
    const timingDays = getPipCount(lastCard.id)

    return {
      reading: trimmedContent,
      timingDays: timingDays
    }
  } catch (error) {
    console.error('AI reading error:', error)
    return {
      reading: 'The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (AI service temporarily unavailable)',
      deadline: 'by Friday',
      task: 'Try again later'
    }
  }
}

export async function streamAIReading(request: AIReadingRequest): Promise<ReadableStream<Uint8Array> | null> {
  console.log('streamAIReading: Checking availability...')
  if (!isDeepSeekAvailable()) {
    console.log('DeepSeek not available, returning fallback stream.')
    const fallbackText = 'The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (Note: AI analysis requires API key configuration)'
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackText))
        controller.close()
      }
    })
  }

  console.log('DeepSeek is available. Preparing streaming request...')

  try {
    const prompt = buildPrompt(request)

    console.log('Sending streaming request to DeepSeek API...')
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a Lenormand fortune-teller. Follow all instructions precisely. Reply in plain paragraphs with no preamble.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 800,
        top_p: 0.9,
        stream: true
      })
    })

    console.log('DeepSeek streaming API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      const errorDetails = `Status: ${response.status}, Message: ${response.statusText}, Body: ${errorText}`
      console.error('DeepSeek streaming API error:', errorDetails)

      if (response.status === 401 || response.status === 403) {
        console.error('Authentication/Authorization error - check API key')
      }

      throw new Error('DeepSeek API error: ' + response.statusText)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    return response.body
  } catch (error) {
    console.error('AI reading setup error:', error)
    throw error
  }
}

function getPipCount(cardId: number): number {
  if (cardId > 30) return 4
  if (cardId === 10 || cardId === 20 || cardId === 30) return 10
  return cardId % 10 || 10
}
