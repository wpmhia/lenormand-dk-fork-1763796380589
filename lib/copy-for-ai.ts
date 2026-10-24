import { buildLenormandContext, type RawDrawnCard } from "@/lib/lenormand-context";
import type { SpreadId } from "@/lib/spread-definitions";

/**
 * Builds the self-contained text for "Copy for AI". It uses the same shared context builder as the
 * DeepSeek call, so the facts and the interpretation instructions are identical. Only the packaging
 * differs: here the instructions and facts are pasted as one text with a short introduction that
 * explains them to a general-purpose assistant that has no access to this application.
 */
export function buildCopyForAIText(
  spreadId: SpreadId,
  question: string,
  drawn: RawDrawnCard[],
): string {
  const context = buildLenormandContext(spreadId, question, drawn);
  return [
    "The text below is a complete Lenormand reading context. Follow the instructions in the first section and base your answer only on the facts in the second section. Every position, neighbour, direction and house relation is given explicitly; do not recalculate or invent any of them.",
    "",
    "## Instructions",
    context.instructions,
    "",
    "## Reading facts",
    context.facts,
  ].join("\n");
}
