const CONTAMINATION_PATTERN = /unique energy|positive energy|\benergy\b|combined with|kilimanjaro|internet router|judg(?:e)?ment card|tarot|archetype|spiritual journey|healing journey|cosmic meaning/i;
const TEMPLATE_PATTERN = /affecting the surrounding situation|\b(?:cunning|strategic|intelligent|cautious)\s+(?:stability|security|grounding|patience)\b|^\w+\s+with\s+\w+:/i;

// Only vetted pair records are authoritative. Unlisted pairs deliberately
// return no prose until their canonical Lenormand meaning is reviewed.
const CANONICAL_PAIR_MEANINGS: Record<string, string> = {
  "13:22": "a new beginning becoming a concrete choice between directions",
  "13:24": "a strongly desired fresh start",
  "14:35": "work or employment tied to stability; security that requires caution",
  "23:35": "stability being eroded or worry affecting the established situation",
  "26:28": "an unresolved or undisclosed factor around a man or decision-maker",
};

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}:${Math.max(a, b)}`;
}

export function getCanonicalLenormandPairMeaning(a: number, b: number): string | undefined {
  return CANONICAL_PAIR_MEANINGS[pairKey(a, b)];
}

/** Returns pair text safe to include in either AI evidence path. */
export function getUsableLenormandPairMeaning(meaning: string | undefined): string | undefined {
  if (!meaning || CONTAMINATION_PATTERN.test(meaning) || TEMPLATE_PATTERN.test(meaning)) return undefined;
  return meaning;
}
