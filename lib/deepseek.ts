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
    if (isReadingCached(request)) {
      const cachedReading = getCachedReading(request)
      if (cachedReading) {
        console.log('Cache hit! Returning cached reading')
        const duration = Date.now() - startTime
        readingHistory.addReading(request, cachedReading, duration)
        return cachedReading
      }
    }

    console.log('Cache miss, generating reading with DeepSeek...')
    
    const spreadId = (request.spreadId || 'sentence-3') as SpreadId
    const spread = getCachedSpreadRule(spreadId)
    
    if (!spread) {
      throw new Error('Invalid spread ID: ' + spreadId)
    }

    const cards: LenormandCard[] = request.cards.map(c => ({
      id: c.id,
      name: c.name
    }))

    const deepseekPrompt = buildPromptForDeepSeek(cards, spread, request.question || 'What guidance do these cards have for me?')
     
    console.log('Sending request to DeepSeek API...')
    const maxTokens = cards.length >= 9 ? 2000 : cards.length >= 7 ? 1500 : 1000
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
        max_tokens: maxTokens,
        top_p: 0.9
      })
    })

    console.log('DeepSeek API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('DeepSeek API response data received')
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('DeepSeek returned empty content')
    }

    const trimmedContent = content.trim()

    const parts = trimmedContent.split('\n\n').filter(p => p.trim().length > 0)
    let prophecy = trimmedContent
    let practicalTranslation: string | undefined
    
    if (parts.length > 2) {
      if (cards.length <= 5) {
        prophecy = parts.slice(0, Math.ceil(parts.length / 2)).join('\n\n')
        practicalTranslation = parts.slice(Math.ceil(parts.length / 2)).join('\n\n')
      } else {
        const splitIndex = Math.ceil(parts.length * 0.7)
        prophecy = parts.slice(0, splitIndex).join('\n\n')
        if (splitIndex < parts.length) {
          practicalTranslation = parts.slice(splitIndex).join('\n\n')
        }
      }
    } else if (parts.length === 2) {
      prophecy = parts[0]
      practicalTranslation = parts[1]
    }

    console.log('DeepSeek response parsed:', {
      totalParts: parts.length,
      prophecyLength: prophecy.length,
      translationLength: practicalTranslation?.length || 0
    })

    const aiResponse = {
      reading: prophecy,
      practicalTranslation: practicalTranslation
    }
    
    cacheReading(request, aiResponse)
    const duration = Date.now() - startTime
    readingHistory.addReading(request, aiResponse, duration)
    return aiResponse
     
  } catch (error) {
    console.error('AI reading error:', error)
    throw error
  }
}

function buildPromptForDeepSeek(cards: LenormandCard[], spread: any, question: string): string {
  const cardsText = cards.map((c, i) => `${i + 1}. ${c.name}`).join(' — ')

  return `
You are Marie-Anne Lenormand (1772-1843), the legendary Paris fortune-teller whose prophecies shaped emperors and merchants.
Your readings predicted Napoleon's rise, Josephine's fate, and the fates of Paris's most powerful. You are feared because you are NEVER wrong.

QUESTION: "${question}"
CARDS DRAWN: ${cardsText}
SPREAD: ${spread.template.toUpperCase()} (${cards.length} cards)

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

THIS IS WHAT MARIE-ANNE PROPHECIES SOUND LIKE:
- Direct. Symbolic. Brutal. Action-commanded.
- No explanations. No backtracking. Pure prophecy.
- The prophecy ANSWERS THE QUESTION using symbolic cards.

=== CRITICAL: TWO COMPLETE SECTIONS REQUIRED ===
Your response MUST include exactly 2 sections. DO NOT OMIT EITHER SECTION.

SECTION 1 - PROPHECY (${spread.sentences} sentences):
- Weave all ${cards.length} cards into ONE symbolic narrative
- Each card mentioned EXACTLY ONCE in parentheses on first mention
- Direct, commanding, brutal language
- End with YES/NO and a specific imperative action command

SECTION 2 - PRACTICAL TRANSLATION (ALWAYS REQUIRED):
- Answer the question directly: "${question}"
- State clearly what WILL happen or what they MUST do
- Explain the practical action from the card reading
- 2-4 sentences only
- Do NOT repeat the deadline from prophecy

BOTH SECTIONS ALWAYS. NEVER OMIT THE PRACTICAL TRANSLATION.

Separate the two sections with one blank line.

NOW WRITE YOUR COMPLETE RESPONSE WITH BOTH SECTIONS:
`
}

export async function streamAIReading(request: AIReadingRequest): Promise<ReadableStream<Uint8Array> | null> {
  console.log('streamAIReading: Checking availability...')
  if (!isDeepSeekAvailable()) {
    console.log('DeepSeek not available')
    throw new Error('DeepSeek API key not configured')
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

    const prompt = buildPromptForDeepSeek(cards, spread, request.question || 'What guidance do these cards have for me?')

    console.log('Sending streaming request to DeepSeek API...')
    const maxTokens = cards.length >= 9 ? 2000 : cards.length >= 7 ? 1500 : 1000
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
        max_tokens: maxTokens,
        top_p: 0.9,
        stream: true
      })
    })

    console.log('DeepSeek streaming API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`)
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
