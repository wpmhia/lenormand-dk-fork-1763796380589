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
  "single-card": "Write 75-110 words. Explore this card deeply as a complete narrative. Open with the image or scene it suggests, weaving the card's visual into your description. Explain what it reveals about the situation and why it matters now. Use the card name in parentheses the first time only, then use plain nouns. End with a concrete when/where tag so the client knows where to watch for this energy.",
  "sentence-3": "Write 90-130 words. Weave these 3 cards into a vivid scene. Integrate each card's image and meaning naturally—paint what you see. Show HOW each card influences the next through real-world connection. Explain WHY this combination matters. Use card names in parentheses only once. End with a tangible when/where tag.",
  "past-present-future": "Write 120-180 words. Tell the story across three time layers. Open with what led here (Card 1's image). Deepen into the present moment and its complexity (Card 2's visual scene). Show what unfolds next (Card 3's landscape). Weave card images into the narrative naturally. Explain the deeper pattern and cause-and-effect. Use each card name once in parentheses. End with specific timing guidance.",
  "yes-no-maybe": "Write 120-180 words. Answer YES, NO, or MAYBE directly in the opening using Card 1's keyword and image. Weave Cards 2-3 to explain the proof and context, integrating their visual scenes. Why this answer? What does each card reveal about the situation? Use card names once in parentheses. End with 'Count on this...' or 'Watch for...' certainty tag.",
  "situation-challenge-advice": "Write 120-180 words. Paint the three-part dynamic as a narrative scene. Open with the situation (Card 1—integrate its image). Deepen into the challenge (Card 2—weave its visual). Reveal the path forward (Card 3—show its landscape). Use card names once in parentheses. Show how each layer connects and why all three matter together. End with a when/where tag.",
  "mind-body-spirit": "Write 150-220 words. Present three layers of truth as a complete portrait. Card 1's image reveals the mind—thoughts, beliefs. Card 2's scene reveals the body—physical reality, health, practical matters. Card 3's visual reveals the spirit—emotions, intuition. Weave each image into the narrative. Then show how they complete the whole person and interact. Use card names once in parentheses. End with a where-to-notice tag.",
  "sentence-5": "Write 150-220 words. Weave these 5 cards into one interconnected narrative. Open with a vivid scene integrating all card images. Show how each card influences the others through their visual interaction. Explore the relationships and connections between them. Use card names in parentheses only once. Explain the deeper pattern this combination reveals. Why do these 5 cards matter together? End with a tangible when/where tag.",
  "structured-reading": "Write 180-280 words. Explore these 5 cards as a complete story with depth and nuance. Open with a grounded scene weaving in the card images. Show how they interact and what they reveal about the situation's layers and complexity. Explore the trajectory—where is this heading? What patterns emerge? Weave card images throughout. Use card names once in parentheses. End with actionable when/where guidance.",
  "week-ahead": "Write 180-280 words. Weave these 7 cards into a week-long narrative that tells the story of the coming days. Open with an overview of the week's energy, integrating the card images. Guide through each card's visual as a moment or influence that flows into the next. Show the sequence and overall arc. Explain how each day or theme connects. Use card names once in parentheses. End with 'by [day]' or 'mid-week' timing.",
  "relationship-double-significator": "Write 200-320 words. Explore the relationship through two complete viewpoints and their connection. Cards 1-2 are the two people—integrate their card images distinctly and explore their essence. Card 3 shows what flows between them. Cards 4-5 reveal their thoughts—weave both perspectives. Cards 6-7 reveal their feelings—show the emotional landscape from each side. Build a complete narrative of the relationship. Use card names once in parentheses. End with where-to-see-it tag.",
  "comprehensive": "Write 250-380 words. Map the 9-card square as a complete portrait with multiple layers of meaning. Card 5 (center) is the heart—integrate its image deeply and explore it thoroughly. Cards around it show influences, context, and how the situation develops. Use card pair images and adjacencies to build meaning—paint what House + Mice reveals together, what Rider + Letter show. Explore diagonals and the cross formation. Weave all visual elements naturally. Show how the cards create a coherent picture. Use card names once in parentheses. End with when/where tag.",
  "grand-tableau": "Write 300-450 words. Navigate the 36-card grid from the querent outward, telling the complete life story shown in the cards. Find Card 28 (Man) or Card 29 (Woman)—integrate their image and explore their position. Explore cards immediately around them—what immediate influences or energies surround them? Read neighbor pairs and show connections and patterns. Use knighting and mirroring techniques to reveal deeper layers. Expand outward from the querent to reveal the larger life picture and broader influences. Weave all card images naturally throughout. Use card names once in parentheses. Build a sweeping narrative showing immediate personal concerns, relationships, challenges, resources, and the overall trajectory. End with when/where tag about the overall situation."
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

Go:

Safety guideline: Stay inside the word-range specified above; if you naturally finish 5-10% short, stop—never pad.`
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
