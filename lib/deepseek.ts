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
  "single-card": "Explore this one card deeply and narratively. Open with a vivid scene or observation it suggests. Explain multiple layers of meaning—what does it reveal about the situation? Why does this card matter now? Use 4-5 sentences. End with a tangible when/where tag.",
  "sentence-3": "Weave these 3 cards into a narrative (5-6 sentences). Open with an evocative scene showing their interaction. Explore HOW each card influences the next through real-world connection. Explain WHY this combination matters—the deeper meaning and implications. End with tangible when/where guidance.",
  "past-present-future": "Tell the story across three time layers (6-7 sentences). Open with what led here (Card 1 as root cause). Explore the present moment and its complexity (Card 2). Show what unfolds next (Card 3). Weave them together to reveal the deeper cause-and-effect pattern. End with specific timing guidance.",
  "yes-no-maybe": "Use Card 1's keyword to answer YES, NO, or MAYBE directly in the opening. Weave Cards 2-3 to explain the proof, context, and nuance (4-5 sentences). Why this answer? What do the supporting cards reveal about the situation? End with clear certainty: 'Count on this...' or 'Watch for signs that...'",
  "situation-challenge-advice": "Explore the three-part dynamic (5-6 sentences). Open with the situation (Card 1—what is). Deepen into the challenge (Card 2—what blocks or complicates). Reveal the path forward (Card 3—the advice or wisdom). Show how each layer connects and why understanding all three matters. End with a when/where tag.",
  "mind-body-spirit": "Present three distinct layers of truth (6-7 sentences). Card 1 reveals the mind—thoughts, beliefs, perspective. Card 2 reveals the body—physical reality, health, practical matters. Card 3 reveals the spirit—emotions, inner truth, intuition. Explore each separately, then weave them together to show how they complete the whole person. End with a where-to-notice tag.",
  "sentence-5": "Weave these 5 cards into an interconnected narrative (7-9 sentences). Open with a vivid, grounded scene showing their interaction. Explore how each card influences the others—show their relationships, not just list them. Explain the deeper pattern or trajectory this combination reveals. Why do these 5 cards matter together? End with a tangible when/where tag.",
  "structured-reading": "Explore these 5 cards as a complete story (8-10 sentences). Open with a grounded scene or observation. Discuss how the cards interact and what they collectively reveal about the situation's layers and complexity. Explore the trajectory—where is this heading? What patterns or insights emerge? End with actionable when/where guidance.",
  "week-ahead": "Weave these 7 cards into a week-long narrative (7-9 sentences). Open with an overview of the week's energy or theme. Guide through each card as a moment or influence that flows into the next—show the sequence and how each connects. Explain the overall arc and what the week holds. End with 'by [day of week]' or 'mid-week' timing.",
  "relationship-double-significator": "Explore the relationship through two viewpoints (7-9 sentences). Cards 1-2 are the two people—introduce each distinctly. Card 3 shows what flows between them. Cards 4-5 reveal their thoughts—weave both perspectives. Cards 6-7 reveal their feelings—show the emotional landscape from each side. Build a complete picture of how both people see and feel the bond. End with a where-to-see-it tag.",
  "comprehensive": "Map the 9-card square as a complete portrait (8-10 sentences). Card 5 (center) is the heart—explore it deeply. Cards around it show influences, context, and how the situation develops. Use card pairs and adjacencies to build meaning—what does House + Mice reveal together? What does Rider + Letter show? Weave these connections into a coherent picture. End with a when/where tag.",
  "grand-tableau": "Navigate the 36-card grid from the querent outward (9-12 sentences). Find Card 28 (Man) or Card 29 (Woman)—the person asking. Explore cards immediately around them first—what immediate influences or energies surround them? Read each neighbor pair to show connections and influences. Expand outward to reveal patterns and the larger life picture. Build a sweeping narrative showing both immediate and broader influences. End with a when/where tag about the overall situation."
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
