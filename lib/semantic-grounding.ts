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
export interface SemanticGroundingIssue {
  type: "semantic_grounding";
  message: string;
  code?: string;
}

export type SubjectValidationScope = "interpretation" | "card-commentary" | "prediction";

const INTERACTION_PATTERN = /\b(?:dimmed|diminished|weakened|strengthened|blocked|clarified|obscured|surrounded|modifies|influences|acts upon)\b/i;
const NEGATIVE_POLARITY_PATTERN = /\b(?:unlikely|not imminent|will not|won't|will end|definitive ending|must separate|no (?:sex|intimacy|commitment|contact))\b/i;
const REQUIRED_SEPARATION_PATTERN = /\b(?:separation|cut|ending) (?:is|required|must be) required\b|\brequires? (?:a )?(?:separation|ending|break)\b/i;
// "Can happen" expresses possibility, not a positive answer. Treating it as
// polarity caused valid qualified forecasts to fail when ambiguous cards were drawn.
const POSITIVE_POLARITY_PATTERN = /\b(?:will|does)\b.{0,25}\b(?:happen|succeed|commit|occur|work out)\b|\b(?:yes|successful|certainly)\b/i;
const NEGATIVE_TIMING_PATTERN = /\b(?:unlikely|not likely|probably not|not expected|will not|won't)\b.{0,45}\b(?:within|in|this|the next|binnen)\b.{0,25}\b(?:\d+\s*(?:days?|dagen?)|week(?:s)?|weekend)\b|\b(?:not this week|not within \d+\s*(?:days?|dagen?))\b|\b(?:only|just)\s+(?:in|over)\s+(?:the )?coming weeks\b/i;
const SEXUAL_QUESTION_PATTERN = /\b(?:sex|seks|sexual|seksuele|intimacy|intimate|intercourse|intiem|intimiteit|toenadering)\b/i;
const SEXUAL_ANSWER_PATTERN = /\b(?:sex|seks|sexual intimacy|seksuele intimiteit|intimacy|intimate|intercourse|intiem|intimiteit|toenadering)\b/i;
const EXACT_SEX_QUESTION_PATTERN = /\b(?:sex|seks|intercourse)\b/i;
const EXACT_SEX_ANSWER_PATTERN = /\b(?:sex|seks|intercourse)\b/i;
// Bare "Man"/"Woman" is a card label and must remain legal, especially in
// Grand Tableau commentary. Only a grammatical person reference is binding.
const MALE_ENTITY_PATTERN = /\b(?:the|a|another)\s+man\b|\bman\s+in\b|\bman\s+(?=and|is|are|will|has|does)\b|\b(?:he|him|his|husband|boyfriend|lover)\b|\b(?:represented by|becomes|is)\s+(?:the )?man\b/i;
const FEMALE_ENTITY_PATTERN = /\b(?:the|a|another)\s+woman\b|\bwoman\s+in\b|\bwoman\s+(?=and|is|are|will|has|does)\b|\b(?:she|her|hers|wife|girlfriend|lover)\b|\b(?:represented by|becomes|is)\s+(?:the )?woman\b/i;
const EPISTEMIC_HEDGE_PATTERN = /\b(?:suggest(?:s|ed)?|point(?:s|ed)? to|appear(?:s)?|seem(?:s)?|may|might|could|likely|possibly|probably|wijst|wijzen|lijkt|lijken|kan|mogelijk|waarschijnlijk)\b/i;
const EXTERNAL_FACT_QUESTION_PATTERN = /\b(?:has|have|is|are|does|do|did|will|would|comes?|return|contact|honest|heeft|hebben|is|zijn|gaat|komt|terug|contact|eerlijk|krijg|krijgen|blijft|blijven)\b/i;
const EXTERNAL_SUBJECT_PATTERN = /\b(?:he|she|they|him|her|them|hij|zij|hem|haar|hen|we|you|i|wij|jij|ik|my partner|mijn partner)\b/i;
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
  options: { validatePolarity?: boolean; validateQuestionSpecificity?: boolean; validateEpistemicCertainty?: boolean } = {},
): SemanticGroundingIssue[] {
  const cardIds = new Set(context.cards.map((card) => card.id));
  const issues: SemanticGroundingIssue[] = [];

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

  if (hasRequestedTimingWindow(context.question)
    && NEGATIVE_TIMING_PATTERN.test(development)
    && !timingEvidenceExplicitlyExcludesWindow(context)) {
    issues.push({
      type: "semantic_grounding",
      message: "Absence of timing confirmation is not evidence that the requested time window is unlikely; preserve timing uncertainty instead.",
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

  if (options.validateEpistemicCertainty !== false && requiresExternalFactFraming(context.question)) {
    const subjectPattern = context.questionSubjects.length > 0
      ? new RegExp(`(?:${context.questionSubjects.map(escapeRegExp).join("|")}|he|she|they|hij|zij|him|her|hem|haar|we|you|i|wij|jij|ik)`, "i")
      : EXTERNAL_SUBJECT_PATTERN;
    const claimSentence = development.split(/[.!?]+/).find((sentence) =>
      subjectPattern.test(sentence) && EXTERNAL_FACT_CLAIM_PATTERN.test(sentence),
    );
    if (claimSentence && !EPISTEMIC_HEDGE_PATTERN.test(claimSentence) && !/\b(?:cards?|spread|evidence|kaarten|legging)\b/i.test(claimSentence)) {
      issues.push({
        type: "semantic_grounding",
        code: "unsupported_certainty",
        message: "Card evidence supports a forecast or inference, not independent verification of an external fact; frame this claim as what the cards indicate or suggest.",
      });
    }
  }

  const personText = development.replace(/\b(?:the )?(?:man|woman)(?:\s+and\s+(?:man|woman))?\s+cards?\b/gi, "");
  for (const [cardId, pattern, label] of [[28, MALE_ENTITY_PATTERN, "Man"], [29, FEMALE_ENTITY_PATTERN, "Woman"]] as const) {
    if (!cardIds.has(cardId) || !pattern.test(personText)) continue;
    const binding = context.personBindings.find((candidate) => candidate.cardId === cardId);
    if (!binding) {
      issues.push({
        type: "semantic_grounding",
        code: "unsupported_entity_binding",
        message: `${label} is unbound in this question; a concrete person, partner, or gendered pronoun cannot be assigned to it without entity-binding evidence.`,
      });
    }
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
        if (earlierAmbiguous && !closingSupportsClaim) {
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
      code: "subject_substitution",
      message: `Question subject "${primarySubject}" must not be replaced by an unbound person/card reference in ${scope}.`,
    });
  }

  return issues;
}

export function validateEntityEvidenceBinding(
  text: string,
  evidenceIds: ReadonlySet<string> | undefined,
  context: ReadingContext,
): SemanticGroundingIssue[] {
  if (!evidenceIds || evidenceIds.size === 0) return [];
  const citedCardIds = new Set<number>();
  for (const id of evidenceIds) {
    const cardMatch = id.match(/^card-(\d+)$/);
    if (cardMatch) {
      const card = context.cards[Number(cardMatch[1]) - 1];
      if (card) citedCardIds.add(card.id);
    }
    const pairMatch = id.match(/^pair-(\d+)-(\d+)$/);
    if (pairMatch) {
      for (const position of [Number(pairMatch[1]), Number(pairMatch[2])]) {
        const card = context.cards[position - 1];
        if (card) citedCardIds.add(card.id);
      }
    }
  }

  const subject = context.questionSubjects[0];
  if (/\b(?:man|woman) card\b/i.test(text) && /\b(?:not identified|unbound|unknown|not established)\b/i.test(text)) return [];
  const unboundPersonCard = [28, 29].find((id) => citedCardIds.has(id) && !context.personBindings.some((binding) => binding.cardId === id));
  if (subject && unboundPersonCard && new RegExp(`\\b${escapeRegExp(subject)}\\b`, "i").test(text)
    && /\b(?:with|for|to|represents?|means?|shows?|is|becomes?|van|met|voor|aan|als)\b/i.test(text)) {
    return [{
      type: "semantic_grounding",
      code: "unsupported_entity_binding",
      message: `The claim associates question subject "${subject}" with an unbound ${unboundPersonCard === 28 ? "Man" : "Woman"} card in its cited evidence path.`,
    }];
  }
  return [];
}

function isExplicitNamedSubject(subject: string): boolean {
  return /^[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'-]+$/.test(subject);
}

function questionRequiresPolarity(question: string): boolean {
  return /\?|\b(?:will|would|can|could|should|is|are|do|does|did|yes|no|likely|unlikely)\b/i.test(question);
}

const EXTERNAL_FACT_CLAIM_PATTERN = /\b(?:is|are|was|were|has|have|does|do|did|will|won't|will not|no longer|niet langer|gaat|blijft|komt|krijgt|heeft|is|zijn)\b/i;

function requiresExternalFactFraming(question: string): boolean {
  return EXTERNAL_FACT_QUESTION_PATTERN.test(question)
    && (EXTERNAL_SUBJECT_PATTERN.test(question) || /\b[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'-]+\b/.test(question));
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
