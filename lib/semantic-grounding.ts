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
const MEETING_SUPPORT_CARDS = new Set([1, 12, 20, 27]);

export interface SemanticGroundingIssue {
  type: "semantic_grounding";
  message: string;
}

export type SubjectValidationScope = "interpretation" | "card-commentary" | "prediction";

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
const NEGATIVE_TIMING_PATTERN = /\b(?:unlikely|not likely|probably not|not expected|will not|won't)\b.{0,45}\b(?:within|in|this|the next|binnen)\b.{0,25}\b(?:\d+\s*(?:days?|dagen?)|week(?:s)?|weekend)\b|\b(?:not this week|not within \d+\s*(?:days?|dagen?))\b|\b(?:only|just)\s+(?:in|over)\s+(?:the )?coming weeks\b/i;
const MEETING_EXPANSION_PATTERN = /\b(?:planned|scheduled)\s+(?:meeting|appointment|encounter)\b|\b(?:meeting|appointment|encounter)\s+(?:is )?(?:planned|scheduled)\b|\b(?:geplande|afgesproken)\s+(?:ontmoeting|afspraak)\b|\b(?:ontmoeting|afspraak)\s+(?:staat|is)\s+gepland\b/i;
const CHOICE_PREREQUISITE_PATTERN = /\b(?:depends on|hinges on|hangs on)\b.{0,30}\b(?:a )?choice\b|\b(?:choice|decision)\b.{0,35}\b(?:still )?(?:has to|needs to|must be)\b.{0,20}\b(?:made|resolved)\b|\b(?:keuze|beslissing)\b.{0,35}\b(?:moet nog|nog moet)\b.{0,20}\b(?:gemaakt|genomen)\b|\bhangt af van een keuze\b/i;
const SEXUAL_QUESTION_PATTERN = /\b(?:sex|seks|sexual|seksuele|intimacy|intimate|intercourse|intiem|intimiteit|toenadering)\b/i;
const SEXUAL_ANSWER_PATTERN = /\b(?:sex|seks|sexual intimacy|seksuele intimiteit|intimacy|intimate|intercourse|intiem|intimiteit|toenadering)\b/i;
const EXACT_SEX_QUESTION_PATTERN = /\b(?:sex|seks|intercourse)\b/i;
const EXACT_SEX_ANSWER_PATTERN = /\b(?:sex|seks|intercourse)\b/i;
const MALE_ENTITY_PATTERN = /\b(?:the|a|another)?\s*man\b|\b(?:he|him|his|husband|boyfriend|lover)\b|\b(?:represented by|becomes|is)\s+(?:the )?man\b/i;
const FEMALE_ENTITY_PATTERN = /\b(?:the|a|another)?\s*woman\b|\b(?:she|her|hers|wife|girlfriend|lover)\b|\b(?:represented by|becomes|is)\s+(?:the )?woman\b/i;
const BEAR_ENTITY_PATTERN = /\b(?:boss|manager|authority figure|parent|rival|another partner|someone in (?:a )?position of power)\b/i;
const PATHS_TREE_EXPANSION_PATTERN = /\b(?:lasting consequences?|well[- ]?being|stability|stable future)\b/i;
const SNAKE_ENTITY_PATTERN = /\b(?:female rival|rival|mistress|other woman|competitor|enemy)\b/i;
const CAUSALITY_PATTERN = /\b(?:because of|due to|causes?|caused by|results? in|leads? to|as a result of|vanwege|veroorzaakt|leidt tot)\b/i;
const TEMPORAL_ORDER_PATTERN = /\b(?:first|then|before|after|until|only after|eerst|daarna|voordat|nadat|pas nadat)\b/i;
const UNSUPPORTED_DURATION_PATTERN = /\b(?:for (?:several|many) (?:days?|weeks?|months?)|(?:last|lasting)\s+(?:several|many)\s+(?:days?|weeks?|months?)|for a long time|lasting for|wekenlang|maandenlang|voor lange tijd)\b/i;
const UNSUPPORTED_PERSISTENCE_PATTERN = /\b(?:will continue|continues? indefinitely|will remain|ongoing|blijft voortduren|blijvend)\b/i;
const SEVERITY_INFLATION_PATTERN = /\b(?:major|very strong|extreme|almost impossible|serious blockage|grote blokkade|zeer sterke blokkade|bijna onmogelijk)\b/i;
const SUBJECT_REPLACEMENT_PATTERN = /\b(?:the|a|another)?\s*(?:man|woman)\b|\b(?:he|him|his|she|her|hers|husband|wife|boyfriend|girlfriend|lover)\b/i;

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
  options: { validatePolarity?: boolean; validateQuestionSpecificity?: boolean } = {},
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

  if (hasRequestedTimingWindow(context.question)
    && NEGATIVE_TIMING_PATTERN.test(development)
    && !timingEvidenceExplicitlyExcludesWindow(context)) {
    issues.push({
      type: "semantic_grounding",
      message: "Absence of timing confirmation is not evidence that the requested time window is unlikely; preserve timing uncertainty instead.",
    });
  }

  if (MEETING_EXPANSION_PATTERN.test(development)
    && cardIds.has(2)
    && cardIds.has(25)
    && ![...cardIds].some((id) => MEETING_SUPPORT_CARDS.has(id))) {
    issues.push({
      type: "semantic_grounding",
      message: "Clover + Ring supports a temporary opportunity or relationship bond, not a planned meeting or appointment without explicit meeting evidence.",
    });
  }

  if (CHOICE_PREREQUISITE_PATTERN.test(development) && cardIds.has(22)) {
    issues.push({
      type: "semantic_grounding",
      message: "Paths supports an open choice or multiple directions; it does not establish that a choice must first be made before the queried outcome can occur.",
    });
  }

  if (options.validateQuestionSpecificity !== false
    && SEXUAL_QUESTION_PATTERN.test(context.question)
    && !SEXUAL_ANSWER_PATTERN.test(development)) {
    issues.push({
      type: "semantic_grounding",
      message: "An explicit sexual-intimacy question requires the prediction to name that queried event rather than substitute a generic successful or clear outcome.",
    });
  }

  if (options.validateQuestionSpecificity !== false
    && EXACT_SEX_QUESTION_PATTERN.test(context.question)
    && !EXACT_SEX_ANSWER_PATTERN.test(development)) {
    issues.push({ type: "semantic_grounding", message: "The prediction must preserve the exact sex predicate; intimacy, attraction, closeness, or contact alone is not equivalent to sex." });
  }

  const personText = development.replace(/\b(?:the )?(?:man|woman) card\b/gi, "");
  for (const [cardId, pattern, label] of [[28, MALE_ENTITY_PATTERN, "Man"], [29, FEMALE_ENTITY_PATTERN, "Woman"]] as const) {
    if (!cardIds.has(cardId) || !pattern.test(personText)) continue;
    const binding = context.personBindings.find((candidate) => candidate.cardId === cardId);
    if (!binding) {
      issues.push({
        type: "semantic_grounding",
        message: `${label} is unbound in this question; a concrete person, partner, or gendered pronoun cannot be assigned to it without entity-binding evidence.`,
      });
    }
  }

  if (cardIds.has(15) && BEAR_ENTITY_PATTERN.test(development)
    && !BEAR_ENTITY_PATTERN.test(context.question)) {
    issues.push({
      type: "semantic_grounding",
      message: "Bear supports power, strength, or authority; it does not establish a concrete boss, parent, rival, or third person without entity evidence.",
    });
  }

  if (cardIds.has(7) && SNAKE_ENTITY_PATTERN.test(development)
    && !SNAKE_ENTITY_PATTERN.test(context.question)) {
    issues.push({ type: "semantic_grounding", message: "Snake supports complication, caution, or an indirect route; it does not establish a female rival or other concrete person without entity evidence." });
  }

  if (cardIds.has(22) && cardIds.has(5) && PATHS_TREE_EXPANSION_PATTERN.test(development)
    && ![4, 31, 35].some((id) => cardIds.has(id))) {
    issues.push({
      type: "semantic_grounding",
      message: "Paths + Tree supports an open direction and long-term growth or condition, not lasting consequences, well-being, or stability without qualifying evidence.",
    });
  }

  const pairEvidenceText = context.adjacentPairs.map((pair) => pair.traditionalMeaning || "").join(" ");
  if (CAUSALITY_PATTERN.test(development) && !/caus|leads?|results?|because|due|veroorzaakt|leidt/i.test(pairEvidenceText)) {
    issues.push({ type: "semantic_grounding", message: "The supplied evidence does not encode the claimed causal relationship." });
  }
  if (TEMPORAL_ORDER_PATTERN.test(development) && !/before|after|until|first|then|voordat|nadat|eerst|daarna|pas/i.test(pairEvidenceText)) {
    issues.push({ type: "semantic_grounding", message: "The supplied evidence does not encode the claimed first/then or before/after sequence." });
  }
  if (UNSUPPORTED_DURATION_PATTERN.test(development) && context.timingEvidence.length === 0) {
    issues.push({ type: "semantic_grounding", message: "The supplied evidence does not establish the claimed duration." });
  }
  if (UNSUPPORTED_PERSISTENCE_PATTERN.test(development) && ![4, 5, 35].some((id) => cardIds.has(id))) {
    issues.push({ type: "semantic_grounding", message: "The supplied evidence does not establish persistence or continuation." });
  }
  if (SEVERITY_INFLATION_PATTERN.test(development) && ![8, 21, 36].some((id) => cardIds.has(id))) {
    issues.push({ type: "semantic_grounding", message: "The supplied evidence does not establish the claimed severity." });
  }

  if (options.validatePolarity !== false && questionRequiresPolarity(context.question)) {
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

export function validateQuestionSubjectPreservation(
  text: string,
  context: ReadingContext,
  scope: SubjectValidationScope,
): SemanticGroundingIssue[] {
  const primarySubject = context.questionSubjects[0];
  if (!primarySubject) return [];

  // Descriptive subjects such as "my partner" or "the relationship" are
  // semantic roles, not unique identities. Natural pronouns and role terms
  // may refer back to them without repeating the exact phrase. Only explicit
  // named entities require the strict replacement check below.
  if (!isExplicitNamedSubject(primarySubject)) return [];

  const subjectMentioned = new RegExp(`\\b${escapeRegExp(primarySubject)}\\b`, "i").test(text);
  const cardOnlyReference = /\b(?:the )?(?:man|woman) card\b/i.test(text);
  const issues: SemanticGroundingIssue[] = [];

  if (SUBJECT_REPLACEMENT_PATTERN.test(text) && !subjectMentioned && !cardOnlyReference) {
    issues.push({
      type: "semantic_grounding",
      message: `Question subject "${primarySubject}" must not be replaced by an unbound person/card reference in ${scope}.`,
    });
  }

  return issues;
}

function isExplicitNamedSubject(subject: string): boolean {
  return /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'-]+$/.test(subject);
}

function questionRequiresPolarity(question: string): boolean {
  return /\?|\b(?:will|would|can|could|should|is|are|do|does|did|yes|no|likely|unlikely)\b/i.test(question);
}

function hasRequestedTimingWindow(question: string): boolean {
  return /\b(?:within|in|over the next|during the next|next|binnen)\s+(?:\d+\s*)?(?:days?|dagen?|weeks?|weken?|week|weekend)\b|\bthis week\b|\bdeze week\b/i.test(question);
}

function timingEvidenceExplicitlyExcludesWindow(context: ReadingContext): boolean {
  // Current timing evidence describes a positive range (days, weeks, months, or
  // long-term development); none explicitly says that an earlier requested window
  // is excluded. Keep this conservative until the timing model carries exclusion
  // metadata rather than inferring it from a range label.
  return context.timingEvidence.some((evidence) => /after|later than|not before|beyond|excludes/i.test(evidence.range))
    || context.cards.some((card) => [8, 21, 23, 36].includes(card.id));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
