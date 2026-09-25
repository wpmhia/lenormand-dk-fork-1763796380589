import canonicalPairs from "@/public/data/canonical-pairs.json";
import type { QuestionFrame } from "@/lib/question-frame";

const CONTAMINATION_PATTERN = /unique energy|positive energy|\benergy\b|combined with|kilimanjaro|internet router|judg(?:e)?ment card|tarot|archetype|spiritual journey|healing journey|cosmic meaning/i;
const TEMPLATE_PATTERN = /affecting the surrounding situation|\b(?:cunning|strategic|intelligent|cautious)\s+(?:stability|security|grounding|patience)\b|^\w+\s+with\s+\w+:/i;

type CanonicalSense = { meaning: string; domain?: string; domains?: string[]; predicate?: string | string[]; direction?: string };
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

function senseMatchesDomain(sense: CanonicalSense, domain: string): boolean {
  return sense.domain?.toLowerCase() === domain.toLowerCase()
    || sense.domains?.some((item) => item.toLowerCase() === domain.toLowerCase()) === true;
}

export function getCanonicalLenormandPairMeaning(a: number, b: number, question?: Pick<QuestionFrame, "domain" | "predicate"> | null): string | undefined {
  const pair = CANONICAL_PAIRS.get(pairKey(a, b));
  if (!pair) return undefined;
  const senses = pair.senses || [];
  if (question) {
    const exact = senses.find((sense) => {
      const predicates = Array.isArray(sense.predicate) ? sense.predicate : sense.predicate ? [sense.predicate] : [];
      return predicates.some((predicate) => predicate.toLowerCase() === question.predicate.toLowerCase())
        || senseMatchesDomain(sense, question.domain) && predicates.length === 0;
    });
    if (exact) return exact.meaning;
    const domain = senses.find((sense) => senseMatchesDomain(sense, question.domain));
    if (domain) return domain.meaning;
  }
  // Without a parsed question, use the reviewed corpus's first canonical sense.
  // Some imported records use `domains` instead of a single `domain`, so treating
  // those records as unusable here would silently discard reviewed meanings.
  return senses.find((sense) => !sense.domain && !sense.domains && !sense.predicate)?.meaning
    || senses[0]?.meaning
    || pair.general;
}

/** Returns pair text safe to include in either AI evidence path. */
export function getUsableLenormandPairMeaning(meaning: string | undefined): string | undefined {
  if (!meaning || CONTAMINATION_PATTERN.test(meaning) || TEMPLATE_PATTERN.test(meaning)) return undefined;
  return meaning;
}
