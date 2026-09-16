import canonicalPairs from "@/public/data/canonical-pairs.json";
import type { QuestionFrame } from "@/lib/question-frame";

const CONTAMINATION_PATTERN = /unique energy|positive energy|\benergy\b|combined with|kilimanjaro|internet router|judg(?:e)?ment card|tarot|archetype|spiritual journey|healing journey|cosmic meaning/i;
const TEMPLATE_PATTERN = /affecting the surrounding situation|\b(?:cunning|strategic|intelligent|cautious)\s+(?:stability|security|grounding|patience)\b|^\w+\s+with\s+\w+:/i;

type CanonicalSense = { meaning: string; domain?: string; predicate?: string | string[]; direction?: string };
type CanonicalPair = { cards: [number, number]; senses: CanonicalSense[]; general?: string; reviewStatus?: string };

const CANONICAL_PAIRS = new Map(
  (canonicalPairs as unknown as CanonicalPair[]).map((pair) => [
    pairKey(pair.cards[0], pair.cards[1]),
    pair,
  ]),
);

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}:${Math.max(a, b)}`;
}

export function getCanonicalLenormandPairMeaning(a: number, b: number, question?: Pick<QuestionFrame, "domain" | "predicate"> | null): string | undefined {
  const pair = CANONICAL_PAIRS.get(pairKey(a, b));
  if (!pair) return undefined;
  const senses = pair.senses || [];
  if (question) {
    const exact = senses.find((sense) => {
      const predicates = Array.isArray(sense.predicate) ? sense.predicate : sense.predicate ? [sense.predicate] : [];
      return predicates.some((predicate) => predicate.toLowerCase() === question.predicate.toLowerCase())
        || sense.domain?.toLowerCase() === question.domain.toLowerCase() && predicates.length === 0;
    });
    if (exact) return exact.meaning;
    const domain = senses.find((sense) => sense.domain?.toLowerCase() === question.domain.toLowerCase());
    if (domain) return domain.meaning;
  }
  return senses.find((sense) => !sense.domain && !sense.predicate)?.meaning || pair.general;
}

/** Returns pair text safe to include in either AI evidence path. */
export function getUsableLenormandPairMeaning(meaning: string | undefined): string | undefined {
  if (!meaning || CONTAMINATION_PATTERN.test(meaning) || TEMPLATE_PATTERN.test(meaning)) return undefined;
  return meaning;
}
