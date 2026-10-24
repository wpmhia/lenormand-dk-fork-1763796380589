import { buildLenormandContext, type RawDrawnCard } from "@/lib/lenormand-context";
import type { SpreadId } from "@/lib/spread-definitions";

/**
 * Builds the self-contained text for "Copy for AI". It uses the same shared context builder as the
 * DeepSeek call, so the instructions and the reading facts are identical. The only difference is the
 * output format: an external assistant gets readable prose, not the API's JSON object.
 */
/** The work-order sentence as it reads in the external prompt: plain prose, no JSON reference. */
const COPY_WORK_ORDER =
  "Work order: first weigh the cards and formulate the reading. Then state the answer in one or two plain sentences, directly addressing the user's question. Present the Reading section first and the Answer section last.";

/**
 * The shared system instructions with the one work-order sentence replaced for the copied prompt.
 * The API keeps the original sentence; only the external prompt is changed, and only that sentence.
 */
export function copyInstructions(instructions: string): string {
  const pattern = /^Work order: .*$/m;
  if (!pattern.test(instructions)) {
    throw new Error("The shared instructions no longer contain the work-order sentence");
  }
  return instructions.replace(pattern, COPY_WORK_ORDER);
}

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
    copyInstructions(context.instructions),
    "",
    "## Reading facts",
    context.facts,
    "",
    "## Output format",
    context.readableOutput,
  ].join("\n");
}
