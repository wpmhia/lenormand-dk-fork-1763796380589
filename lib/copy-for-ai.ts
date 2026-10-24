import { CARD_CATALOG } from "@/lib/card-catalog";
import { getDefinition } from "@/lib/spread-definitions";
import { buildClassicAnalysis } from "@/lib/classic-analysis";
import { houseName, significatorLines } from "@/lib/prompt-builder";
import type { Card, ReadingCard } from "@/lib/types";
import type { SpreadId } from "@/lib/spread-definitions";

/**
 * Builds the self-contained text for "Copy for AI". It is assembled only from existing sources:
 * the spread definition (label and card count), the card catalogue (names and canonical core
 * meanings), the classic analysis geometry, and the same house and significator helpers the
 * interpretation prompt uses. Nothing is generated, no model is called, and no meaning is invented.
 */
export function buildCopyForAIText(
  spreadId: SpreadId,
  question: string,
  drawn: ReadingCard[],
  allCards: Card[] = CARD_CATALOG,
): string {
  const definition = getDefinition(spreadId);
  const label = definition?.label ?? spreadId;
  const nameOf = (id: number) => allCards.find((c) => c.id === id)?.name ?? `Card ${id}`;
  const meaningOf = (id: number) => allCards.find((c) => c.id === id)?.meaning.general ?? "";

  const analysis = buildClassicAnalysis(spreadId, question, drawn, allCards);
  const cardLines = drawn.map((card, index) => {
    const meaning = meaningOf(card.id);
    return `${index + 1}. ${nameOf(card.id)}${meaning ? ` — ${meaning}` : ""}`;
  });

  const sections: string[] = [
    "Please give a traditional Lenormand interpretation of this spread. Prioritise meaningful card combinations and their order, and answer the question directly.",
    "",
    `Question: ${question.trim() || "(no question given)"}`,
    `Spread: ${label} (${drawn.length} cards)`,
    "",
    "Cards, in drawn order:",
    ...cardLines,
  ];

  if (analysis.geometry.length > 0) {
    sections.push("", "Spread geometry:", ...analysis.geometry);
  }

  if (drawn.length === 36) {
    sections.push(
      "",
      "Grand Tableau houses (the card at position N occupies the house of the card with deck number N):",
      ...drawn.map((_, index) => `${index + 1}: ${nameOf(drawn[index].id)} — ${houseNameOf(index, allCards)} house`),
    );
    const normalized = drawn.map((card, index) => {
      const data = allCards.find((c) => c.id === card.id);
      return {
        id: card.id,
        name: data?.name ?? `Card ${card.id}`,
        keywords: data?.keywords ?? [],
        position: index,
      };
    });
    const significators = significatorLines(normalized);
    if (significators.length > 0) sections.push(...significators);
  }

  return sections.join("\n");
}

/** The house name for a position, through the same rule the interpretation prompt uses. */
function houseNameOf(index: number, allCards: Card[]): string {
  return allCards.find((c) => c.id === index + 1)?.name ?? houseName(index);
}
