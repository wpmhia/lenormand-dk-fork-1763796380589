import type { ReadingContext } from "@/lib/reading-context";

export interface SemanticGroundingIssue {
  type: "semantic_grounding";
  message: string;
}

interface SemanticRestriction {
  cardId: number;
  domain?: ReadingContext["questionDomain"];
  unsupportedPatterns: RegExp[];
  message: string;
  requiresAbsentCardIds?: number[];
}

const RESTRICTIONS: SemanticRestriction[] = [
  {
    cardId: 13,
    domain: "love",
    unsupportedPatterns: [/\byounger (?:man|woman|person|partner)\b/i, /\byoung (?:man|woman|person|partner)\b/i],
    message: "Child in the love domain is grounded as a new beginning; a younger person is not supported unless established by the question.",
  },
  {
    cardId: 2,
    unsupportedPatterns: [/\btemporar\w* relationship\b/i, /\brelationship\b.{0,30}\btemporar\w*\b/i, /\bimprov\w*\b.{0,30}\btemporar\w*\b/i],
    message: "Clover makes the opportunity or benefit temporary; it does not establish that the resulting relationship or improvement is temporary.",
  },
  {
    cardId: 10,
    unsupportedPatterns: [/\bdefinitive(?:ly)?\b/i, /\bpermanent(?:ly)?\b/i, /\birreversible\b/i],
    message: "Scythe supports a sharp decision or sudden separation, not a definitive, permanent, or irreversible outcome without stronger evidence.",
    requiresAbsentCardIds: [8],
  },
];

export function validatePredictionSemantics(
  development: string,
  context: ReadingContext,
): SemanticGroundingIssue[] {
  const cardIds = new Set(context.cards.map((card) => card.id));
  const issues: SemanticGroundingIssue[] = [];

  for (const restriction of RESTRICTIONS) {
    if (!cardIds.has(restriction.cardId)) continue;
    if (restriction.domain && restriction.domain !== context.questionDomain) continue;
    if (restriction.requiresAbsentCardIds?.some((id) => cardIds.has(id))) continue;
    if (!restriction.unsupportedPatterns.some((pattern) => pattern.test(development))) continue;

    issues.push({ type: "semantic_grounding", message: restriction.message });
  }

  return issues;
}
