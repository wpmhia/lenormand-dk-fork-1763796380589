import { SPREAD_RULES } from './spreadRules'
import { getCachedSpreadRule } from './spreadRulesCache'
import { getCachedReading, cacheReading, isReadingCached } from './readingCache'
import { readingHistory } from './readingHistory'
import { LenormandCard, SpreadId } from '@/types/agent.types'
import { getLanguageInstruction, getLanguageConfig } from './languages'

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
  includeProphecy?: boolean
}

export interface AIReadingResponse {
  reading: string
  practicalTranslation?: string
  deadline?: string
  task?: string
  timingDays?: number
  aiInterpretationId?: string
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
        await readingHistory.addReading(request, cachedReading, duration)
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

    const deepseekPrompt = buildPromptForDeepSeek(cards, spread, request.question || 'What guidance do these cards have for me?', spreadId, request.includeProphecy, request.userLocale)
     
     console.log('Sending request to DeepSeek API...')
     let maxTokens: number
     if (cards.length >= 36) maxTokens = 3500
     else if (cards.length >= 9) maxTokens = 2200
     else if (cards.length >= 7) maxTokens = 1800
     else if (cards.length >= 5) maxTokens = 1500
     else maxTokens = 1200
      const langConfig = getLanguageConfig(request.userLocale)
      const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
         body: JSON.stringify({
           model: 'deepseek-chat',
           messages: [
             { role: 'system', content: `You are Marie-Anne Lenormand. Follow all instructions. Reply in plain text only. Always respond in ${langConfig.name}.` },
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

     const aiResponse = {
       reading: trimmedContent,
       practicalTranslation: undefined
     }
    
    cacheReading(request, aiResponse)
    const duration = Date.now() - startTime
    await readingHistory.addReading(request, aiResponse, duration)
    return aiResponse
     
  } catch (error) {
    console.error('AI reading error:', error)
    throw error
  }
}

function buildPromptForDeepSeek(cards: LenormandCard[], spread: any, question: string, spreadId?: string, includeProphecy: boolean = false, userLocale?: string): string {
   const cardsText = cards.map((c, i) => `${i + 1}. ${c.name}`).join(' — ')
   const isYesNoSpread = spreadId === 'yes-no-maybe'
   const isWeekAheadSpread = spreadId === 'week-ahead'
   const langConfig = getLanguageConfig(userLocale)
   const languageInstructions: Record<string, string> = {
     en: 'Respond in English.',
     fr: 'Réponds en français.',
     es: 'Responde en español.',
     de: 'Antworte auf Deutsch.',
     it: 'Rispondi in italiano.',
     pt: 'Responda em português.',
     nl: 'Antwoord in het Nederlands.',
     ja: '日本語で答えてください。',
     zh: '用中文回答。',
     ru: 'Ответьте на русском языке.',
     da: 'Svar på dansk.'
   }

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
${isWeekAheadSpread ? `- Each sentence covers one day: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- Format: "MONDAY: [card in parentheses] brings [meaning]. TUESDAY: [card in parentheses] shows [meaning]." etc.
- Each card mentioned EXACTLY ONCE in parentheses on its day
- Connect days into a narrative arc showing progression through the week` : `- Sentence 1-2: SYMBOLIC DIAGNOSIS (what blocks? what is the situation?)
- Sentence 2-3: MECHANISM (how does this resolve? what is the hidden force at work?)
- Sentence 3: OUTCOME + COMMAND${isYesNoSpread ? ' (YES/NO/MAYBE + imperative action)' : ' (imperative action) - only add deadline if cards warrant it'}
- Introduce each card EXACTLY ONCE in parentheses: (CardName)
- Subsequent card mentions drop parentheses for narrative flow
- Use vivid, physical language: weight, wall, crack, shadow, light, door, stone, water, fire, ice, seal, push, move`}

PROPHECY EXAMPLE (Your Standard):
${isWeekAheadSpread ? '"MONDAY: (Rider) arrives with news. TUESDAY: (Clouds) obscure the path—friction and confusion. WEDNESDAY: (Birds) bring clarity through conversation. THURSDAY: (Key) unlocks the solution. FRIDAY: (Sun) breaks through, bringing relief and social ease. SATURDAY: (Garden) invites reflection and rest. SUNDAY: (Lily) settles the week in peaceful completion."' : isYesNoSpread ? '"YES—the path opens before you. (Letter) carries the answer sealed within. (Sun) breaks through (Clouds), revealing your choice is already made. Move forward without hesitation."' : '"A sealed (Letter) arrives bearing the weight of a powerful protector (Bear), but a mountain of obstacles blocks your path (Mountain). The mountain\'s icy shadow cracks under the bear\'s relentless strength, revealing a door where there was only wall. Shoulder the weight and push the door open."'}

THIS IS WHAT MARIE-ANNE PROPHECIES SOUND LIKE:
- Direct. Symbolic. Brutal. Action-commanded.
- No explanations. No backtracking. Pure prophecy.
- The prophecy ANSWERS THE QUESTION using symbolic cards.

=== YOUR PROPHECY (${spread.sentences} sentences) ===
Your response should be ONLY the prophecy. No explanations, no translations, no sections.

THE PROPHECY:
- Weave all ${cards.length} cards into ONE symbolic narrative in ${langConfig.name}
- Each card mentioned EXACTLY ONCE in parentheses on first mention
- Direct, commanding, brutal language
${isYesNoSpread ? '- End with YES or NO or MAYBE, then give a specific imperative action command' : '- End with a specific imperative action command'}
- Write this ENTIRE prophecy in ${langConfig.name}
${languageInstructions[langConfig.code] ? `- Remember: ${languageInstructions[langConfig.code]}` : ''}
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

       const prompt = buildPromptForDeepSeek(cards, spread, request.question || 'What guidance do these cards have for me?', spreadId, request.includeProphecy, request.userLocale)

      console.log('Sending streaming request to DeepSeek API...')
      let maxTokens: number
      if (cards.length >= 36) maxTokens = 3500
      else if (cards.length >= 9) maxTokens = 2200
      else if (cards.length >= 7) maxTokens = 1800
      else if (cards.length >= 5) maxTokens = 1500
      else maxTokens = 1200
       const langConfig = getLanguageConfig(request.userLocale)
       const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
         body: JSON.stringify({
           model: 'deepseek-chat',
           messages: [
             { role: 'system', content: `You are Marie-Anne Lenormand. Follow all instructions. Reply in plain text only. Always respond in ${langConfig.name}.` },
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
