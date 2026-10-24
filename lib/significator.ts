import type { SignificatorType } from "@/lib/spreads";

/** The reading-side significator preference used by the shared context and the API. */
export type SignificatorPreference = "woman" | "man" | "both";

/**
 * The one mapping from the UI's significator choice to the reading preference. The AI request, the
 * follow-up request and Copy for AI all use this function, so the same choice reaches every path.
 */
export function significatorToPreference(value: SignificatorType): SignificatorPreference {
  if (value === "anima") return "woman";
  if (value === "animus") return "man";
  return "both";
}
