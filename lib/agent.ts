import { AgentRequest, AgentResponse, LenormandCard } from '@/types/agent.types'
import { SPREAD_RULES } from './spreadRules'
import { pipToDeadline } from './deadline'
import { makeTask } from './taskGen'

const TEMPLATE_1_CARD = `A weight lifts from your shoulders (Lily) as clarity arrives by Thursday. The cards say: rest deeply, trust the calm. Send word to one person you care about before Friday—confirm the path forward.`

const TEMPLATE_3_CARD = `A close friend (Dog) ghosts you after an abrupt cut (Coffin), leaving the week stuck (Mountain). The silence breaks next Thursday—send one check-in text before then; if they don't bite, let the friendship sleep. Watch for the icy reply around Thursday evening.`

const TEMPLATE_5_CARD = `Your job search stalls (Mountain + Fox). Wednesday flips it—an email arrives with an interview slot (Key + Letter). You'll know by Friday if they bite. Send your portfolio by EOD Wednesday, then rest. Call the hiring manager Tuesday if silence.`

const TEMPLATE_7_CARD = `Monday brings tension (Whip). By Wednesday, a conversation breaks the ice (Birds + Key). Thursday through Friday, the path clears (Sun + Rider). You're moving forward by the weekend. Text them Thursday morning—don't wait. Confirm the next step by Friday evening.`

const TEMPLATE_9_CARD = `A fog of confusion (Clouds) has settled over your hospital chats (Birds), anchoring you to the drama (Anchor). The gossip garden (Garden) is now a dead-end coffin (Coffin) where the cunning fox (Fox) digs traps under the tower's watchful eye (Tower). A sudden change (Stork) opens the conflict with Tina; you're at a crossroads (Paths) by Friday. Choose your path: stay and weather the storm or fly to calmer skies. Write your decision in the staff log before Friday evening.`

const TEMPLATE_36_CARD = `P1: The tableau opens with tension—(Clouds) of confusion, (Rider) messages, a loyal (Dog), a sudden (Scythe). The weight of the (Cross) builds slowly through (Mice) erosion and cycles of (Moon) doubt. Hearts (Heart) ache and (Ring) binds what cannot move. P2: The breakthrough comes through institutional (Tower) change, (Fish) financial flow, and bright (Sun) clarity. A (Bouquet) gift arrives unexpectedly; the (Key) unlocks what was stuck. (Paths) diverge and (Garden) calls. P3: Hidden beneath it all sits the (Tree) with deep roots, the (Anchor) weight pressing down, the (Whip) cracks and (Birds) communicate urgently. (Stars) guide the way forward. A (Letter) arrives with answers. (Lily) peace settles. P4: By Friday you choose your path: sign the new agreement (Ring) or return (Stork) to solid ground (House). (Child) begins again or (Fox) finds strategy. (Lily) offers peace. Send your written position before Friday evening.`

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
- Include card name in parentheses exactly once when first introduced: (CardName).
- Allow cards to be mentioned again without parentheses in natural narrative flow.
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
      const parenthesesPattern = new RegExp(`\\(${card.name}\\)`, 'g')
      const matches = story.match(parenthesesPattern)
      const count = matches?.length || 0

      if (count === 0) {
        missingCards.push(card.name)
        issues.push(`Card "${card.name}" not referenced with parentheses`)
      } else if (count > 1) {
        issues.push(`Card "${card.name}" referenced ${count} times (should be exactly 1)`)
      }
    })

    return {
      isValid: issues.length === 0,
      missingCards,
      issues
    }
  }
}
