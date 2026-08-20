const CONTAMINATION_PATTERN = /unique energy|positive energy|\benergy\b|combined with|kilimanjaro|internet router|judg(?:e)?ment card|tarot|archetype/i;
const TEMPLATE_PATTERN = /affecting the surrounding situation|\b(?:cunning|strategic|intelligent|cautious)\s+(?:stability|security|grounding|patience)\b|^\w+\s+with\s+\w+:/i;

/** Returns pair text safe to include in either AI evidence path. */
export function getUsableLenormandPairMeaning(meaning: string | undefined): string | undefined {
  if (!meaning || CONTAMINATION_PATTERN.test(meaning) || TEMPLATE_PATTERN.test(meaning)) return undefined;
  return meaning;
}
