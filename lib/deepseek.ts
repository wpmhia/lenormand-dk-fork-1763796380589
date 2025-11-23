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

STRUCTURE & FLOW:
- Chain cards left→right as cause-and-effect. Each card deepens or shifts the story.
- Name each card in parentheses on first mention: "joy (Bouquet) leads to..." After that, use plain nouns.
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
- End with a concrete when/where tag: "expect this before Friday," "in your office," "by night."
- Reply in plain paragraphs only.

YES/NO SPREADS:
- The outcome card (final card) determines the answer.
- Positive cards (Sun, Key, Clover, Bouquet, Heart, Dog, Stars, Moon, Anchor) = YES.
- Negative/friction cards (Coffin, Whip, Mice, Snake, Mountain, Cross, Scythe, Clouds) = NO.
- Neutral/mixed cards (Woman, Man, Tower, Book, Ring, House, Tree, Fish, etc.) = MAYBE.
- State the answer in the opening sentence. Then explain why the chain supports, complicates, or muddies it.

KEYWORDS (pick the option that fits the local triplet):
Rider = message, news, delivery, announcement, messenger | Clover = luck, chance, blessing | Ship = travel, distance, journey, relocation | House = home, family, domestic, household | Tree = health, roots, long-term, growth | Clouds = confusion, uncertainty, delay | Snake = betrayal, complication, cunning, deceit | Coffin = ending, pause, closure, halt | Bouquet = gift, joy, celebration, kindness | Scythe = sudden cut, accident, sharp decision, severance | Whip = repetition, argument, conflict, friction | Birds = conversation, dialogue, exchange, communication | Child = child, beginner, start, innocence, young | Fox = coworker, stealth, self-interest, strategy | Bear = boss, authority, power, provider | Stars = night, guidance, illumination, remote help, digital help | Stork = change, relocation, pregnancy, transition | Dog = friend, partner, helper, fidelity, support | Tower = authority, company, institution, bureaucracy | Garden = public, event, gathering, visibility | Mountain = obstacle, delay, barrier, weight | Crossroad = choice, decision, fork | Mice = erosion, stress, loss, anxiety | Heart = love, romance, affection, passion | Ring = contract, commitment, binding, agreement | Book = secret, education, documents, knowledge | Letter = text, message, correspondence, mail | Man = you/the focus person | Woman = the other key person | Lily = peace, elder, winter, calm, wisdom | Sun = success, brightness, achievement, clarity | Moon = recognition, emotions, cycles, intuition | Key = solution, answer, unlock, breakthrough | Fish = money, business, flow, commerce | Anchor = stability, security, foundation | Cross = burden, fate, weight, suffering`

// SPREAD-SPECIFIC RULES - Varies by spread type
const SPREAD_RULES: Record<string, string> = {
  "single-card": "Write 75-100 words. Describe the card's image or scene vividly. Explain what it reveals about the querent's situation. End with a concrete when/where tag.",
  "sentence-3": "Write 70-100 words. Three-card linear story: Card 1 opens the situation, Card 2 deepens or complicates it, Card 3 resolves or shifts it. Show cause-and-effect. End with a when/where tag.",
  "past-present-future": "Write 90-130 words. Three-card story: Card 1 is what led here (past). Card 2 is the present moment and its complexity. Card 3 is what unfolds next (future). Show the arc. End with specific timing.",
  "yes-no-maybe": "Write 90-130 words. Answer YES, NO, or MAYBE upfront using Card 1. Cards 2-3 explain why this answer—what proof do they show? Why does the answer hold or shift? End with certainty tag.",
  "situation-challenge-advice": "Write 90-130 words. Card 1: the situation as it stands. Card 2: the challenge or obstacle blocking progress. Card 3: the path forward or best action. Show how all three connect. End with a when/where tag.",
  "mind-body-spirit": "Write 110-160 words. Card 1 reveals the mind (thoughts, beliefs, clarity or confusion). Card 2 reveals the body (physical reality, health, practical action). Card 3 reveals the spirit (emotions, intuition, desires). Show how these three complete the whole person. End with a where-to-notice tag.",
  "sentence-5": "Write 100-150 words. Five-card narrative: Card 1 opens the situation. Cards 2-3 complicate or deepen it. Card 4 is a turning point or new perspective. Card 5 resolves or reveals the outcome. Show each step flowing into the next. End with a when/where tag.",
  "structured-reading": "Write 130-180 words. Five-card story with depth. Card 1: the situation. Card 2: hidden factors or complication. Card 3: the tension or choice point. Card 4: resources or path forward. Card 5: the likely outcome. Build a complete narrative arc. End with actionable when/where guidance.",
  "week-ahead": "Write 150-200 words. Use present-tense, first-person plural ('Monday we…, Tuesday we…'). Each card is one day with a concrete moment. End with the week's emotional takeaway plus a single when tag if something spills into next week.",
  "relationship-double-significator": "Write 160-220 words. Cards 1-2: two people (explore each distinctly). Card 3: what flows between them (connection, tension, attraction, obstacle). Cards 4-5: their thoughts (Card 4 is one person's mind, Card 5 the other's). Cards 6-7: their feelings (Card 6 is one person's emotions, Card 7 the other's). Build one complete relationship narrative. End with where-to-see-it tag.",
  "comprehensive": "Write 180-260 words. Read the 9-card square as three 3-card rows. Top row (Cards 1-3): the foundation or past influences. Middle row (Cards 4-6): the present situation and challenges. Bottom row (Cards 7-9): the future or outcome. Use card pairs (adjacent cards together) to deepen meaning. Show how each row builds on the previous. End with when/where tag.",
  "grand-tableau": "Write 220-320 words. Navigate the 36-card grid by first finding Card 28 (Man) or Card 29 (Woman)—this is the querent. Explore cards immediately surrounding them (these show immediate influences). Then read card pairs next to and diagonal to the querent (these reveal hidden dynamics). Expand outward in rings to show broader life picture. Build one sweeping narrative of personal concerns, relationships, challenges, resources, and trajectory. End with when/where tag."
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

   return `${LENORMAND_STYLE}

Spread type: ${request.spreadId || 'Single Card'}
Spread rules: ${spreadRuleText}

Question: ${request.question || "General Reading"}

Cards drawn:
${cardsText}

Card timing context: ${cardTimingContext}

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
