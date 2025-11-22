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

// Spread interpretation rules based on traditional Lenormand divination
// Spread interpretation rules - Lenormand is literal and direct, not mystical
const SPREAD_RULES: Record<string, string> = {
  "sentence-3": "Read these 3 cards as a plain sentence. Card 1 = subject. Card 2 = action/verb. Card 3 = result/object. Read left to right as: [Card1] [Card2] [Card3]. Example: Rider brings Letter about Fish means news arrives about money.",
  "past-present-future": "Card 1 = what happened. Card 2 = what is happening now. Card 3 = what comes next. Read them as three separate facts connected by cause and effect, not as mystical themes.",
  "yes-no-maybe": "Card 1 answers the question directly. Good cards (Sun, Ring, Heart, Clover) = YES. Bad cards (Coffin, Mice, Tower, Cross) = NO. Card 2 and 3 add detail. Answer simply: YES, NO, or DEPENDS ON [Card 3].",
  "situation-challenge-advice": "Card 1 = the current situation. Card 2 = what's blocking it. Card 3 = what to do. Read bluntly: 'There is [Card 1], the problem is [Card 2], do [Card 3]'.",
  "mind-body-spirit": "Card 1 = thoughts in your head. Card 2 = physical reality/health/money. Card 3 = feelings. Three separate facts about the person.",
  "sentence-5": "Read these 5 cards as one complete sentence. Card 1 = subject. Card 2 = verb. Card 3 = object. Card 4 = modifier. Card 5 = outcome. Say it plainly in one breath.",
  "structured-reading": "Read these 5 cards as a short story in 3-4 plain paragraphs. No flowery language. Just: what is the situation, what happens next, what does it mean. Make each card count as a literal object with a practical meaning.",
  "week-ahead": "These 7 cards show what happens over the week. Each card is a fact or event. Read left to right as a sequence of ordinary things that occur. No deep themes—just what happens.",
  "relationship-double-significator": "Card 1 = this person. Card 2 = the other person. Card 3 = what is between them. Card 4 = what this person thinks. Card 5 = what the other person thinks. Card 6 = what this person feels. Card 7 = what the other feels. Simple facts, not projections.",
  "comprehensive": "9-card square: Card 5 (center) = the core issue. Cards around it show influences. Read the cards closest to the center first. Then look at pairs: do they make sense together? Example: House + Mice = home falling apart.",
  "grand-tableau": "36 cards laid out in a 6x6 grid. Card 28 (Man) or Card 29 (Woman) is the person asking. Read cards near them. Cards touching each other show what connects them. Ignore mystical 'lines'—just read: what objects are next to each other? What do they mean when combined?"
}

function buildPrompt(request: AIReadingRequest): string {
  const cardsText = request.cards.map(card => `${card.position + 1}. ${card.name}`).join('\n')
  
  let spreadContext = ""
  let spreadRules = ""
  let yesNoRequirement = ""
  
  if (request.spreadId) {
     if (SPREAD_RULES[request.spreadId]) {
       spreadRules = `Spread: ${request.spreadId}\nInterpretation Guidelines:\n${SPREAD_RULES[request.spreadId]}`
     }
      if (request.spreadId === "yes-no-maybe") {
        yesNoRequirement = "\n\nEnd with a clear YES or NO conclusion based on the card meanings and positions."
      }
   }

   return `
Question: ${request.question || "General Reading"}

${spreadRules}

Cards:
${cardsText}

Read these cards bluntly and literally. Each card is an ordinary object with a practical meaning. Combine them as if you're reading a sentence or describing what happens. No flowery language, no mystical symbols, no deep layers. Just say what the cards mean together.${yesNoRequirement}
`
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
            { role: 'system', content: "You are a direct Lenormand reader. Read cards literally. Each card is an ordinary object (Rider, House, Mice, Ship, etc.) with a practical meaning. Combine them like you're reading a sentence or describing what happens. Be blunt. No mystical language, no deep themes, no hedging. Just say what the cards mean. Start immediately—no preambles." },
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
            { role: 'system', content: "You are a direct Lenormand reader. Read cards literally. Each card is an ordinary object (Rider, House, Mice, Ship, etc.) with a practical meaning. Combine them like you're reading a sentence or describing what happens. Be blunt. No mystical language, no deep themes, no hedging. Just say what the cards mean. Start immediately—no preambles." },
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
