import { AgentRequest, AgentResponse, LenormandCard } from '@/types/agent.types'
import { SPREAD_RULES } from './spreadRules'
import { pipToDeadline } from './deadline'
import { makeTask } from './taskGen'

const TEMPLATE_1_CARD = `A weight lifts from your shoulders (Lily) as clarity arrives by Thursday. The cards say: rest deeply, trust the calm. Send word to one person you care about before Friday—confirm the path forward.`

const TEMPLATE_3_CARD = `A close friend (Dog) ghosts you after an abrupt cut (Coffin), leaving the week stuck (Mountain). The silence breaks next Thursday—send one check-in text before then; if they don't bite, let the friendship sleep. Watch for the icy reply around Thursday evening.`

const TEMPLATE_5_CARD = `Your job search stalls (Mountain + Fox). Wednesday flips it—an email arrives with an interview slot (Key + Letter). You'll know by Friday if they bite. Send your portfolio by EOD Wednesday, then rest. Call the hiring manager Tuesday if silence.`

const TEMPLATE_7_CARD = `Monday brings tension (Whip). By Wednesday, a conversation breaks the ice (Birds + Key). Thursday through Friday, the path clears (Sun + Rider). You're moving forward by the weekend. Text them Thursday morning—don't wait. Confirm the next step by Friday evening.`

const TEMPLATE_9_CARD = `Paragraph 1: The weight in your situation (cards 1-3) bears down—a friction pair stands unmoved. Paragraph 2: By midweek (cards 4-6), a release unfolds—someone speaks, a door cracks open, momentum shifts. Paragraph 3: By Friday evening (cards 7-9), you know the verdict and the next move. Take the action before the weekend passes.`

const TEMPLATE_36_CARD = `P1: The tableau opens with deep friction—cards 1-9 reveal the core tension, the weight that's been sitting beneath everything. P2: Cards 10-20 show the turning point—a release, a person, a moment where the deadlock cracks and momentum shifts. P3: Cards 21-30 expose what you haven't seen—the hidden dynamics, the unspoken truth, the under-the-surface reality that changes everything. P4: Cards 31-36 land the verdict—the outcome, the timeline (by Friday), and your one concrete action before the weekend. Make that call, send that message, or sign that paper before Friday evening.`

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
- Final sentence = YES/NO/STAY + "by [Day] evening" + imperative task.
- Never name cards in parentheses. Cards dissolve into consequences.
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
}
