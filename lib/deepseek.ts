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

// Spread interpretation rules - each spread has its own structure and meaning
const SPREAD_RULES: Record<string, string> = {
  "single-card": "One card speaks directly to the question or situation. Read its literal meaning and how it answers. Be straightforward and clear.",
  "sentence-3": "Read these 3 cards as a sentence that flows naturally. Card 1 is the subject, Card 2 adds action or quality, Card 3 is the outcome or completion. Example: Rider (news/movement) + Letter (message) + Fish (money/abundance) becomes 'News arrives about financial matters.' Weave the literal meanings together seamlessly.",
  "past-present-future": "Card 1 shows what came before—the root cause or seed. Card 2 shows now—the present moment and current state. Card 3 shows what unfolds next. Read each card's plain meaning and trace how one leads naturally to the next, building a cause-and-effect story.",
  "yes-no-maybe": "Card 1 answers directly using its fundamental nature. Bright cards (Sun, Heart, Ring, Clover, Rider) point to YES. Dark cards (Coffin, Mice, Tower, Cross, Scythe, Clouds) point to NO. Neutral cards suggest conditions or 'it depends.' Cards 2 and 3 add context or clarification. Give a clear YES, NO, or conditional answer grounded in what the cards reveal.",
  "situation-challenge-advice": "Card 1 reveals what is—the current situation or reality. Card 2 shows the block, the obstacle, what makes it difficult. Card 3 reveals the path forward, the action or wisdom. Read plainly: 'You are in [Card 1]. The challenge is [Card 2]. The way through is [Card 3].' Let their literal meanings create the guidance.",
  "mind-body-spirit": "Card 1 shows the mind layer—thoughts, beliefs, mental state. Card 2 shows the body layer—physical health, material reality, practical matters. Card 3 shows the spirit layer—emotions, inner truth, soul state. Read as three distinct truths about the person or situation, then weave them together for complete understanding.",
  "sentence-5": "Read these 5 cards as one flowing sentence. Card 1 is subject, Card 2 is action/verb, Card 3 is object, Card 4 is modifier or context, Card 5 is outcome or completion. Weave them together in natural language using their literal meanings. Say it as one continuous thought. Example: Woman (subject) seeks Clover (happiness) through Ring (commitment) despite Mountains (obstacles) to reach Heart (love).",
  "structured-reading": "Read these 5 cards as a short story unfolding in 3-4 brief, grounded paragraphs. Paint the situation with their literal meanings—what is the scene, what is happening, what does it mean? Use evocative but direct language. Let the card combinations create narrative flow. Be poetic in how meanings combine naturally, but anchored in what each card actually represents.",
  "week-ahead": "These 7 cards show the week unfolding day by day or theme by theme. Read left to right as a sequence. Each card is an energy, event, or influence the person will encounter. Weave them into a flowing narrative of how the week moves and what it brings. Let the progression of cards tell the story of the seven days.",
  "relationship-double-significator": "Card 1 is Person A. Card 2 is Person B. Card 3 is what flows between them—the connection, dynamic, or shared energy. Card 4 is what Person A thinks. Card 5 is what Person B thinks. Card 6 is what Person A feels. Card 7 is what Person B feels. Read each card's literal meaning and build a complete picture of both people and their bond.",
  "comprehensive": "This 9-card square has Card 5 (center) as the heart of the matter. The cards around it show influences, context, and how the situation develops. Read pairs of adjacent cards—what does Rider + Letter mean together? House + Mice? Build understanding from how card pairs combine their literal meanings. The closer to center, the more central the issue.",
  "grand-tableau": "All 36 cards laid in a 6x6 grid create a complete life portrait. Card 28 (Gentleman) or Card 29 (Lady) is the querent—find them and read the cards around them. Cards that touch each other show connections: what two objects are neighbors? What do their combined meanings reveal? Read from the querent outward, seeing patterns in proximity and combination, not mystical lines."
}

function buildPrompt(request: AIReadingRequest): string {
  const cardsText = request.cards.map(card => `${card.position + 1}. ${card.name}`).join('\n')
  
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

Read these cards by their literal meanings—each is an ordinary object (Rider, House, Mice, Fish, etc.). Weave their meanings together naturally as they combine. Be evocative and grounded. Let the card combinations paint a clear picture. Example: Birds (conversation) with Dog (loyalty) brings Lily (harmony) = A conversation with a trusted friend brings peace.

Use natural language. Let card meanings flow into each other. Be direct but allow the poetry of the combinations to emerge naturally.${yesNoRequirement}
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
            { role: 'system', content: "You are a Lenormand reader. Read each card by its literal meaning—it's an ordinary object (Rider, House, Mice, Ship, etc.). Weave card meanings together naturally. Be direct and evocative. Let how the cards combine create poetry, not mystical language. Speak naturally, not mechanically. Start immediately—no preambles or explanations." },
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
            { role: 'system', content: "You are a Lenormand reader. Read each card by its literal meaning—it's an ordinary object (Rider, House, Mice, Ship, etc.). Weave card meanings together naturally. Be direct and evocative. Let how the cards combine create poetry, not mystical language. Speak naturally, not mechanically. Start immediately—no preambles or explanations." },
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
