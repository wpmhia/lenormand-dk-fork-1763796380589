import type { ReadingContext } from "@/lib/reading-context";
import { getGrandTableauPromptedHouseIds } from "@/lib/lenormand-evidence";

export type CardRelation = {
  cardA: number;
  cardB: number;
  relation: "adjacent" | "mirror" | "house" | "knight" | "diagonal";
};

type CardPolarity = "positive" | "negative" | "neutral" | "ambiguous";

const CARD_POLARITY: Record<number, CardPolarity> = {
  3: "ambiguous",
  2: "positive",
  6: "ambiguous",
  10: "ambiguous",
  22: "ambiguous",
  32: "ambiguous",
  33: "positive",
  35: "positive",
};

const POSITIVE_POLARITY_CARDS = new Set([9, 25, 31, 33, 35]);
const NEGATIVE_POLARITY_CARDS = new Set([8, 11, 23, 36]);
const PREREQUISITE_CONCEPT_CARDS = new Set([3, 6, 11, 22]);
const EXPLICIT_BLOCKING_CARDS = new Set([8, 21, 36]);

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
  {
    cardId: 22,
    unsupportedPatterns: [
      /\bneither (?:path|direction|option)\b/i,
      /\bno (?:path|direction|option) (?:leads?|offers?|provides?)\b/i,
      /\bboth (?:paths|directions|options) (?:fail|lack)\b/i,
    ],
    message: "Paths establishes a choice or alternative, not the outcome, quality, or destination of each option without qualifying evidence.",
  },
  {
    cardId: 33,
    unsupportedPatterns: [
      /\b(?:solution|answer|opportunity)\b.{0,35}\bnot yet (?:taken|seized|used|acted on)\b/i,
      /\bnot yet (?:taken|seized|used|acted on)\b.{0,35}\b(?:key|solution|answer)\b/i,
    ],
    message: "Key supports a solution or decisive answer; it does not establish that the solution has not yet been chosen or acted on.",
  },
];

const INTERACTION_PATTERN = /\b(?:dimmed|diminished|weakened|strengthened|blocked|clarified|obscured|surrounded|modifies|influences|acts upon)\b/i;
const NEGATIVE_POLARITY_PATTERN = /\b(?:unlikely|not imminent|will not|won't|will end|definitive ending|must separate|no (?:sex|intimacy|commitment|contact))\b/i;
const REQUIRED_SEPARATION_PATTERN = /\b(?:separation|cut|ending) (?:is|required|must be) required\b|\brequires? (?:a )?(?:separation|ending|break)\b/i;
// "Can happen" expresses possibility, not a positive answer. Treating it as
// polarity caused valid qualified forecasts to fail when ambiguous cards were drawn.
const POSITIVE_POLARITY_PATTERN = /\b(?:will|does)\b.{0,25}\b(?:happen|succeed|commit|occur|work out)\b|\b(?:yes|successful|certainly)\b/i;
const PREREQUISITE_PATTERN = /\b(?:obstacle|prerequisite|must first be resolved|must first be overcome|requires? overcoming|depends on resolving|cannot happen until|can't happen until|cannot proceed until|requires? (?:a )?(?:resolution|clearance))\b/i;

function pairKey(a: number, b: number): string {
  return `${Math.min(a, b)}:${Math.max(a, b)}`;
}

/** Relations that are actually represented by the context's generated evidence. */
export function getCardRelations(context: ReadingContext): CardRelation[] {
  const relations: CardRelation[] = context.adjacentPairs.map((pair) => ({
    cardA: pair.cardA.id,
    cardB: pair.cardB.id,
    relation: "adjacent",
  }));

  if (context.layout.type === "grand-tableau") {
    for (let row = 0; row < context.layout.grid.length; row++) {
      for (let column = 0; column < context.layout.grid[row].length; column++) {
        const current = context.layout.grid[row][column].card;
        if (column + 1 < context.layout.grid[row].length) {
          relations.push({ cardA: current.id, cardB: context.layout.grid[row][column + 1].card.id, relation: "adjacent" });
        }
        if (row + 1 < context.layout.grid.length) {
          relations.push({ cardA: current.id, cardB: context.layout.grid[row + 1][column].card.id, relation: "adjacent" });
        }
      }
    }
    for (const pair of context.layout.verticalPairs) {
      relations.push({ cardA: pair.cardA.id, cardB: pair.cardB.id, relation: "adjacent" });
    }
    for (const mirror of context.layout.mirrors) {
      relations.push({ cardA: mirror.cardA.id, cardB: mirror.cardB.id, relation: "mirror" });
    }
    const promptedHouseIds = getGrandTableauPromptedHouseIds(context.layout);
    for (const house of context.layout.houses) {
      if (promptedHouseIds.has(house.houseCardId)) {
        relations.push({ cardA: house.occupyingCard.id, cardB: house.houseCardId, relation: "house" });
      }
    }
  }

  const seen = new Set<string>();
  return relations.filter((relation) => {
    const key = `${pairKey(relation.cardA, relation.cardB)}:${relation.relation}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validatePredictionSemantics(
  development: string,
  context: ReadingContext,
  predictionEvidenceIds?: ReadonlySet<string>,
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

  const cardNames = context.cards.map((card) => ({ id: card.id, name: card.name }));
  const namedCards = cardNames.filter(({ name }) => new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(development));
  if (INTERACTION_PATTERN.test(development) && namedCards.length >= 2) {
    const relations = new Set(getCardRelations(context).map((relation) => pairKey(relation.cardA, relation.cardB)));
    const hasSupportedRelation = namedCards.some((a, index) =>
      namedCards.slice(index + 1).some((b) => relations.has(pairKey(a.id, b.id))),
    );
    if (!hasSupportedRelation) {
      issues.push({
        type: "semantic_grounding",
        message: "A card interaction claim requires an explicit positional or combination relationship between the named cards.",
      });
    }
  }

  if (PREREQUISITE_PATTERN.test(development)
    && [...cardIds].some((id) => PREREQUISITE_CONCEPT_CARDS.has(id))
    && ![...cardIds].some((id) => EXPLICIT_BLOCKING_CARDS.has(id))) {
    issues.push({
      type: "semantic_grounding",
      message: "An ambiguous development concept cannot be promoted into an obstacle or prerequisite without explicit blocking evidence.",
    });
  }

  if (questionRequiresPolarity(context.question)) {
    const makesNegativeClaim = NEGATIVE_POLARITY_PATTERN.test(development) || REQUIRED_SEPARATION_PATTERN.test(development);
    const makesPositiveClaim = POSITIVE_POLARITY_PATTERN.test(development);
    if (makesNegativeClaim || makesPositiveClaim) {
      const ambiguousCards = context.cards.filter((card) => CARD_POLARITY[card.id] === "ambiguous");
      const evidenceCardIds = predictionEvidenceIds && predictionEvidenceIds.size > 0
        ? new Set(context.cards.filter((_, index) => predictionEvidenceIds.has(`card-${index + 1}`)).map((card) => card.id))
        : new Set(context.cards.map((card) => card.id));
      const hasPolaritySupport = (makesNegativeClaim
        ? [...evidenceCardIds].some((id) => NEGATIVE_POLARITY_CARDS.has(id))
        : [...evidenceCardIds].some((id) => POSITIVE_POLARITY_CARDS.has(id)));
      if (ambiguousCards.length > 0 && !hasPolaritySupport) {
        issues.push({
          type: "semantic_grounding",
          message: "Prediction assigns positive or negative outcome polarity that the ambiguous evidence does not establish.",
        });
      }

      if ((context.spreadId === "sentence-3" || context.spreadId === "sentence-5") && context.cards.length >= 2) {
        const closingCards = context.cards.slice(-2);
        const earlierAmbiguous = context.cards.slice(0, -2).some((card) => CARD_POLARITY[card.id] === "ambiguous");
        const closingPolarity = closingCards.reduce<CardPolarity>((result, card) => {
          if (result !== "neutral") return result;
          if (POSITIVE_POLARITY_CARDS.has(card.id)) return "positive";
          if (NEGATIVE_POLARITY_CARDS.has(card.id)) return "negative";
          return CARD_POLARITY[card.id] ?? result;
        }, "neutral");
        const closingSupportsClaim = makesNegativeClaim
          ? closingPolarity === "negative"
          : closingPolarity === "positive";
        const explicitBlockingSupport = [...evidenceCardIds].some((id) => EXPLICIT_BLOCKING_CARDS.has(id));
        if (earlierAmbiguous && !closingSupportsClaim && !explicitBlockingSupport) {
          issues.push({
            type: "semantic_grounding",
            message: "Earlier ambiguous evidence cannot override the polarity established by the closing pair and closing card.",
          });
        }
      }
    }
  }

  return issues;
}

function questionRequiresPolarity(question: string): boolean {
  return /\?|\b(?:will|would|can|could|should|is|are|do|does|did|yes|no|likely|unlikely)\b/i.test(question);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
