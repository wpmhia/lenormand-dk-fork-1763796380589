import { AgentRequest, AgentResponse, LenormandCard } from '@/types/agent.types'
import { SPREAD_RULES } from './spreadRules'
import { pipToDeadline } from './deadline'
import { makeTask } from './taskGen'

const TEMPLATE_1_CARD = `A weight lifts from your shoulders (Lily) as clarity arrives by Thursday. The cards say: rest deeply, trust the calm. Send word to one person you care about before Friday—confirm the path forward.`

const TEMPLATE_3_CARD = `A close friend (Dog) ghosts you after an abrupt cut (Coffin), leaving the week stuck (Mountain). The silence breaks next Thursday—send one check-in text before then; if they don't bite, let the friendship sleep. Watch for the icy reply around Thursday evening.`

const TEMPLATE_5_CARD = `Your job search stalls (Mountain + Fox). Wednesday flips it—an email arrives with an interview slot (Key + Letter). You'll know by Friday if they bite. Send your portfolio by EOD Wednesday, then rest. Call the hiring manager Tuesday if silence.`

const TEMPLATE_7_CARD = `Monday brings tension (Whip). By Wednesday, a conversation breaks the ice (Birds + Key). Thursday through Friday, the path clears (Sun + Rider). You're moving forward by the weekend. Text them Thursday morning—don't wait. Confirm the next step by Friday evening.`

const TEMPLATE_9_CARD = `The hospital's rigid walls watch this conflict grow in shadows, while a man's position guides the tension beneath the surface and stars illuminate hidden truths. His role feels trapped between duty and the weight of the mountain—this dispute feels sealed in a coffin. But a letter is coming that shifts everything with small relief, like clover breaking through concrete, slowly eating away the tension through erosion. By Friday, the document lands with unexpected blessings and clarity arrives unexpectedly. Read it carefully and speak plainly about your path. Then send your own written position before Friday evening to settle this matter. Choose whether to chip away at the wall or walk around it. Write your decision in the staff log. Confirm your next step before Friday evening.`

const TEMPLATE_36_CARD = `P1: The tableau opens with tension—confusion and clouds settle while rapid messages from the rider travel to a loyal dog bearing a sudden scythe cut. The weight of the cross builds slowly through erosion and cycles of doubt like the moon rising and falling. Hearts ache and rings bind what cannot move. P2: The breakthrough comes through institutional change at the tower, financial flow from fish, and bright clarity from the sun. A gift arrives from the bouquet unexpectedly; the key unlocks what was stuck. Paths diverge and the garden calls. P3: Hidden beneath it all sits the tree with deep roots, the weight of the anchor pressing down, the cycles repeating, and guides like stars showing the way forward. An anchor offers stability; a letter arrives with answers. The whip cracks and birds communicate urgently. P4: By Friday you choose your path: sign the new agreement with the ring or return via the stork to solid ground like a house or lilies of peace. The child begins again or the fox finds strategy. Send your written position before Friday evening.`

export class MarieAnneAgent {
  static tellStory(request: AgentRequest): AgentResponse {
    const { cards, spread, question } = request

    const template = this.getTemplate(spread.template)
    const prompt = this.buildPrompt(cards, spread, question, template)

    const story = this.formatStory(prompt, spread.sentences)
    const outcomeCard = cards[cards.length - 1]
    const outcomeCardPip = this.getPipCount(outcomeCard.id)
    const deadline = pipToDeadline(outcomeCardPip)
    const task = makeTask(spread.beats[spread.beats.length - 1], cards)

    return {
      story,
      deadline: deadline.text,
      task: task,
      timingDays: outcomeCardPip
    }
  }

  private static getTemplate(templateType: string): string {
    const templates: Record<string, string> = {
      '1-card': TEMPLATE_1_CARD,
      '3-card': TEMPLATE_3_CARD,
      '5-card': TEMPLATE_5_CARD,
      '7-card': TEMPLATE_7_CARD,
      '9-card': TEMPLATE_9_CARD,
      '36-card': TEMPLATE_36_CARD
    }
    return templates[templateType] || TEMPLATE_3_CARD
  }

  private static buildPrompt(
    cards: LenormandCard[],
    spread: any,
    question: string,
    template: string
  ): string {
    const cardsText = cards.map((c, i) => `${i + 1}. ${c.name}`).join(' — ')

     return `
You are Marie-Anne Lenormand, Paris salon fortune-teller.

QUESTION: "${question}"
CARDS DRAWN: ${cardsText}
SPREAD: ${spread.template.toUpperCase()} (${cards.length} cards)

INSTRUCTIONS:
- Write EXACTLY ${spread.sentences} sentences.
- Each sentence chains cards into ONE story, no explanations.
- Weave all card names naturally into narrative—each card mentioned exactly once.
- Final sentence = YES/NO/STAY + "by [Day] evening" + imperative task.
- Use vivid metaphor (wall, weight, crack, icy, door, light, shadow).
- Brisk, deadline-first, action-last tone.

TONE EXAMPLE:
"${template}"

NOW WRITE THE READING (exactly ${spread.sentences} sentences):
`
  }

  private static formatStory(prompt: string, sentenceCount: number): string {
    return prompt.trim()
  }

  private static getPipCount(cardId: number): number {
    if (cardId > 30) return 4
    if (cardId === 10 || cardId === 20 || cardId === 30) return 10
    return cardId % 10 || 10
  }

  static validateCardReferences(
    story: string,
    cards: LenormandCard[],
    spreadSize: number
  ): { isValid: boolean; missingCards: string[]; issues: string[] } {
    const issues: string[] = []
    const missingCards: string[] = []

    if (spreadSize < 9) {
      return { isValid: true, missingCards: [], issues: [] }
    }

    cards.forEach(card => {
      const wordBoundaryPattern = new RegExp(`\\b${card.name}\\b`, 'gi')
      const matches = story.match(wordBoundaryPattern)
      const count = matches?.length || 0

      if (count === 0) {
        missingCards.push(card.name)
        issues.push(`Card "${card.name}" not mentioned in narrative`)
      } else if (count > 1) {
        issues.push(`Card "${card.name}" mentioned ${count} times (should be exactly 1)`)
      }
    })

    return {
      isValid: issues.length === 0,
      missingCards,
      issues
    }
  }
}
