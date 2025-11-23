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

function validateReading(reading: string, drawnCards: Array<{name: string}>): { isValid: boolean; issues: string[] } {
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
  
  return {
    isValid: issues.length === 0,
    issues
  }
}
// UNIFIED LENORMAND STYLE - Applied to all spreads identically
const LENORMAND_STYLE = `You are a Lenormand fortune-teller.
CRITICAL OUTPUT RULES — follow every rule without exception:

STEP 1: Identify and name each card exactly (use exact names from keyword bank below)
STEP 2: Chain the cards left→right into cause-and-effect sentences showing how each card influences the next
STEP 3: Name each card explicitly in parentheses the first time you mention it (example: "seeking recognition (Moon) is blocked by arguments (Whip)")
STEP 4: After first mention, use plain nouns to refer to cards—don't repeat the card name
STEP 5: Use ONLY keywords listed below; NEVER use "energy," "vibes," "universe," "spiritual growth," "reversed," "ascending," or "descending"
STEP 6: Write in everyday, conversational tone—slightly optimistic; predict the future, don't advise
STEP 7: Use ONLY people, places, and timeframes the querent named; keep roles generic if unspecified
STEP 8: End with a concrete when/where tag (example: "expect this before Friday," "in your group chat," "at the office meeting")
STEP 9: If the question asks for a specific choice or outcome, answer directly in the final sentence with timing
STEP 10: GENDER-NEUTRAL: Man card = "you/the focus person"; Woman card = "a person/the other key person"; use they/them pronouns
STEP 11: KEYWORD BUFFET - Each card offers multiple valid keyword options (e.g., Stars can mean night, guidance, illumination, or digital help). When a card has options, pick ONE that flows naturally with the neighbouring cards' meanings. Use plain, modern language—no device lists or technical jargon lists. Let the story context guide your choice.

CRITICAL VALIDATION: You MUST mention ALL drawn cards in your reading. Do NOT omit any. Do NOT invent cards not drawn.

Card keyword bank (pick ONE option that fits neighbouring cards):
Rider = message, news, delivery, announcement, messenger
Clover = small luck, brief chance, minor blessing
Ship = travel, distance, foreign, journey, relocation
House = home, family, real-estate, domestic, household
Tree = health, roots, long duration, growth, stability
Clouds = confusion, uncertainty, obscurity, delay
Snake = betrayal, complication, deceptive influence, cunning, deceit
Coffin = ending, pause, literal box, closure, halt
Bouquet = invitation, gift, social joy, celebration, kindness
Scythe = sudden cut, accident, surgery, sharp decision, severance
Whip = repetition, argument, sports, conflict, friction, tension
Birds = conversation, couple, nervous talk, exchange, dialogue, communication
Child = child, beginner, small start, innocence, new, young
Fox = coworker, stealth, self-interest, cunning, strategy, workplace
Bear = boss, authority figure, money provider, power, strength, provider
Stars = night, guidance, stars above, remote help, illumination, digital help
Stork = change, relocation, pregnancy, transition, movement, arrival
Dog = loyal friend, partner, reliable helper, fidelity, companionship, support
Tower = authority, company, government, institution, official, bureaucracy
Garden = public, social gathering, event, exposure, visibility, community
Mountain = obstacle, delay, large mass, barrier, weight, mountain
Crossroad = choice, split, two options, decision point, fork, intersection
Mice = erosion, stress, theft, loss, small damage, anxiety, worry
Heart = love, romance, heart-shaped object, affection, passion, emotion
Ring = contract, cycle, engagement, commitment, binding, agreement
Book = secret, education, documents, records, hidden knowledge, learning
Letter = written text, formal message, correspondence, document, mail
Man = you/the focus person (center of attention or the querent themselves)
Woman = a person/the other key person (another central player or influence)
Lily = peace, elder, winter, calm, serenity, age, wisdom
Sun = success, daytime, heat, brightness, achievement, clarity, victory
Moon = recognition, evening, emotions, cycles, intuition, night-time, dreams
Key = solution, certainty, open door, answer, unlock, breakthrough
Fish = money, business, flow, commerce, transaction, prosperity, abundance
Anchor = stability, long-term, port, security, foundation, grounding
Cross = burden, destiny, church, weight, fate, suffering, trials

NARRATIVE STRUCTURE (applies to all spreads):
One narrative thread, no loops. Each new card deepens, complicates, or shifts the tension—never restate. Each card moves the plot forward.

TIMING COMPUTATION (applies to all spreads):
Extract ONE calendar cue using this method:
- Daily draw → use rightmost card's pip value (1-36) as days
- 3/5-card line → use outcome card's column position (1-5) as weeks; or add pips of last two cards (cap at 14) for days
- Grand-Tableau → measure column distance from significator to outcome card = weeks; knight-leap count = days
- Round computed value to nearest real-world milestone (weekend, month-start, payday)
- Preface with 'likely' or 'watch for' to preserve free will
- Edge cases: if pip sum > 14, convert to "within three weeks"; if Coffin is outcome, add "after a necessary pause"
- DO NOT state timing as a range (e.g., "3-5 days"); always give a single number for calculation

Reply in plain paragraphs, no bullets, no headings, no emojis.`

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
       const validation = validateReading(trimmedContent, request.cards)
       
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
