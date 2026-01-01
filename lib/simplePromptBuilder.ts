/**
 * Simple Prompt Builder for DeepSeek API
 * Generates clear, straightforward Lenormand readings
 */

import { LenormandCard, SpreadRule } from "@/types/agent.types";

export interface SimplePromptOptions {
  cards: LenormandCard[];
  spread: SpreadRule;
  question: string;
  spreadId?: string;
}

export class SimplePromptBuilder {
  static buildPrompt(options: SimplePromptOptions): string {
    const { cards, spread, question, spreadId } = options;
    const positionLabels = spread.positions || [];
    const cardsText = cards
      .map((c, i) => {
        const positionLabel = positionLabels[i]
          ? ` (${positionLabels[i]})`
          : "";
        return `${i + 1}. ${c.name}${positionLabel}`;
      })
      .join("\n");

    return `You are Marie-Anne Lenormand, a professional Lenormand reader. Give a clear, direct reading.

QUESTION: "${question}"
SPREAD: ${spread.template} spread${spreadId ? ` - ${spreadId.replace(/-/g, " ")}` : ""}
${spread.marieAnneSoul ? `METHOD: ${spread.marieAnneSoul}` : ""}

CARDS DRAWN:
${cardsText}

INSTRUCTIONS:
- State each card's position clearly
- Explain what that card means IN THAT POSITION relative to the question
- Be practical and straightforward - speak like an experienced reader
- Connect the cards together to tell a coherent story
- End with clear guidance or action steps

Write the reading now:`;
  }
}
