import { buildLenormandContext, type RawDrawnCard } from "@/lib/lenormand-context";
import type { SpreadId } from "@/lib/spread-definitions";

/**
 * Builds the self-contained text for "Copy for AI". It uses the same shared context builder as the
 * DeepSeek call, so the instructions and the reading facts are identical. The only difference is the
 * output format: an external assistant gets readable prose, not the API's JSON object.
 */
export function buildCopyForAIText(
  spreadId: SpreadId,
  question: string,
  drawn: RawDrawnCard[],
  significatorPreference: "woman" | "man" | "both" = "both",
): string {
  const context = buildLenormandContext(spreadId, question, drawn, significatorPreference);
  return [
    "The text below is a complete Lenormand reading context in three sections: instructions, reading facts and output format. Follow the instructions, base your answer only on the facts, and present it in the output format. Every position, neighbour, direction and house relation is given explicitly; do not recalculate or invent any of them.",
    "",
    "## Instructions",
    context.instructions,
    "",
    "## Reading facts",
    context.facts,
    "",
    "## Output format",
    context.readableOutput,
  ].join("\n");
}
