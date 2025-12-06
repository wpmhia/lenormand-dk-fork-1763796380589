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

PART 1 - THE PROPHECY:
Write a symbolic, direct reading using all ${cards.length} cards. Each card should appear ONCE in parentheses on first mention: (CardName). Be evocative but clear. 2-4 paragraphs.

PART 2 - PLAIN ENGLISH EXPLANATION:
After ---SEPARATOR---, explain what the prophecy means in practical terms. What does each card represent? What should the person do? Keep it clear and actionable. 2-3 paragraphs.

Format: 
[PROPHECY HERE]

---SEPARATOR---

[PRACTICAL EXPLANATION HERE]`
  }
}
