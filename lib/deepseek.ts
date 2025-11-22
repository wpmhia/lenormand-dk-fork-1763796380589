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

// Spread interpretation rules
const SPREAD_RULES: Record<string, string> = {
  "sentence-3": "Interpret these 3 cards as a single sentence. The first card is the subject, the second is the action/description, and the third is the outcome/object.",
  "past-present-future": "Card 1 represents the Past influences. Card 2 represents the Present situation. Card 3 represents the Future outcome.",
  "yes-no-maybe": "Card 1 is the answer (Positive/Negative). Card 2 supports the answer. Card 3 provides the nuance or condition. IMPORTANT: You must conclude with a definitive YES or NO answer based on the cards.",
  "situation-challenge-advice": "Card 1 is the Situation. Card 2 is the Challenge/Obstacle. Card 3 is the Advice.",
  "mind-body-spirit": "Card 1 represents the Mind/Thoughts. Card 2 represents the Body/Physical. Card 3 represents the Spirit/Emotional.",
  "sentence-5": "Interpret these 5 cards as a detailed narrative sentence. Look for the central theme in the middle card (Card 3).",
  "structured-reading": "Card 1: The Issue. Card 2: The Past. Card 3: The Present. Card 4: The Future. Card 5: The Outcome.",
  "week-ahead": "Interpret the 7 cards as a forecast for the week ahead, one card for each day or as a general narrative for the week.",
  "relationship-double-significator": "Card 1: You. Card 2: The Other Person. Card 3: The Relationship Dynamic. Card 4: Your Thoughts. Card 5: Their Thoughts. Card 6: Your Feelings. Card 7: Their Feelings.",
  "comprehensive": "A comprehensive 9-card square. The central card (Card 5) is the focus. Read rows, columns, and diagonals for detailed insight.",
  "grand-tableau": "A full 36-card Grand Tableau. Focus on the position of the Gentleman (28) and Lady (29). Look for proximity to key cards like the Ring, Heart, Mice, etc. Use knighting and mirroring techniques if possible."
}

function buildPrompt(request: AIReadingRequest): string {
  const cardsText = request.cards.map(card => `${card.position + 1}. ${card.name}`).join('\n')
  
  let spreadContext = ""
  let spreadRules = ""
  let yesNoRequirement = ""
  
  if (request.spreadId) {
    spreadContext = `Spread Type: ${request.spreadId}`
    if (SPREAD_RULES[request.spreadId]) {
      spreadRules = `\nSpread Rules:\n${SPREAD_RULES[request.spreadId]}`
    }
    // Add special requirement for yes-no spread
    if (request.spreadId === "yes-no-maybe") {
      yesNoRequirement = "\n\nIMPORTANT: End your interpretation with a clear conclusion on a new line: **ANSWER: YES** or **ANSWER: NO**"
    }
  }

  return `
You are an expert Lenormand reader. Please interpret the following spread.

Question: ${request.question || "General Reading"}
${spreadContext}${spreadRules}

Cards:
${cardsText}

Provide a detailed and insightful interpretation based on traditional Lenormand meanings and card combinations. 
Focus on the narrative flow and how the cards interact with each other.
If a specific spread type is mentioned, adhere to the positions and their meanings for that spread.${yesNoRequirement}

IMPORTANT: Start your response directly with the interpretation content. Do NOT include any introductory phrases like "Of course", "Certainly", "Here's", or similar preambles. Begin immediately with the reading.
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
            { role: 'system', content: "You are a mystical Lenormand card reader who provides interpretations directly without introductory phrases or preambles. Start your response immediately with the reading content." },
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
            { role: 'system', content: "You are a mystical Lenormand card reader who provides interpretations directly without introductory phrases or preambles. Start your response immediately with the reading content." },
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
