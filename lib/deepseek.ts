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
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
       body: JSON.stringify({
         model: 'deepseek-chat',
         messages: [
           { role: 'system', content: 'You are Marie-Anne Lenormand. Follow all instructions. Reply in plain text only. ' + getLanguageInstruction(request.userLocale) },
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

    // Split by ### markers that separate the two required sections
    const sections = trimmedContent.split('###').map(s => s.trim()).filter(s => s.length > 0)
    
    let prophecy = trimmedContent
    let practicalTranslation: string | undefined
    
    if (sections.length >= 2) {
      // First section is prophecy, second is practical translation
      prophecy = sections[0]
      practicalTranslation = sections[1]
    }

    console.log('DeepSeek response parsed:', {
      sectionCount: sections.length,
      prophecyLength: prophecy.length,
      translationLength: practicalTranslation?.length || 0
    })

    const aiResponse = {
      reading: prophecy,
      practicalTranslation: practicalTranslation
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

=== CRITICAL: TWO COMPLETE SECTIONS REQUIRED ===
Your response MUST include exactly 2 sections. DO NOT OMIT EITHER SECTION.

SECTION 1 - THE PROPHECY (${spread.sentences} sentences):
- Weave all ${cards.length} cards into ONE symbolic narrative
- Each card mentioned EXACTLY ONCE in parentheses on first mention
- Direct, commanding, brutal language
${isYesNoSpread ? '- End with YES or NO or MAYBE, then give a specific imperative action command' : '- End with a specific imperative action command'}

###

SECTION 2 - THE EXPLANATION:
Your job: Take the prophecy above and TRANSLATE it into plain, everyday language in ${langConfig.name}.
A person who has never heard of Lenormand should understand the full answer by reading ONLY this section.

DO NOT:
- Retell the prophecy in different words
- Use card names
- Use symbolic language
- Use ANY mystical language ("lunar cycles", "cosmic timing", "the universe", "the key", etc.)

DO THIS:
${isWeekAheadSpread ? `- Break down each day with CONCRETE guidance
- Format EXACTLY like this: "MONDAY: [specific action/focus]. TUESDAY: [specific action/focus]." etc.
- Make each day actionable and specific
- Show progression: early week is about [X], midweek shifts to [Y], late week brings [Z]
- Include obstacles on the days when they appear, and solutions when they emerge
- Make it clear what the person should DO on each day, not just what will happen` : `- State the direct answer to: "${question}"
- Explain the main OBSTACLES blocking the outcome
- Explain what NEEDS TO HAPPEN for change
- List SPECIFIC ACTIONS the querent must take

${cards.length >= 36 ? '- 12-18 sentences: Break down: Current situation → Main obstacles → What must change → Specific actions → Likelihood of success' : cards.length >= 9 ? '- 6-10 sentences: Situation → Obstacles → What needs to change → Actions needed' : cards.length >= 7 ? '- 5-8 sentences: Current state → Key challenges → Required changes → Actions' : cards.length >= 5 ? '- 4-6 sentences: Situation → Challenge → Resources → Next steps' : '- 2-3 sentences: Direct answer'}`}

EXAMPLE (what GOOD plain English looks like for WEEK-AHEAD):
"MONDAY: New information or communication arrives—stay alert and open to what's coming. TUESDAY: Expect confusion or mixed signals; don't make major decisions yet. WEDNESDAY: Conversations clarify the situation; speak up if you've been quiet. THURSDAY: A breakthrough solution becomes visible; this is your pivot point. FRIDAY: Things ease up noticeably; social situations and relationships improve. SATURDAY: Take time to rest and reflect on what you've learned this week. SUNDAY: A sense of closure and peace settles in; use this to prepare for next week."

EXAMPLE (what GOOD plain English looks like for OTHER spreads):
"YES, Kristoffer will be able to talk, but it will not happen easily or quickly. The primary obstacle is a complex combination of a deep-seated medical or neurological condition and his current environment. There is also a risk of receiving incorrect advice from certain specialists. The situation requires a complete transformation in approach, moving to a fundamentally different method, likely involving a new specialist. You must secure a stable daily routine, seek multiple medical opinions, demand a full review of all diagnoses, involve a supportive community, and implement a specific practice regimen. Be prepared for setbacks. Success is highly likely only if you commit fully to these major changes. If you continue on the current path, nothing will change. The key is to stop what you are doing now and pursue a completely new strategy with determination."

EXAMPLE OF WRONG (what NOT to do in Section 2):
"A silent child carries the weight of a sealed book. Dark clouds obscure the path forward. The mountain is an immovable wall, and a fox whispers deception in the shadows. Yet a key gleams within the garden of community."
^ This is WRONG - it's the prophecy restated in different words. Still symbolic, still retelling the cards.

NOW WRITE BOTH SECTIONS SEPARATED BY ###. DO NOT INCLUDE THE ### IN THE OUTPUT - LET IT BE YOUR SEPARATOR ONLY.

${isWeekAheadSpread ? 'CRITICAL FOR WEEK-AHEAD: The Explanation section (Section 2) MUST follow the day-by-day format. Each day from Monday through Sunday must be clearly labeled and given specific, actionable guidance. This is the most important part for the user to understand their week.' : ''}
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
     const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
       body: JSON.stringify({
         model: 'deepseek-chat',
         messages: [
           { role: 'system', content: 'You are Marie-Anne Lenormand. Follow all instructions. Reply in plain text only. ' + getLanguageInstruction(request.userLocale) },
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
