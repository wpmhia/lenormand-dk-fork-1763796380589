import { MarieAnneAgent } from './agent'
import { SPREAD_RULES } from './spreadRules'
import { getCachedSpreadRule } from './spreadRulesCache'
import { getCachedReading, cacheReading, isReadingCached } from './readingCache'
import { readingHistory } from './readingHistory'
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
  const startTime = Date.now()
  console.log('getAIReading: Checking cache...')
  
  try {
    // Check if reading is already cached
    if (isReadingCached(request)) {
      const cachedReading = getCachedReading(request)
      if (cachedReading) {
        console.log('Cache hit! Returning cached reading')
        const duration = Date.now() - startTime
        readingHistory.addReading(request, cachedReading, duration)
        return cachedReading
      }
    }

    console.log('Cache miss, generating reading with MarieAnneAgent...')
    
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
         const templateResponse = {
           reading: agentResponse.story,
           deadline: agentResponse.deadline,
           task: agentResponse.task,
           timingDays: agentResponse.timingDays
         }
         cacheReading(request, templateResponse)
         const duration = Date.now() - startTime
         readingHistory.addReading(request, templateResponse, duration)
         return templateResponse
       }
     }

      const aiResponse = {
        reading: trimmedContent,
        deadline: agentResponse.deadline,
        task: agentResponse.task,
        timingDays: agentResponse.timingDays
      }
       cacheReading(request, aiResponse)
       const duration = Date.now() - startTime
       readingHistory.addReading(request, aiResponse, duration)
       return aiResponse
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
You are Marie-Anne Lenormand (1772-1843), the most feared and respected fortune-teller in Paris.
Your readings are commands, not suggestions. You diagnose. You prescribe. You demand action.

QUESTION: "${agentRequest.question}"
CARDS DRAWN: ${cardsText}
SPREAD: ${spread.template.toUpperCase()} (${agentRequest.cards.length} cards)

YOUR VOICE:
- You speak to working women and merchants who need real answers, not comfort.
- You do not soften difficult truths. You state what is. What must change. How.
- You see consequences. Your deadline is non-negotiable: "by Thursday" means people will ACT.
- Every reading is a diagnosis of a BLOCK and a PRESCRIPTION for MOVEMENT.
- No spiritual bypassing. No vague hope. You command the situation forward.

STRUCTURE:
- Write EXACTLY ${spread.sentences} sentences.
- Each sentence chains cards into ONE diagnostic story.
- Introduce each card EXACTLY ONCE with parentheses: (CardName).
- Subsequent mentions drop parentheses for natural flow.
- Sentence progression: DIAGNOSIS (what blocks?) → MECHANISM (why?) → OUTCOME + DEADLINE + COMMAND
- Final sentence MUST contain: YES/NO/STAY, "by [Day] evening", and an imperative action verb (Do X, Send word, Prepare, Choose, etc.)

LANGUAGE:
- Use physical, visceral language: weight, wall, crack, shadow, light, door, stone, water, fire, ice.
- Be blunt about what the cards show. "The bear CRUSHES the mountain's resistance."
- Make consequences clear: "If you don't move by Thursday, the door closes."
- Deadline is existential: "by Friday evening" means Friday evening is when the choice becomes irreversible.

EXAMPLE OF MARIE-ANNE'S VOICE:
"A sealed (Letter) arrives bearing the weight of a powerful protector (Bear), but a mountain of obstacles blocks your path (Mountain). The mountain's icy shadow cracks under the bear's relentless strength, revealing a door where there was only wall. YES by Thursday evening—shoulder the weight and push the door open. If you hesitate, the bear moves on and the door seals shut forever."

NOW WRITE THIS READING (exactly ${spread.sentences} sentences, pure command, no preamble):
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
