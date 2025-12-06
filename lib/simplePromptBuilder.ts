/**
 * Simple Prompt Builder for DeepSeek API
 * Generates prophecy + practical translation format
 * Two-part response separated by ---SEPARATOR---
 */

import { LenormandCard, SpreadRule } from '@/types/agent.types'

export interface SimplePromptOptions {
  cards: LenormandCard[]
  spread: SpreadRule
  question: string
  spreadId?: string
}

export class SimplePromptBuilder {
  /**
   * Build simple prompt with prophecy + practical translation
   */
  static buildPrompt(options: SimplePromptOptions): string {
    const { cards, spread, question, spreadId } = options
    const cardsText = cards.map((c, i) => `${i + 1}. ${c.name}`).join(' — ')

    return `You are Marie-Anne Lenormand, legendary Paris fortune-teller. Provide a reading in TWO parts, separated by ---SEPARATOR---.

QUESTION: "${question}"
CARDS: ${cardsText}
SPREAD: ${spread.template} (${cards.length} cards)

PART 1 - THE PROPHECY (ANSWER THE QUESTION):
Write a symbolic, direct prophecy that ANSWERS the question using all ${cards.length} cards. Each card should appear ONCE in parentheses on first mention: (CardName).
- Start by directly addressing the question
- Be evocative, symbolic, and clear
- Use vivid language (weight, wall, crack, shadow, light, door, stone, water, fire, ice, seal, push, move)
- End with a clear command or imperative action
- 2-4 paragraphs total

PART 2 - PLAIN ENGLISH EXPLANATION:
After ---SEPARATOR---, explain what the prophecy means in practical terms.
- Clearly answer: What does this mean for the question asked?
- Explain what each card represents in this context
- Provide actionable next steps
- Keep it clear and practical
- 2-3 paragraphs

Format:
[PROPHECY ANSWERING THE QUESTION]

---SEPARATOR---

[PRACTICAL EXPLANATION]`
  }
}
