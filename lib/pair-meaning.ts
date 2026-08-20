const CONTAMINATION_PATTERN = /unique energy|positive energy|\benergy\b|combined with|kilimanjaro|internet router|judg(?:e)?ment card|tarot|archetype/i;

/** Returns pair text safe to include in either AI evidence path. */
export function getUsableLenormandPairMeaning(meaning: string | undefined): string | undefined {
  if (!meaning || CONTAMINATION_PATTERN.test(meaning)) return undefined;
  return meaning;
}
