import { MarieAnneAgent } from './agent'
import { SPREAD_RULES } from './spreadRules'
import { getCachedSpreadRule } from './spreadRulesCache'
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

export async function getAIReading(request: AIReadingRequest): Promise<AIReadingResponse | null> {
  console.log('getAIReading: Generating reading with MarieAnneAgent...')
  
  try {
    // Convert request to agent format
    const spreadId = (request.spreadId || 'sentence-3') as SpreadId
    const spread = getCachedSpreadRule(spreadId)
    
    if (!spread) {
      console.error('Invalid spread ID:', spreadId)
      return createFallbackReading('Invalid spread configuration')
    }

    const cards: LenormandCard[] = request.cards.map(c => ({
      id: c.id,
      name: c.name
    }))

    const agentRequest = {
      cards,
      spread,
      question: request.question || 'What guidance do these cards have for me?'
    }

    // Generate reading structure with agent (provides template and instructions)
    const agentResponse = MarieAnneAgent.tellStory(agentRequest)
    
    console.log('Agent response generated:', {
      storyLength: agentResponse.story.length,
      deadline: agentResponse.deadline,
      task: agentResponse.task,
      timingDays: agentResponse.timingDays
    })

    // If DeepSeek is not available, use the template directly
    if (!isDeepSeekAvailable()) {
      console.log('DeepSeek not available, using template directly.')
      return {
        reading: agentResponse.story,
        deadline: agentResponse.deadline,
        task: agentResponse.task,
        timingDays: agentResponse.timingDays
      }
    }

    // Send agent's prompt to DeepSeek for generation
    const deepseekPrompt = buildPromptForDeepSeek(agentRequest, spread)
    
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
          { role: 'system', content: 'You are Marie-Anne Lenormand, a Paris salon fortune-teller. Follow all instructions precisely. Reply in plain text with no preamble or explanations.' },
          { role: 'user', content: deepseekPrompt }
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
      }

      // Return agent template as fallback
      return {
        reading: agentResponse.story,
        deadline: agentResponse.deadline,
        task: agentResponse.task,
        timingDays: agentResponse.timingDays
      }
    }

    const data = await response.json()
    console.log('DeepSeek API response data received')
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.log('No content in DeepSeek response, using agent template')
      return {
        reading: agentResponse.story,
        deadline: agentResponse.deadline,
        task: agentResponse.task,
        timingDays: agentResponse.timingDays
      }
    }

    const trimmedContent = content.trim()

    // Validate that all cards are referenced with parentheses format
    const validation = MarieAnneAgent.validateCardReferences(trimmedContent, cards, cards.length)
    
    if (!validation.isValid) {
      console.warn('Reading validation issues:', validation.issues)
      // If validation fails for spreads >= 9 cards, use agent template
      if (cards.length >= 9) {
        console.warn('Using agent template due to validation failure')
        return {
          reading: agentResponse.story,
          deadline: agentResponse.deadline,
          task: agentResponse.task,
          timingDays: agentResponse.timingDays
        }
      }
    }

    return {
      reading: trimmedContent,
      deadline: agentResponse.deadline,
      task: agentResponse.task,
      timingDays: agentResponse.timingDays
    }
  } catch (error) {
    console.error('AI reading error:', error)
    return createFallbackReading('Error generating reading')
  }
}

function createFallbackReading(reason: string): AIReadingResponse {
  return {
    reading: 'The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (Note: ' + reason + ')',
    deadline: 'by Friday evening',
    task: 'Trust yourself',
    timingDays: 4
  }
}

function buildPromptForDeepSeek(agentRequest: any, spread: any): string {
  const cardsText = agentRequest.cards.map((c: LenormandCard, i: number) => `${i + 1}. ${c.name}`).join(' — ')

  return `
You are Marie-Anne Lenormand, Paris salon fortune-teller.

QUESTION: "${agentRequest.question}"
CARDS DRAWN: ${cardsText}
SPREAD: ${spread.template.toUpperCase()} (${agentRequest.cards.length} cards)

INSTRUCTIONS:
- Write EXACTLY ${spread.sentences} sentences.
- Each sentence chains cards into ONE story, no explanations.
- Include card name in parentheses exactly once when first introduced: (CardName).
- Allow cards to be mentioned again without parentheses in natural narrative flow.
- Final sentence = YES/NO/STAY + "by [Day] evening" + imperative task.
- Use vivid metaphor (wall, weight, crack, icy, door, light, shadow).
- Brisk, deadline-first, action-last tone.

TONE EXAMPLE:
"A fog of confusion (Clouds) has settled over your hospital chats (Birds), anchoring you to the drama (Anchor). The gossip garden (Garden) is now a dead-end coffin (Coffin) where the cunning fox (Fox) digs traps under the tower's watchful eye (Tower). A sudden change (Stork) opens the conflict with Tina; you're at a crossroads (Paths) by Friday. Choose your path: stay and weather the storm or fly to calmer skies. Write your decision in the staff log before Friday evening."

NOW WRITE THE READING (exactly ${spread.sentences} sentences, no preamble):
`
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
    const spreadId = (request.spreadId || 'sentence-3') as SpreadId
    const spread = getCachedSpreadRule(spreadId)
    
    if (!spread) {
      throw new Error('Invalid spread ID: ' + spreadId)
    }

    const cards: LenormandCard[] = request.cards.map(c => ({
      id: c.id,
      name: c.name
    }))

    const agentRequest = {
      cards,
      spread,
      question: request.question || 'What guidance do these cards have for me?'
    }

    const prompt = buildPromptForDeepSeek(agentRequest, spread)

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
          { role: 'system', content: 'You are Marie-Anne Lenormand, a Paris salon fortune-teller. Follow all instructions precisely. Reply in plain text with no preamble or explanations.' },
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
