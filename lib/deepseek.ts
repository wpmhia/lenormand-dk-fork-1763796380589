import { Card, ReadingCard } from './types'

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

// CARD-BASED TIMING GUIDE - Extracted from traditional Lenormand meanings
// These timings are based on the card's inherent nature and are used to ground when/where tags
const CARD_TIMING: Record<number, { name: string; timing: string; location?: string }> = {
  1: { name: 'Rider', timing: 'within days', location: 'on the move, via message' },
  2: { name: 'Clover', timing: 'within a week', location: 'brief moment, small luck' },
  3: { name: 'Ship', timing: 'within 1-2 weeks', location: 'distance, travel, abroad' },
  4: { name: 'House', timing: 'lasting, stable', location: 'at home, family gathering' },
  5: { name: 'Tree', timing: 'slow, long-term growth', location: 'over months, roots deepen' },
  6: { name: 'Clouds', timing: 'unclear timing', location: 'uncertain, pending clarity' },
  7: { name: 'Snake', timing: 'deceptive delay', location: 'through complication, indirect path' },
  8: { name: 'Coffin', timing: 'ending, finalizing', location: 'closure, conclusion imminent' },
  9: { name: 'Bouquet', timing: 'soon, joyful', location: 'social gathering, celebration' },
  10: { name: 'Scythe', timing: 'sudden, immediate', location: 'sharp, unexpected moment' },
  11: { name: 'Whip', timing: 'repetitive cycle', location: 'argument, tension, conflict zone' },
  12: { name: 'Birds', timing: 'quick conversation', location: 'dialogue, phone call, group chat' },
  13: { name: 'Child', timing: 'small beginnings', location: 'fresh start, new situation' },
  14: { name: 'Fox', timing: 'strategic delay', location: 'workplace, through self-interest' },
  15: { name: 'Bear', timing: 'powerful, controlling', location: 'authority figure, leadership role' },
  16: { name: 'Stars', timing: 'night-time, evening', location: 'internet, digital realm, guidance' },
  17: { name: 'Stork', timing: 'change coming', location: 'relocation, transition period' },
  18: { name: 'Dog', timing: 'loyal, steadfast', location: 'close relationship, reliable friend' },
  19: { name: 'Tower', timing: 'institutional pace', location: 'government, company, authority' },
  20: { name: 'Garden', timing: 'public, social', location: 'social media, public event, gathering' },
  21: { name: 'Mountain', timing: 'slow, delayed', location: 'obstacle blocking path' },
  22: { name: 'Crossroad', timing: 'decision point', location: 'choice moment, fork in path' },
  23: { name: 'Mice', timing: 'gradual erosion', location: 'stress accumulating, small losses' },
  24: { name: 'Heart', timing: 'emotional reality', location: 'intimate space, close to heart' },
  25: { name: 'Ring', timing: 'cyclical, contracted', location: 'commitment ceremony, bound agreement' },
  26: { name: 'Book', timing: 'hidden, secret', location: 'confidential, documents, education' },
  27: { name: 'Letter', timing: 'written, formal', location: 'inbox, email, official correspondence' },
   28: { name: 'Man', timing: 'present moment', location: 'the focus person, center of attention' },
   29: { name: 'Woman', timing: 'present moment', location: 'the other key person, another player' },
  30: { name: 'Lily', timing: 'peaceful, elder', location: 'home comfort, winter season' },
  31: { name: 'Sun', timing: 'daytime, success', location: 'bright, visible, public domain' },
  32: { name: 'Moon', timing: 'evening, cycles', location: 'night, emotions, recognition' },
  33: { name: 'Key', timing: 'immediate solution', location: 'unlock, answer appears' },
  34: { name: 'Fish', timing: 'flowing, business', location: 'money flow, business transaction' },
  35: { name: 'Anchor', timing: 'long-term stability', location: 'secure port, lasting foundation' },
  36: { name: 'Cross', timing: 'burden, destiny', location: 'weight upon you, fate\'s moment' }
}

// Pip count helper (Marie Ann Lenormand timing)
function getPipCount(cardId: number): number {
  if (cardId > 30) return 4 // 31-36 are court cards
  if (cardId === 10) return 10
  if (cardId === 20) return 10
  if (cardId === 30) return 10
  return cardId % 10 || 10
}

// Check for delay cards (Mountain, Cross near significator)
function hasDelayBlock(cards: Array<{id: number; name: string}>): boolean {
  const delayCards = ['Mountain', 'Cross']
  return cards.some(c => delayCards.includes(c.name))
}

// Check if DeepSeek is available
export function isDeepSeekAvailable(): boolean {
  return !!process.env.DEEPSEEK_API_KEY
}

// Simple AI Reading request interface
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

// Simple AI Reading response interface
export interface AIReadingResponse {
  reading: string
  timingDays?: number
  timingType?: 'days' | 'weeks'
}

// Validation helper functions
function extractCardNamesFromReading(reading: string): string[] {
  const cardNames = Object.values(CARD_TIMING).map(c => c.name)
  const foundCards: string[] = []
  
  for (const cardName of cardNames) {
    if (reading.includes(`(${cardName})`) || reading.includes(cardName)) {
      foundCards.push(cardName)
    }
  }
  
  return foundCards
}

function validateReading(reading: string, drawnCards: Array<{name: string}>, spreadId?: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  const drawnCardNames = drawnCards.map(c => c.name)
  const mentionedCards = extractCardNamesFromReading(reading)
  
  if (reading.length < 50) {
    issues.push('Reading is too short - likely incomplete generation')
  }
  
  const hallucinations = mentionedCards.filter(card => !drawnCardNames.includes(card))
  if (hallucinations.length > 0) {
    issues.push(`Hallucinated cards detected: ${hallucinations.join(', ')}`)
  }
  
  const unmentionedCards = drawnCardNames.filter(
    card => !reading.includes(`(${card})`) && !reading.includes(card)
  )
  if (unmentionedCards.length > drawnCardNames.length * 0.5) {
    issues.push(`Too many drawn cards not mentioned in reading`)
  }
  
  const forbiddenTerms = ['energy', 'vibes', 'universe', 'spiritual growth', 'ascending', 'descending', 'reversed']
  const foundForbidden = forbiddenTerms.filter(term => reading.toLowerCase().includes(term))
  if (foundForbidden.length > 0) {
    issues.push(`Found forbidden terms: ${foundForbidden.join(', ')}`)
  }

  // Check for 5-step narrative structure: friction → release → verdict
  const frictionCards = ['Mountain', 'Whip', 'Mice', 'Snake', 'Clouds', 'Coffin', 'Cross', 'Tower', 'Book']
  const releaseCards = ['Key', 'Sun', 'Rider', 'Scythe', 'Bouquet', 'Heart', 'Dog', 'Stars', 'Letter']
  const verdictCards = ['Sun', 'Key', 'Clover', 'Bouquet', 'Heart', 'Dog', 'Stars', 'Moon', 'Anchor', 'Coffin', 'Whip', 'Mice', 'Snake', 'Mountain', 'Cross']
  
  const hasFriction = mentionedCards.some(card => frictionCards.includes(card))
  const hasRelease = mentionedCards.some(card => releaseCards.includes(card))
  const hasVerdict = drawnCards.length > 0 && verdictCards.includes(drawnCards[drawnCards.length - 1].name)
  
  if (drawnCards.length >= 3 && !hasFriction) {
    issues.push('No friction/block cards detected—unclear what the core tension is')
  }
  if (drawnCards.length >= 3 && !hasRelease) {
    issues.push('No release/unlock cards detected—missing the turning point')
  }

  // Check for Mountain/Cross delay rule (Marie Ann Lenormand)
  if (hasDelayBlock(drawnCards) && drawnCards.length >= 1) {
    if (!reading.toLowerCase().includes('unclear') && !reading.toLowerCase().includes('return') && !reading.toLowerCase().includes('delay')) {
      issues.push('Delay rule: Mountain/Cross detected but reading does not acknowledge the delay—should say "Return when obstacle passes"')
    }
  }

  // Check for imperative exit sentence (Marie-Anne rule #4)
  const imperatives = ['sign', 'update', 'contact', 'call', 'send', 'book', 'submit', 'confirm', 'wait', 'schedule', 'reach']
  const hasImperative = imperatives.some(verb => reading.toLowerCase().includes(verb))
  if (!hasImperative) {
    issues.push('Missing actionable exit—final sentence should be imperative (sign, update, contact, etc.)')
  }

  // Check for 5-sentence cap (Marie-Anne rule #3)
  const sentenceCount = reading.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  if (sentenceCount > 5) {
    issues.push(`Reading exceeds 5-sentence cap (${sentenceCount} found)—condense to 5 or fewer.`)
  }

  if (spreadId === 'yes-no-maybe' && drawnCards.length >= 3) {
    const lastCard = drawnCards[drawnCards.length - 1].name
    const positiveCards = ['Sun', 'Key', 'Clover', 'Bouquet', 'Heart', 'Dog', 'Stars', 'Moon', 'Anchor']
    const negativeCards = ['Coffin', 'Whip', 'Mice', 'Snake', 'Mountain', 'Cross', 'Scythe', 'Clouds']
    
    const readingStart = reading.toLowerCase().trim()
    const startsWithYes = readingStart.startsWith('yes')
    const startsWithNo = readingStart.startsWith('no')
    const startsWithMaybe = readingStart.startsWith('maybe')
    
    if (positiveCards.includes(lastCard) && !startsWithYes) {
      issues.push(`Yes/No: Last card is ${lastCard} (positive), but reading doesn't start with "YES"`)
    } else if (negativeCards.includes(lastCard) && !startsWithNo) {
      issues.push(`Yes/No: Last card is ${lastCard} (negative), but reading doesn't start with "NO"`)
    } else if (!positiveCards.includes(lastCard) && !negativeCards.includes(lastCard) && !startsWithMaybe) {
      issues.push(`Yes/No: Last card is ${lastCard} (neutral), but reading doesn't start with "MAYBE"`)
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}
// UNIFIED LENORMAND STYLE - Applied to all spreads identically
const LENORMAND_STYLE = `You are a Lenormand fortune-teller. Follow these rules exactly:

MARIE ANN LENORMAND PRINCIPLES (non-negotiable):
- No reversals ever. The card is the card; only its neighbours change it.
- Read as chronological ribbon from significator to outcome card. No jumping around.
- Use 2-card sentences: "Book + Tower = sealed document in institution" (one unit, not two ideas).
- Timing = pip count of outcome card (Court=4, Ace=1, 10=10 days; round to nearest Friday/month-start).
- DELAY RULE: If Mountain or Cross touches significator, say the answer is unclear—"Return when the obstacle passes."
- Final sentence MUST be actionable: "Sign before the next full moon" not "The future is bright."

MARIE_ANNE_MICRO_MANUAL (apply to every spread):
1. TWO-CARD SENTENCES ONLY: Every clause = pair. "Book + Tower = sealed document inside authority." Never single-card meanings.
2. PIP-TIMING IN PLAIN SIGHT: End with "Card 15 (Bear) = 5 days → watch for Friday." (Court=4, Ace=1, 10=10, cap 14 → Friday/month-start).
3. THREE-BEAT STORY: Beat 1 (friction pair). Beat 2 (release pair). Beat 3 (verdict pair + pip-timing + action). Cap 5 sentences total.
4. ACTIONABLE EXIT SENTENCE: Last clause = imperative. "Sign before Friday 5pm," "Update CV this weekend," etc. Not vague.
5. NO REVERSALS, JARGON, DEVICE LISTS: Use upright keywords only. Say "email" once, not "phone/computer/Wi-Fi."
6. RECORD PREDICTION (optional): Store verdict + deadline in DB; flag prompt if it misses twice.

UNIVERSAL 5-STEP STRUCTURE (applies to all spreads):
1. SPOT THE BLOCK: Find the friction pair (two touching cards that clash or stall). Friction cards: Mountain, Snake, Fox, Clouds, Cross, Coffin, Whip, Mice. Example: Mountain–Book = blocked. This = core tension opening.
2. FIND THE RELEASE: Look for unlock/cut/flow pair later in line. Unlock cards: Key, Scythe, Rider, Letter, Sun, Stars, Clover. Flow cards: Ship, Stork, Paths, Garden, Fish. Example: Key–Letter = unlocked. This = turning point.
3. LAND THE OUTCOME: Last card or last position = verdict card. Lock cards (stay): Anchor, Ring, House, Tree, Dog, Tower. Yes cards: Sun, Key, Clover, Bouquet, Anchor. No cards: Coffin, Clouds, Cross, Mountain, Snake. Maybe cards: Paths, Birds, Stars, Moon, Whip. Read as yes/no/stay + timing (use pip count).
4. BUILD 2-CARD SENTENCES: Sentence 1 (friction pair) → sets scene. Sentence 2 (release/unlock pair) → breaks scene. Sentence 3 (verdict card) → answer + when + action. Add 1–2 glue sentences for colour; cap at 5 total.
5. EXIT LINE = ACTION: Final clause tells user what to do ("Sign before Friday", "Update CV this weekend"). Leave them with a task, not fog.

STRUCTURE & FLOW:
- Chain cards left→right as chronological ribbon from significator to outcome. No jumping.
- CLUSTER related cards into 2-card pairs (friction pair → release pair → verdict). Don't list cards individually—weave into story beats.
- Name each card in parentheses on first mention: "stalled (Mountain) by secrecy (Book)" After that, use plain nouns.
- Write one continuous narrative—no loops, no restatement.

KEYWORDS:
- Use ONLY keywords below. For each card, pick ONE keyword that completes the local triplet (previous → this → next).
- Never use: energy, vibes, universe, spiritual growth, reversed, ascending, descending.
- Use plain modern language—no device lists.

TONE & SCOPE:
- Everyday, conversational, slightly optimistic. Predict, don't advise.
- Use only names, places, timeframes the querent mentioned. Keep roles generic if unspecified.
- Man card = "you/the focus person"; Woman card = "a person/the other key person" (gender-neutral, they/them).

OUTPUT:
- Mention ALL drawn cards. Never omit. Never invent.
- FINAL SENTENCE MUST BE ACTIONABLE: "Sign before the next Friday," "Update your CV this weekend," "Contact them by Thursday." Not "The cards suggest..." or "The future is bright."
- End with a concrete when/where tag: "expect this before Friday," "in your office," "by night."
- Reply in plain paragraphs only.

KEYWORDS (pick the option that fits the local triplet):
Rider = message, news, delivery, announcement, messenger | Clover = luck, chance, blessing | Ship = travel, distance, journey, relocation | House = home, family, domestic, household | Tree = health, roots, long-term, growth | Clouds = confusion, uncertainty, delay | Snake = betrayal, complication, cunning, deceit | Coffin = ending, pause, closure, halt | Bouquet = gift, joy, celebration, kindness | Scythe = sudden cut, accident, sharp decision, severance | Whip = repetition, argument, conflict, friction | Birds = conversation, dialogue, exchange, communication | Child = child, beginner, start, innocence, young | Fox = coworker, stealth, self-interest, strategy | Bear = boss, authority, power, provider | Stars = night, guidance, illumination, remote help, digital help | Stork = change, relocation, pregnancy, transition | Dog = friend, partner, helper, fidelity, support | Tower = authority, company, institution, bureaucracy | Garden = public, event, gathering, visibility | Mountain = obstacle, delay, barrier, weight | Crossroad = choice, decision, fork | Mice = erosion, stress, loss, anxiety | Heart = love, romance, affection, passion | Ring = contract, commitment, binding, agreement | Book = secret, education, documents, knowledge | Letter = text, message, correspondence, mail | Man = you/the focus person | Woman = the other key person | Lily = peace, elder, winter, calm, wisdom | Sun = success, brightness, achievement, clarity | Moon = recognition, emotions, cycles, intuition | Key = solution, answer, unlock, breakthrough | Fish = money, business, flow, commerce | Anchor = stability, security, foundation | Cross = burden, fate, weight, suffering`

// SPREAD-SPECIFIC RULES - Varies by spread type
const SPREAD_RULES: Record<string, string> = {
  "single-card": "Write 75-100 words. Describe the card's image or scene vividly. Explain what it reveals about the querent's situation. End with a concrete when/where tag.",
   "sentence-3": "Apply micro-manual rules 1-5. Three beats: friction pair → release pair → verdict (with pip-timing + action). 5 sentences max.",
   "past-present-future": "Apply micro-manual 1-5. Beat 1: past (friction source). Beat 2: present (release point). Beat 3: future (verdict + timing + action). 5 sentences.",
    "yes-no-maybe": "Apply micro-manual 1-5. Open with YES/NO/MAYBE based on card 3. Friction → release → verdict with pip-timing + deadline. 5 sentences.",
   "situation-challenge-advice": "Apply micro-manual 1-5. Situation (friction). Challenge (block). Advice (release/unlock). Show connection. End with imperative action.",
  "mind-body-spirit": "Apply micro-manual 1-5. Two-card pairs only: (Card 1–2): mind-body connection. (Card 2–3): body-spirit flow. Verdict + timing + action.",
   "sentence-5": "Apply micro-manual 1-5. Friction pair → release pair → verdict (card 5). Three story beats. Pip-timing + action. 5 sentences max.",
   "structured-reading": "Apply micro-manual 1-5. Friction (cards 1-2). Release (cards 3-4). Verdict (card 5: outcome + timing + action). 5 sentences, three beats.",
  "week-ahead": "Apply micro-manual 1-5. Each day = 2-card pair. Monday (pair), Tuesday (pair), etc. Weekly verdict + timing + action.",
  "relationship-double-significator": "Apply micro-manual 1-5. Cards 1-2: Two people as friction pair. Card 3: what flows between (release). Cards 4-7: thoughts/feelings detail. Verdict + action.",
   "comprehensive": "Apply micro-manual 1-5. Top row (friction). Middle row (release). Bottom row (verdict + timing + action). Three beats, 5 sentences max.",
    "grand-tableau": "Apply micro-manual 1-5. 3 paragraphs: P1 (friction pair around querent). P2 (release pair that breaks deadlock). P3 (verdict + pip-timing + next action). 5 sentences total."
}

function buildPrompt(request: AIReadingRequest): string {
  const cardsText = request.cards.map(card => `${card.position + 1}. ${card.name}`).join('\n')
  
  // Build card timing context from drawn cards
  const cardTimingContext = request.cards
    .map(card => {
      const timing = CARD_TIMING[card.id]
      if (timing) {
        return `${card.name} (${card.id}): timing=${timing.timing}, location=${timing.location}`
      }
      return null
    })
    .filter(Boolean)
    .join('\n')
  
  const spreadRuleText = SPREAD_RULES[request.spreadId || 'single-card'] || SPREAD_RULES['single-card']

  // Calculate pip-timing for outcome card (Marie-Anne Lenormand rule)
  const outcomePipCount = request.cards.length > 0 ? getPipCount(request.cards[request.cards.length - 1].id) : 0
  const outcomeCard = request.cards.length > 0 ? request.cards[request.cards.length - 1].name : 'N/A'
  const pipTimingHint = `PIP-TIMING INSTRUCTION: Outcome card is ${outcomeCard} (pip count = ${outcomePipCount} days). Round to nearest Friday or month-start. Include in final sentence: "Card ${request.cards.length > 0 ? request.cards[request.cards.length - 1].id : 'N/A'} (${outcomeCard}) = ${outcomePipCount} days → watch for [Friday/date]."`

    return `${LENORMAND_STYLE}

Spread type: ${request.spreadId || 'Single Card'}
Spread rules: ${spreadRuleText}

Question: ${request.question || "General Reading"}

Cards drawn:
${cardsText}

Card timing context: ${cardTimingContext}

${pipTimingHint}

Go:`
}

// Main function to get AI reading
export async function getAIReading(request: AIReadingRequest): Promise<AIReadingResponse | null> {
  console.log('getAIReading: Checking availability...');
  if (!isDeepSeekAvailable()) {
    console.log('DeepSeek not available, returning fallback.');
    return {
      reading: "The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (Note: AI analysis requires API key configuration)"
    }
  }
  console.log('DeepSeek is available. Preparing request...');

  try {
    const prompt = buildPrompt(request)

    try {
      console.log('Sending request to DeepSeek API...');
       const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
           model: 'deepseek-chat',
           messages: [
             { role: 'system', content: 'You are a Lenormand fortune-teller. Follow all output rules provided. Reply in plain paragraphs with no preamble.' },
             { role: 'user', content: prompt }
           ],
           temperature: 0.4,
           max_tokens: 800,
           top_p: 0.9
         })
      })

      console.log('DeepSeek API response status:', response.status);

       if (!response.ok) {
         const errorText = await response.text()
         const errorDetails = `Status: ${response.status}, Message: ${response.statusText}, Body: ${errorText}`
         console.error('DeepSeek API error:', errorDetails)
         
         if (response.status === 401 || response.status === 403) {
           console.error('Authentication/Authorization error - check API key')
           return {
             reading: "The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (API authentication issue)"
           }
         } else if (response.status >= 500) {
           console.error('Server error - DeepSeek service issue')
         } else {
           console.error('Client error - request issue')
         }
         
         return {
           reading: "The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (AI service temporarily unavailable)"
         }
       }

      const data = await response.json()
       console.log('DeepSeek API response data received');
       const content = data.choices?.[0]?.message?.content

       if (!content) {
         console.log('No content in DeepSeek response');
         return {
           reading: "The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (Unable to generate AI interpretation)"
         }
       }

        const trimmedContent = content.trim()
        const validation = validateReading(trimmedContent, request.cards, request.spreadId)
        
        if (!validation.isValid) {
          console.warn('Reading validation issues:', validation.issues)
        }

       return {
         reading: trimmedContent
       }
    } catch (error) {
      console.error('AI reading error:', error)

      return {
        reading: "The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (AI service temporarily unavailable)"
      }
    }
  } catch (error) {
    console.error('AI reading setup error:', error)
    return {
      reading: "The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (AI service temporarily unavailable)"
    }
  }
}

// Streaming function for AI reading
export async function streamAIReading(request: AIReadingRequest): Promise<ReadableStream<Uint8Array> | null> {
  console.log('streamAIReading: Checking availability...');
  if (!isDeepSeekAvailable()) {
    console.log('DeepSeek not available, returning fallback stream.');
    const fallbackText = "The cards suggest a period of reflection and new opportunities. Trust your intuition as you navigate this path. (Note: AI analysis requires API key configuration)"
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(fallbackText))
        controller.close()
      }
    })
  }
  
  console.log('DeepSeek is available. Preparing streaming request...');

  try {
    const prompt = buildPrompt(request)

    try {
      console.log('Sending streaming request to DeepSeek API...');
       const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
           model: 'deepseek-chat',
           messages: [
             { role: 'system', content: 'You are a Lenormand fortune-teller. Follow all output rules provided. Reply in plain paragraphs with no preamble.' },
             { role: 'user', content: prompt }
           ],
           temperature: 0.4,
           max_tokens: 800,
           top_p: 0.9,
           stream: true
         })
      })

      console.log('DeepSeek streaming API response status:', response.status);

       if (!response.ok) {
         const errorText = await response.text()
         const errorDetails = `Status: ${response.status}, Message: ${response.statusText}, Body: ${errorText}`
         console.error('DeepSeek streaming API error:', errorDetails)
         
         if (response.status === 401 || response.status === 403) {
           console.error('Authentication/Authorization error - check API key')
         } else if (response.status >= 500) {
           console.error('Server error - DeepSeek service issue')
         }
         
         throw new Error('DeepSeek API error: ' + response.statusText)
       }

      if (!response.body) {
        throw new Error('No response body')
      }

      return response.body
    } catch (error) {
      console.error('AI reading streaming error:', error)
      throw error
    }
  } catch (error) {
    console.error('AI reading setup error:', error)
    throw error
  }
}
