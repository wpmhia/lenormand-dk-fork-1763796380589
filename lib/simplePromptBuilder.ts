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

CARD MEANINGS REFERENCE:
${cards.map((c, i) => `${i + 1}. ${c.name}: ${this.getCardMeaning(c.id)}`).join("\n")}

Write the reading now:`;
  }

  private static cardMeanings: Record<number, string> = {
    1: "Rider - News, arrival, a message coming your way",
    2: "Clover - Luck, opportunity, brief happiness, hope",
    3: "Ship - Journey, travel, adventure, change of scene",
    4: "House - Home, family matters, stability, foundation",
    5: "Tree - Health, growth, life path, family tree, roots",
    6: "Clouds - Uncertainty, confusion, change in the air",
    7: "Snake - Deception, temptation, wisdom, temptation to resist",
    8: "Coffin - Endings, transformation, putting something to rest",
    9: "Bouquet - Gift, appreciation, beauty, joy, recognition",
    10: "Scythe - Danger, sudden change, cutting away, harvest",
    11: "Whip - Conflict, struggle, repetition, persistence needed",
    12: "Birds - Anxiety, communication, worry, nervousness",
    13: "Child - New beginning, innocence, small matters, ideas",
    14: "Fox - Cunning, caution, watching your back, resourcefulness",
    15: "Bear - Strength, protection, powerful forces, authority",
    16: "Stars - Hope, guidance, wishes, inspiration, clarity",
    17: "Stork - Change, new beginnings, movement, improvement",
    18: "Dog - Loyalty, friendship, trust, a faithful person",
    19: "Tower - Isolation, institutions, official matters, stability",
    20: "Garden - Social life, gathering, community, public matters",
    21: "Mountain - Obstacles, challenges, delays, perseverance needed",
    22: "Path - Choice, direction, crossroads, opportunities ahead",
    23: "Rats - Loss, decay, betrayal, things falling apart",
    24: "Heart - Love, affection, matters of the heart, romance",
    25: "Ring - Commitment, partnership, contracts, cycles",
    26: "Book - Secrets, knowledge, study, something unknown",
    27: "Letter - Message, news, written communication, documentation",
    28: "Gentleman - A man, the querent, masculine energy",
    29: "Lady - A woman, the querent, feminine energy",
    30: "Lily - Calm, maturity, sexuality, purity, peace",
    31: "Sun - Success, happiness, clarity, achievement, joy",
    32: "Moon - Emotions, intuition, the subconscious, dreams",
    33: "Key - Solution, opportunity, success, unlocking potential",
    34: "Fish - Money, business, success, flow, abundance",
    35: "Anchor - Stability, commitment, patience, waiting it out",
    36: "Cross - Burden, destiny, fate, testing, spirituality",
  };

  private static getCardMeaning(cardId: number): string {
    return this.cardMeanings[cardId] || `Card ${cardId}`;
  }
}
