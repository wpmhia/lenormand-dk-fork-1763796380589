import { Card, ReadingCard } from './types'

// DeepSeek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

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

1. Chain the cards left→right into cause-and-effect sentences (see spread rules for word count).
2. Add follow-up sentences that spell out:
   - HOW each card triggers the next (channel, place, person-type),
   - WHY the final card closes the matter (tangible outcome, timing clue).
3. Keep the card name in parentheses only the first time it appears; afterwards use plain nouns or pronouns.
4. Lexicon: use only the upright keyword listed for each card; no reversals, no abstract jargon ("energy," "vibes," "universe," "spiritual growth").
5. Mood: everyday, conversational, slightly optimistic; predict, do not advise.
6. Finish with a when/where tag ("expect this before Friday," "in your group chat," "at the office meeting") so the client knows where to watch.

Card keyword bank:
Rider = message, news, delivery
Clover = small luck, brief chance
Ship = travel, distance, foreign
House = home, family, real-estate
Tree = health, roots, long duration
Clouds = confusion, uncertainty
Snake = betrayal, complication, woman with dark hair
Coffin = ending, pause, literal box
Bouquet = invitation, gift, social joy
Scythe = sudden cut, accident, surgery
Whip = repetition, argument, sports
Birds = conversation, couple, nervous talk
Child = child, beginner, small start
Fox = coworker, stealth, self-interest
Bear = boss, mother, money provider
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
Man = male querent or significant man
Woman = female querent or significant woman
Lily = peace, elder, winter
Sun = success, daytime, heat
Moon = recognition, evening, emotions
Key = solution, certainty, open door
Fish = money, business, flow
Anchor = stability, long-term, port
Cross = burden, destiny, church

Reply in plain paragraphs, no bullets, no headings, no emojis.`

// SPREAD-SPECIFIC RULES - Varies by spread type
const SPREAD_RULES: Record<string, string> = {
  "single-card": "Interpret the one card directly as the answer to the question. Use 2-3 sentences only. End with a when/where tag.",
  "sentence-3": "Chain the 3 cards into one cause-and-effect sentence (20-30 words). Add 1-2 follow-up sentences explaining HOW and WHY. End with a when/where tag.",
  "past-present-future": "Card 1 shows what came before—the root cause. Card 2 is the present moment. Card 3 is what comes next. Build the cause-and-effect story across all three without forcing a single sentence. Use 3-4 sentences total. End with timing.",
  "yes-no-maybe": "Use Card 1's keyword to answer YES, NO, or MAYBE directly in the first sentence. Cards 2-3 add proof and context. Use 2-3 sentences. End with certainty: 'Count on this...' or 'Watch for signs that...'",
  "situation-challenge-advice": "Card 1 is the situation (what is). Card 2 is the challenge (what blocks). Card 3 is the advice (the path). Build 3-4 sentences showing how each connects. End with a when/where tag.",
  "mind-body-spirit": "Card 1 = mind (thoughts, beliefs). Card 2 = body (physical, practical). Card 3 = spirit (feelings, intuition). Present all three as separate truths that complete the person's picture. Use 3-4 sentences. End with a where-to-notice tag.",
  "sentence-5": "Chain the 5 cards into one cause-and-effect sentence (25-35 words). Add 1-3 follow-up sentences that spell out HOW the first triggers the second and WHY the last closes the matter. End with a when/where tag.",
  "structured-reading": "Chain the 5 cards into one opening cause-and-effect sentence (25-35 words). Add 2-3 follow-up sentences explaining the deeper layers—how do they interact, what's the trajectory. End with a tangible when/where tag.",
  "week-ahead": "Chain cards 1-7 as a week-long narrative. Each card is one moment or theme that flows into the next. Use 4-5 sentences showing the sequence. End with 'by [day of week]' or 'mid-week' tag.",
  "relationship-double-significator": "Cards 1-2 are the two people. Card 3 is what's between them. Cards 4-5 are their thoughts. Cards 6-7 are their feelings. Build 4-5 sentences showing both viewpoints and the connection. End with a where-to-see-it tag (at home, in a text, at a meeting).",
  "comprehensive": "Card 5 (center) is the heart. Cards around it show context and influence. Use card pairs and adjacencies to build meaning. Chain 4-6 sentences showing how the cards weave together. End with a when/where tag.",
  "grand-tableau": "Find Card 28 (Man) or Card 29 (Woman)—the querent. Read the cards immediately around them first. Each neighbor pair shows a connection or influence. Build 5-7 sentences from the center outward. End with a sweeping when/where tag about the overall picture."
}

function buildPrompt(request: AIReadingRequest): string {
  const cardsText = request.cards.map(card => `${card.position + 1}. ${card.name}`).join('\n')
  
  const spreadRuleText = SPREAD_RULES[request.spreadId || 'single-card'] || SPREAD_RULES['single-card']

  return `${LENORMAND_STYLE}

Spread type: ${request.spreadId || 'Single Card'}
Spread rules: ${spreadRuleText}

Question: ${request.question || "General Reading"}

Cards:
${cardsText}

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
