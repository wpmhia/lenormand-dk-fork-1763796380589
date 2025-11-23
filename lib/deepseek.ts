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
}
// UNIFIED LENORMAND STYLE - Applied to all spreads identically
const LENORMAND_STYLE = `You are a Lenormand fortune-teller.
Output rules — follow every bullet without deviation:

1. Chain the cards left→right into cause-and-effect sentences. Show how each card influences the next. **Name each card explicitly in parentheses the first time you mention it—use the exact card name from the list below** (example: "seeking recognition and emotional fulfillment (Moon) is being blocked by repetitive arguments (Whip)"). If you mention a card's meaning, immediately follow with the card name in parentheses.
2. After first mention, refer to cards by plain nouns—don't repeat the card name.
3. Use only keywords listed below; no reversals, no jargon ("energy," "vibes," "universe," "spiritual growth").
4. Tone: everyday, conversational, slightly optimistic; predict, don't advise.
5. End with a concrete when/where tag ("expect this before Friday," "in your group chat," "at the office meeting").
6. **Use only the people, places, and time-frames the querent names.** Keep roles generic ('a colleague', 'the manager', 'within 5 work-days') if not specified. Never invent names, departments, or backstory.
7. If the question asks for a specific choice or outcome, directly answer it in your final sentence with timing. Use the cards to justify why.
8. **GENDER-NEUTRAL READING CONVENTION**: If gender is unknown or not specified:
   - Man card = "you / the focus person" (use they/them pronouns and neutral language)
   - Woman card = "a person / the other key person" (use they/them pronouns and neutral language)
   - Never assume or assign binary gender; adapt to the querent's actual situation as stated.
   - When Man or Woman appear in readings without a named person, use contextual roles: "the person involved," "the key figure," "a central player."

Card keyword bank:
Rider = message, news, delivery
Clover = small luck, brief chance
Ship = travel, distance, foreign
House = home, family, real-estate
Tree = health, roots, long duration
Clouds = confusion, uncertainty
Snake = betrayal, complication, deceptive influence
Coffin = ending, pause, literal box
Bouquet = invitation, gift, social joy
Scythe = sudden cut, accident, surgery
Whip = repetition, argument, sports
Birds = conversation, couple, nervous talk
Child = child, beginner, small start
Fox = coworker, stealth, self-interest
Bear = boss, authority figure, money provider
Stars = night, internet, guidance
Stork = change, relocation, pregnancy
Dog = loyal friend, partner, reliable helper
Tower = authority, company, government
Garden = public, social media, event
Mountain = obstacle, delay, large mass
Crossroad = choice, split, two options
Mice = erosion, stress, theft
Heart = love, romance, heart-shaped object
Ring = contract, cycle, engagement
Book = secret, education, documents
Letter = written text, email, paperwork
Man = you/the focus person (center of attention or the querent themselves)
Woman = a person/the other key person (another central player or influence)
Lily = peace, elder, winter
Sun = success, daytime, heat
Moon = recognition, evening, emotions
Key = solution, certainty, open door
Fish = money, business, flow
Anchor = stability, long-term, port
Cross = burden, destiny, church

NARRATIVE STRUCTURE (applies to all spreads):
One narrative thread, no loops. Each new card deepens, complicates, or shifts the tension—never restate. Each card moves the plot forward.

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
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      console.log('DeepSeek API response status:', response.status);

      if (!response.ok) {
        console.error('DeepSeek API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
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

      return {
        reading: content.trim()
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
          temperature: 0.7,
          max_tokens: 1000,
          stream: true
        })
      })

      console.log('DeepSeek streaming API response status:', response.status);

      if (!response.ok) {
        console.error('DeepSeek API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
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
