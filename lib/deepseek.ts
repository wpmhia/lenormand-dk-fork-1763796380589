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
const SPREAD_RULES: Record<string, string> = {
  "sentence-3": "Interpret these 3 cards as a complete thought or message. Card 1 is the subject/situation, Card 2 is the action/influence, and Card 3 is the outcome/result. Read them as a flowing narrative that answers the question.",
  "past-present-future": "Card 1 represents Past influences and foundations. Card 2 represents the Present situation and current energies. Card 3 represents the Future outcome or what is approaching. Consider how past shapes present and how present leads to future.",
  "yes-no-maybe": "Card 1 indicates the direct answer based on its traditional meaning. Card 2 shows supporting energies or conditions. Card 3 reveals nuance or additional context. Use card meanings to determine YES, NO, or a conditional answer.",
  "situation-challenge-advice": "Card 1 reveals the Situation and context. Card 2 shows the Challenge, obstacle, or difficulty at hand. Card 3 provides the Advice or best course of action. Consider how they relate to reveal wisdom for the querent.",
  "mind-body-spirit": "Card 1 represents Mental/Intellectual aspects - thoughts, beliefs, perspectives. Card 2 represents Physical/Practical aspects - health, material reality, action. Card 3 represents Spiritual/Emotional aspects - feelings, intuition, soul. Show the whole person.",
  "sentence-5": "Read these 5 cards as ONE flowing sentence. Let them tell a complete story or message where each card's meaning builds naturally on the previous one. Express the complete answer in a single, coherent narrative.",
  "structured-reading": "Interpret these 5 cards in 3-4 flowing paragraphs. Weave together the card meanings into a cohesive narrative that explores different dimensions: the immediate message, underlying influences, and the trajectory ahead. Keep natural paragraph breaks but no section headers.",
  "week-ahead": "Interpret these 7 cards as a narrative forecast for the coming week. Each card can represent a day or theme, or read them as a continuous story arc showing the week's unfolding energies and opportunities.",
  "relationship-double-significator": "Cards 1 & 2 are the two people in the relationship. Card 3 shows the relationship dynamics and connection. Cards 4 & 5 reveal each person's thoughts and perspectives. Cards 6 & 7 show their feelings and emotional states. Consider both individual viewpoints and the shared dynamic.",
  "comprehensive": "This 9-card square (3x3 grid) has Card 5 at the center as the core focus. Read it as: Cross formation (Cards 2,4,5,6,8) for main themes, corners (1,3,7,9) for supporting influences, and outer ring for surrounding energies. Look for patterns across rows, columns, and diagonals.",
  "grand-tableau": "The full 36-card Grand Tableau is laid in a 6x6 grid and read as a complete life situation. The Gentleman (Card 28) and Lady (Card 29) are significators. Interpret using proximity, mirroring (cards equidistant from center), and lines of influence. Each card's position and neighbors create the narrative."
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

Provide a reading based on traditional Lenormand meanings, the spread structure, and how the cards interact. Focus on the narrative and message the cards reveal. Begin immediately with your interpretation - no introductions or preambles.${yesNoRequirement}
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
            { role: 'system', content: "You are an expert Lenormand card reader in the tradition of Marie Anne Lenormand. Provide clear, direct interpretations based on traditional Lenormand card meanings and combinations. Speak with confidence and authority about what the cards reveal. Never include introductions, hedging language, or disclaimers. Begin your response immediately with the reading." },
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
            { role: 'system', content: "You are an expert Lenormand card reader in the tradition of Marie Anne Lenormand. Provide clear, direct interpretations based on traditional Lenormand card meanings and combinations. Speak with confidence and authority about what the cards reveal. Never include introductions, hedging language, or disclaimers. Begin your response immediately with the reading." },
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
