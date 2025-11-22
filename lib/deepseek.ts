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
// Spread interpretation rules - Lenormand reads literal card meanings in natural combinations
const SPREAD_RULES: Record<string, string> = {
  "sentence-3": "Read these 3 cards as a connected statement. Card 1 is the subject, Card 2 is the action or quality, Card 3 is the outcome or object. Weave their literal meanings together naturally. Example: Rider (news/movement) + Letter (message) + Fish (abundance/money) = 'News arrives about financial matters.'  State it plainly but as it flows from combining the card meanings.",
  "past-present-future": "Card 1 shows what happened before—the seed or cause. Card 2 shows the current state and what's unfolding now. Card 3 shows what comes next. Read each card's literal meaning and how one naturally leads to the next. Build a simple cause-and-effect story.",
  "yes-no-maybe": "Card 1 directly answers the question using its basic meaning. Positive cards (Sun, Heart, Ring, Clover, Ship) lean YES. Negative cards (Coffin, Mice, Tower, Cross, Scythe) lean NO. Neutral cards suggest conditions. Card 2 and 3 add context. Give a clear YES, NO, or conditional answer based on the cards' inherent nature.",
  "situation-challenge-advice": "Card 1 reveals the current situation—what is. Card 2 shows what's blocking or challenging it. Card 3 gives the way forward or advice. Read each card's literal meaning and weave them into a narrative: 'You have [Card 1]. The challenge is [Card 2]. The path is [Card 3].'",
  "mind-body-spirit": "Card 1 shows the mental state—thoughts, beliefs, perspective. Card 2 shows the practical reality—physical health, money, tangible conditions. Card 3 shows the emotional truth—feelings, intuition, inner state. Read as three layers of truth about the person or situation.",
  "sentence-5": "Read these 5 cards as one continuous sentence. Card 1 is the subject, Card 2 the verb/action, Card 3 the object, Card 4 a modifier or context, Card 5 the outcome. Weave them together naturally using their literal meanings. Say it as a single breath.",
  "structured-reading": "Read these 5 cards as a brief story in 3-4 short paragraphs. Use each card's literal meaning but let them flow together naturally. Describe the situation, what's happening, what it means. Be evocative but grounded—no mystical language, just how the cards' actual meanings paint a picture.",
  "week-ahead": "These 7 cards show what unfolds over the coming week. Read left to right as a sequence of events or themes. Each card is a literal occurrence or influence. Weave them into a flowing narrative of what the week holds.",
  "relationship-double-significator": "Card 1 is this person. Card 2 is the other person. Card 3 shows what's between them—the dynamic or connection. Cards 4 & 5 show each person's thoughts. Cards 6 & 7 show their feelings. Read each card's literal meaning and build understanding of the relationship from these clear facts.",
  "comprehensive": "The center card (Card 5) is the heart of the matter. Cards around it show influences and context. Read pairs of cards touching or near each other—what do those two meanings create together? Example: House + Mice = home being eroded or deteriorating. Build the picture from card pairs and their natural combinations.",
  "grand-tableau": "In this 6x6 grid, Card 28 (Man) or Card 29 (Woman) represents the person asking. Read the cards near them first. Look at what touches what—cards adjacent to each other show how their meanings combine and influence. Don't look for mystical lines; simply read which objects are neighbors and what that pairing means."
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

Read these cards by their literal meanings—each is an ordinary object (Rider, House, Mice, Fish, etc.). Weave their meanings together naturally as they combine. Be evocative and grounded, not mystical. Let the card combinations paint a clear picture. Example: Birds (conversation) with Dog (loyalty) brings Lily (harmony) = A conversation with a trusted friend brings peace.

Use natural language, not mechanical. Let card meanings flow into each other. Be direct but allow the poetry of the combinations to emerge naturally.${yesNoRequirement}
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
