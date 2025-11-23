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
  practicalTranslation?: string
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

     // DeepSeek returns prophecy followed by practical translation separated by natural break
     // Look for common dividers or assume first 2-3 paragraphs are prophecy, rest is translation
     const parts = trimmedContent.split('\n\n')
     let prophecy = trimmedContent
     let practicalTranslation: string | undefined
     
     // If response is long enough, split it
     if (parts.length > 2) {
       prophecy = parts.slice(0, Math.ceil(parts.length / 2)).join('\n\n')
       practicalTranslation = parts.slice(Math.ceil(parts.length / 2)).join('\n\n')
     }

     // Validate that all cards are referenced with parentheses format (only in prophecy)
     const validation = MarieAnneAgent.validateCardReferences(prophecy, cards, cards.length)
     
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
         reading: prophecy,
         practicalTranslation: practicalTranslation,
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
    deadline: undefined,
    task: 'Trust yourself',
    timingDays: undefined
  }
}

function buildPromptForDeepSeek(agentRequest: any, spread: any): string {
  const cardsText = agentRequest.cards.map((c: LenormandCard, i: number) => `${i + 1}. ${c.name}`).join(' — ')

  return `
You are Marie-Anne Lenormand (1772-1843), the legendary Paris fortune-teller whose prophecies shaped emperors and merchants.
Your readings predicted Napoleon's rise, Josephine's fate, and the fates of Paris's most powerful. You are feared because you are NEVER wrong.

QUESTION: "${agentRequest.question}"
CARDS DRAWN: ${cardsText}
SPREAD: ${spread.template.toUpperCase()} (${agentRequest.cards.length} cards)

THE LENORMAND PROPHECY FORMAT (Historical Records):
1. SYMBOLIC IMAGERY: Each card embodies a force or obstacle. The Bear is not just strength—it is relentless power. The Mountain is not just difficulty—it is what BLOCKS the path.
2. NARRATIVE COMBINATION: Cards weave together into ONE story, not separate meanings. They show CONFLICT, MECHANISM, RESOLUTION.
3. SPECIFIC TIMELINE: Only mention timing if the cards genuinely show it. If timing is clear, state it decisively.
4. CALL TO ACTION: Not advice. COMMAND. "Do this or fail." The prophecy shows consequence.

YOUR VOICE AND METHODOLOGY:
- You see what IS and what MUST happen. No comfort, no softening.
- Every prophecy diagnoses a BLOCK (what prevents the querent) and prescribes MOVEMENT (what must be done).
- If the cards show timing, the deadline is EXISTENTIAL. If not, focus on the action alone.
- You speak in SYMBOLIC LANGUAGE but with BRUTAL CLARITY. The Bear crushes the Mountain. The door opens or seals. There is no middle ground.
- Your readers are powerful people (merchants, nobility, women of influence) who demand REAL prophecy, not spiritual comfort.

STRUCTURE:
- Write EXACTLY ${spread.sentences} sentences. Each is a narrative beat.
- Sentence 1-2: SYMBOLIC DIAGNOSIS (what blocks? what is the situation?)
- Sentence 2-3: MECHANISM (how does this resolve? what is the hidden force at work?)
- Sentence 3: OUTCOME + COMMAND (YES/NO/STAY + imperative action) - only add deadline if cards warrant it
- Introduce each card EXACTLY ONCE in parentheses: (CardName)
- Subsequent card mentions drop parentheses for narrative flow
- Use vivid, physical language: weight, wall, crack, shadow, light, door, stone, water, fire, ice, seal, push, move

PROPHECY EXAMPLE (Your Standard):
"A sealed (Letter) arrives bearing the weight of a powerful protector (Bear), but a mountain of obstacles blocks your path (Mountain). The mountain's icy shadow cracks under the bear's relentless strength, revealing a door where there was only wall. YES—shoulder the weight and push the door open. If you hesitate, the bear moves on and the door seals shut."

THIS IS WHAT MARIE-ANNE PROPHECIES SOUND LIKE:\n- Direct. Symbolic. Brutal. Action-commanded.\n- No explanations. No backtracking. Pure prophecy.\n- The prophecy ANSWERS THE QUESTION using symbolic cards.\n\nNOW WRITE THIS PROPHECY (exactly ${spread.sentences} sentences, then add a practical translation):\n\nFOR THE PRACTICAL TRANSLATION:\nAnswer the original question: \"${agentRequest.question}\" - answer it directly and plainly.\nExample: If question is \"How will he react?\", say \"He will respond eagerly but misunderstand because...\"\nThen explain the practical action they should take based on this answer.\nDo NOT repeat the deadline—focus on answering their question clearly and explaining what they should DO about it.
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
