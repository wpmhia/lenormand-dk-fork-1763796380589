import canonicalPairs from "@/public/data/canonical-pairs.json";

const CONTAMINATION_PATTERN = /unique energy|positive energy|\benergy\b|combined with|kilimanjaro|internet router|judg(?:e)?ment card|tarot|archetype|spiritual journey|healing journey|cosmic meaning/i;
const TEMPLATE_PATTERN = /affecting the surrounding situation|\b(?:cunning|strategic|intelligent|cautious)\s+(?:stability|security|grounding|patience)\b|^\w+\s+with\s+\w+:/i;

const CANONICAL_PAIR_MEANINGS = new Map(
  (canonicalPairs as { cards: [number, number]; senses: string[] }[]).map((pair) => [
    pairKey(pair.cards[0], pair.cards[1]),
    pair.senses[0],
  ]),
);

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}:${Math.max(a, b)}`;
}

export function getCanonicalLenormandPairMeaning(a: number, b: number): string | undefined {
  return CANONICAL_PAIR_MEANINGS.get(pairKey(a, b));
}

/** Returns pair text safe to include in either AI evidence path. */
export function getUsableLenormandPairMeaning(meaning: string | undefined): string | undefined {
  if (!meaning || CONTAMINATION_PATTERN.test(meaning) || TEMPLATE_PATTERN.test(meaning)) return undefined;
  return meaning;
}
