import { Card } from "@/lib/types";
import { buildPredictionTimingLine, getTimingCard, NO_TIMING_OUTPUT, REQUIRED_PREDICTION_FIELDS, OPTIONAL_PREDICTION_FIELDS, TimingCardDefinition } from "@/lib/timing";

export const BANNED_PHRASES = [
  "spiritual journey",
  "healing journey",
  "soul journey",
  "personal transformation",
  "shadow work",
  "shadow self",
  "higher self",
  "soul lesson",
  "soul-purpose",
  "soul purpose",
  "chakra",
  "the universe",
  "divine guidance",
  "vibration",
  "everything happens for a reason",
  "trust the process",
  "these cards together tell a story",
  "positive energy",
];

export const BANNED_BARE_TERMS = [
  "archetype",
];

export const BANNED_QUESTION_PREFIX = /^Your question:.*\n\n/s;

export interface ValidationIssue {
  type: "banned_term" | "invented_card" | "unsupported_timing" | "missing_section" | "extra_section" | "empty_section";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const SPREAD_SECTIONS: Record<string, string[]> = {
  "single-card": ["## Interpretation"],
  "daily-card": [],
  "sentence-3": ["## Interpretation", "## Cards", "## Prediction"],
  "sentence-5": ["## Interpretation", "## Cards", "## Prediction"],
  "comprehensive": ["## Interpretation", "## Cards", "## Prediction"],
  "grand-tableau": ["## Interpretation", "## Houses and mirrors", "## Cards", "## Prediction"],
};

const MIN_WORDS_PER_SECTION: Record<string, number> = {
  interpretation: 12,
  prediction: 6,
  "houses and mirrors": 4,
  cards: 0,
};

function getSectionBody(reading: string, heading: string): string {
  const headingLower = heading.replace(/^#+\s*/, "").trim().toLowerCase();
  const lines = reading.split("\n");
  const startIdx = lines.findIndex((l) => {
    const m = l.match(/^#{1,6}\s+(.+)/);
    return m ? m[1].trim().toLowerCase() === headingLower : false;
  });
  if (startIdx === -1) return "";
  const bodyLines: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#{1,6}\s+/.test(lines[i])) break;
    bodyLines.push(lines[i]);
  }
  return bodyLines.join("\n").trim();
}

export function validateReadingOutput(
  reading: string,
  drawnCardIds: number[],
  spreadId: string,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lower = reading.toLowerCase();

  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      issues.push({ type: "banned_term", message: `Contains banned phrase: "${phrase}"` });
    }
  }

  for (const term of BANNED_BARE_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, "i");
    if (regex.test(lower)) {
      issues.push({ type: "banned_term", message: `Contains banned term: "${term}"` });
    }
  }

  const drawnSet = new Set(drawnCardIds);
  const bodyWithoutHeadings = reading
    .split("\n")
    .filter((line) => !/^#{1,6}\s/.test(line))
    .join("\n");
  const cardNamePattern = /\b([A-Za-z][a-z]+)\b/g;
  const knownCardNames = new Set([
    "rider", "clover", "ship", "house", "tree", "clouds", "snake", "coffin", "bouquet", "scythe",
    "whip", "birds", "child", "fox", "bear", "stars", "stork", "dog", "tower", "garden",
    "mountain", "paths", "crossroads", "mice", "heart", "ring", "book", "letter", "man",
    "woman", "lily", "sun", "moon", "key", "fish", "anchor", "cross",
  ]);
  const mentionedCards = new Set<string>();
  let match;
  while ((match = cardNamePattern.exec(bodyWithoutHeadings)) !== null) {
    const lower = match[1].toLowerCase();
    if (knownCardNames.has(lower)) {
      mentionedCards.add(lower);
    }
  }

  const nameToId: Record<string, number> = {
    rider: 1, clover: 2, ship: 3, house: 4, tree: 5, clouds: 6, snake: 7,
    coffin: 8, bouquet: 9, scythe: 10, whip: 11, birds: 12, child: 13,
    fox: 14, bear: 15, stars: 16, stork: 17, dog: 18, tower: 19,
    garden: 20, mountain: 21, crossroads: 22, paths: 22, mice: 23, heart: 24,
    ring: 25, book: 26, letter: 27, man: 28, woman: 29, lily: 30,
    sun: 31, moon: 32, key: 33, fish: 34, anchor: 35, cross: 36,
  };

  for (const cardName of mentionedCards) {
    const cardId = nameToId[cardName];
    if (cardId && !drawnSet.has(cardId)) {
      issues.push({ type: "invented_card", message: `Mentions card "${cardName}" that was not drawn` });
    }
  }

  // Timing validation only applies inside the Prediction section.
  // The Interpretation and Cards sections can freely describe stability, change, etc.
  // ("long-term stability" is descriptive, not a timing claim).
  // The dedicated "Likely timing:" label inside Prediction is where timing is asserted.
  const predictionSection = getSectionBody(reading, "## Prediction");
  const numericTimingPattern = /\b\d+\s*(?:-|–|—|\s+to\s+)\s*\d+\s*(day|days|week|weeks|month|months|year|years)\b|\b\d+\s+(day|days|week|weeks|month|months|year|years)\b/i;
  const numericTimingMatch = predictionSection.match(numericTimingPattern);

  const nonnumericTimingPattern = /\b(?:within|in|over|coming|next|next few|last|past|the coming|the next)\s+(?:days?|weeks?|months?|years?|fortnight)\b|\bin\s+the\s+(?:short|long)\s+term\b|\bshort[\s-]?term\b|\blong[\s-]?term\b|\bsoon\b|\bvery soon\b/i;
  const nonnumericTimingMatch = predictionSection.match(nonnumericTimingPattern);

  const drawnTimingCards = drawnCardIds
    .map((id) => getTimingCard(id))
    .filter((def): def is NonNullable<typeof def> => def !== undefined);

  const rangeFromUnit = (unit: string): "days" | "weeks" | "months" | "years" =>
    unit.startsWith("day") ? "days"
    : unit.startsWith("week") ? "weeks"
    : unit.startsWith("month") ? "months"
    : "years";

  if (numericTimingMatch) {
    const phrase = numericTimingMatch[0].toLowerCase();
    const range = phrase.includes("year") ? "years"
      : phrase.includes("month") ? "months"
      : phrase.includes("week") ? "weeks"
      : "days";

    if (drawnTimingCards.length === 0) {
      issues.push({
        type: "unsupported_timing",
        message: `States timing "${numericTimingMatch[0]}" in Prediction but no timing card (Birds, Stork, Tree, Moon) was drawn`,
      });
    } else {
      const allowedRanges = new Set(drawnTimingCards.map((tc) => tc.validatorRange));
      if (!allowedRanges.has(range)) {
        issues.push({
          type: "unsupported_timing",
          message: `States timing "${numericTimingMatch[0]}" in Prediction which is outside the range indicated by drawn timing card(s) (${drawnTimingCards.map((tc) => tc.name).join(", ")} → ${[...allowedRanges].join("/")})`,
        });
      }
    }
  }

  if (nonnumericTimingMatch) {
    const unitMatch = nonnumericTimingMatch[0].match(/(days?|weeks?|months?|years?|fortnight)/i);
    const termMatch = nonnumericTimingMatch[0].match(/\b(short|long)[\s-]?term\b/i);
    const range = termMatch ? (termMatch[1].toLowerCase() === "short" ? "days" : "years")
      : unitMatch ? rangeFromUnit(unitMatch[1].toLowerCase())
      : "days";

    if (drawnTimingCards.length === 0) {
      issues.push({
        type: "unsupported_timing",
        message: `States timing "${nonnumericTimingMatch[0]}" in Prediction but no timing card (Birds, Stork, Tree, Moon) was drawn`,
      });
    } else {
      const allowedRanges = new Set(drawnTimingCards.map((tc) => tc.validatorRange));
      if (!allowedRanges.has(range)) {
        issues.push({
          type: "unsupported_timing",
          message: `States timing "${nonnumericTimingMatch[0]}" in Prediction which is outside the range indicated by drawn timing card(s) (${drawnTimingCards.map((tc) => tc.name).join(", ")} → ${[...allowedRanges].join("/")})`,
        });
      }
    }
  }

  const allowed = SPREAD_SECTIONS[spreadId];
  if (allowed) {
    const actualSections = reading.match(/^#{1,3}\s+.+$/gm) || [];
    const actualHeadings = actualSections.map((s) => s.replace(/^#+\s*/, "").trim().toLowerCase());
    for (const expected of allowed) {
      const expectedLower = expected.replace(/^#+\s*/, "").trim().toLowerCase();
      if (!actualHeadings.some((h) => h === expectedLower)) {
        issues.push({ type: "missing_section", message: `Missing required section: "${expected}"` });
      }
    }
    for (const actual of actualHeadings) {
      const isAllowed = allowed.some((a) => a.replace(/^#+\s*/, "").trim().toLowerCase() === actual);
      if (!isAllowed) {
        issues.push({ type: "extra_section", message: `Unexpected section: "${actual}"` });
      }
    }

    for (const expected of allowed) {
      const body = getSectionBody(reading, expected);
      const expectedLower = expected.replace(/^#+\s*/, "").trim().toLowerCase();

      if (expectedLower === "cards") {
        const bulletCount = (body.match(/^\s*[-*]\s/gm) || []).length;
        if (bulletCount < 1) {
          issues.push({
            type: "empty_section",
            message: `Section "${expected}" contains no bullet points`,
          });
        }
      } else {
        const wordCount = body.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w)).length;
        const minWords = MIN_WORDS_PER_SECTION[expectedLower] ?? 8;
        if (wordCount < minWords) {
          issues.push({
            type: "empty_section",
            message: `Section "${expected}" is empty or too short (${wordCount} words)`,
          });
        }
      }
    }

    const predictionAllowed = allowed.some((a) => a.replace(/^#+\s*/, "").trim().toLowerCase() === "prediction");
    if (predictionAllowed) {
      const predictionBody = getSectionBody(reading, "## Prediction");
      for (const field of REQUIRED_PREDICTION_FIELDS) {
        const re = new RegExp(`\\*\\*${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`, "i");
        if (!re.test(predictionBody)) {
          issues.push({
            type: "empty_section",
            message: `## Prediction is missing required label "**${field}:**"`,
          });
        } else {
          const after = predictionBody.split(re)[1] || "";
          const untilNextLabel = after.split(/\n\s*\*\*(?:Most likely development|Likely timing|Watch for|Practical action):/i)[0] || "";
          const words = untilNextLabel.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
          if (words.length < 2) {
            issues.push({
              type: "empty_section",
              message: `**${field}:** in ## Prediction has too little content (${words.length} words)`,
            });
          }
        }
      }
      // OPTIONAL_PREDICTION_FIELDS ("Watch for", "Practical action") are NOT required.
      // If the model includes them, the validator only checks that they are not empty;
      // missing them entirely is acceptable when the cards do not establish a concrete
      // external sign or specific action.
      for (const field of OPTIONAL_PREDICTION_FIELDS) {
        const re = new RegExp(`\\*\\*${field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`, "i");
        if (!re.test(predictionBody)) continue;
        const after = predictionBody.split(re)[1] || "";
        const untilNextLabel = after.split(/\n\s*\*\*(?:Most likely development|Likely timing|Watch for|Practical action):/i)[0] || "";
        const words = untilNextLabel.split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
        if (words.length < 2) {
          issues.push({
            type: "empty_section",
            message: `**${field}:** in ## Prediction has too little content (${words.length} words)`,
          });
        }
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Severity tiers:
 *
 * - `fatal`: cannot be safely auto-repaired. Reading must be rejected.
 *   - `banned_term`: the model used Tarot/New Age vocabulary we cannot rewrite.
 *   - `invented_card`: the model hallucinated a card name; we cannot fabricate.
 *   - `unsupported_timing`: the model asserted a time range the cards don't allow.
 *   - `missing_section`: the model omitted a required section.
 *   - `empty_section`: the model wrote an empty required section.
 *
 * - `repairable`: harmless Markdown/structural formatting; the validator already
 *   auto-repairs most of these via `normalizeMarkdown`, but if some slipped through,
 *   the reading should still surface.
 *   - `extra_section`: extra headings, wrong heading level, or unexpected prose
 *     before the first heading. These are formatting quirks, not synthesis errors.
 */
export const ISSUE_SEVERITY: Record<ValidationIssue["type"], "fatal" | "repairable"> = {
  banned_term: "fatal",
  invented_card: "fatal",
  unsupported_timing: "fatal",
  missing_section: "fatal",
  empty_section: "fatal",
  extra_section: "repairable",
};

export function isCriticalIssue(issue: ValidationIssue): boolean {
  return ISSUE_SEVERITY[issue.type] === "fatal";
}

export const ALLOWED_MARKDOWN_PATTERN = /^(#{1,3}\s|[-*]\s|\d+\.\s|\S)/m;

export function validateReadingMarkdown(
  reading: string,
  spreadId: string,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lines = reading.split("\n");

  const firstContentLine = lines.find((l) => l.trim().length > 0);
  if (firstContentLine && !/^##\s/.test(firstContentLine)) {
    issues.push({ type: "extra_section", message: "First non-empty line must be a ## heading" });
  }

  const headingPattern = /^(#{1,6})\s/;
  for (const line of lines) {
    const match = line.match(headingPattern);
    if (match) {
      const level = match[1].length;
      if (level !== 2) {
        issues.push({ type: "extra_section", message: `Only ## headings allowed, got ${"#".repeat(level)}` });
      }
    }
    if (/<[a-z][\s>]/i.test(line)) {
      issues.push({ type: "extra_section", message: "Raw HTML is not allowed" });
    }
    if (/\|.+\|/.test(line)) {
      issues.push({ type: "extra_section", message: "Tables are not allowed" });
    }
  }

  const expected = SPREAD_SECTIONS[spreadId];
  if (expected) {
    const actualHeadings = reading.match(/^#{1,3}\s+.+$/gm) || [];
    const actualClean = actualHeadings.map((s) => s.replace(/^#+\s*/, "").trim().toLowerCase());
    for (const exp of expected) {
      const expClean = exp.replace(/^#+\s*/, "").trim().toLowerCase();
      if (!actualClean.some((a) => a === expClean)) {
        issues.push({ type: "missing_section", message: `Missing required section: "${exp}"` });
      }
    }
    for (const actual of actualClean) {
      const isAllowed = expected.some((a) => a.replace(/^#+\s*/, "").trim().toLowerCase() === actual);
      if (!isAllowed) {
        issues.push({ type: "extra_section", message: `Unexpected section: "${actual}"` });
      }
    }
  }

  const listCount = (reading.match(/^\s*[-*]\s/gm) || []).length;

  return { valid: issues.length === 0, issues };
}

export function normalizeMarkdown(reading: string): string {
  const lines = reading.split("\n");
  const out: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/[ \t]+$/g, "");
    const headingMatch = line.match(/^(#{1,6})(\s+(.+))?$/);

    if (headingMatch && headingMatch[3]) {
      while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();
      const headingText = headingMatch[3].trim();
      out.push(`## ${headingText}`);
      continue;
    }

    if (/\|.+\|/.test(line)) {
      continue;
    }

    if (/<[a-z][\s>]/i.test(line)) {
      continue;
    }

    if (line.trim() === "") {
      if (out.length > 0 && out[out.length - 1].trim() !== "") {
        out.push("");
      }
      continue;
    }

    out.push(line);
  }

  while (out.length > 0 && out[out.length - 1].trim() === "") out.pop();

  return out.join("\n");
}

export function repairMarkdownToContract(reading: string, _spreadId: string): string {
  return normalizeMarkdown(reading);
}

interface NormalizedFallbackCard {
  id: number;
  name: string;
  keywords: string[];
  meaning?: { general: string };
}

export interface FallbackPair {
  indexA: number;
  indexB: number;
  cardAName: string;
  cardBName: string;
  meaning: string;
}

export function buildDeterministicFallback(
  drawnCards: NormalizedFallbackCard[],
  spreadId: string,
  question: string,
  pairs?: FallbackPair[],
): string {
  const q = question ? `Question: "${question}"` : "";
  const qLine = q ? `\n_${q}_\n\n` : "\n\n";

  if (drawnCards.length === 0) return `## Interpretation\n\nNo cards were drawn.`;

  if (drawnCards.length === 1) {
    const c = drawnCards[0];
    const kw = c.keywords?.slice(0, 3).join(", ") || "";
    const note = c.meaning?.general || "";
    const opener = question
      ? `This is the situation you are sitting with regarding "${question}".`
      : `This is what the drawn card says about the situation.`;
    return `## Interpretation${qLine}${opener} **${c.name}** is the focus${kw ? ` — ${kw}` : ""}${note ? `. ${note}` : ""}.`;
  }

  if (spreadId === "grand-tableau" && drawnCards.length === 36) {
    return buildGrandTableauFallback(drawnCards, question, qLine, pairs);
  }

  return buildLinearFallback(drawnCards, question, qLine, pairs);
}

function buildPredictionBlock(
  drawnCards: NormalizedFallbackCard[],
  primaryCardName: string,
  primaryKw: string,
  primaryMeaning: string,
  closingPairNames: string,
  hasClosingPairMeaning: boolean,
): string {
  const primaryTimingCards: TimingCardDefinition[] = [];
  for (const c of drawnCards) {
    const def = getTimingCard(c.id);
    if (def) primaryTimingCards.push(def);
  }
  const timingEvidence = primaryTimingCards.map((def) => ({
    cardId: def.id,
    cardName: def.name,
    range: def.validatorRange,
  }));
  const timingLine = `**Likely timing:** ${buildPredictionTimingLine(timingEvidence)}`;

  const developmentLine = primaryMeaning
    ? `**Most likely development:** The closing card **${primaryCardName}** (${primaryKw}) is the primary tendency of this situation — ${primaryMeaning}.`
    : `**Most likely development:** The closing card **${primaryCardName}** (${primaryKw}) is the primary tendency of this situation.`;
  const watchForLine = hasClosingPairMeaning
    ? `**Watch for:** The development described by the closing pair (**${closingPairNames}**) begins to appear in practical form.`
    : `**Watch for:** The development begins to appear in practical form.`;
  const actionLine = `**Practical action:** This is a deterministic fallback, not an AI reading. Draw again or ask a follow-up question for a fuller interpretation.`;

  return [
    developmentLine,
    timingLine,
    watchForLine,
    actionLine,
  ].join("\n");
}

function buildLinearFallback(
  drawnCards: NormalizedFallbackCard[],
  question: string,
  qLine: string,
  pairs?: FallbackPair[],
): string {
  const pairBullets: string[] = [];
  for (let i = 0; i < drawnCards.length - 1; i++) {
    const a = drawnCards[i];
    const b = drawnCards[i + 1];
    const pairMeaning = pairs?.find(
      (p) => p.indexA === i && p.indexB === i + 1,
    )?.meaning;
    if (pairMeaning) {
      pairBullets.push(`- **${a.name} + ${b.name}**: ${pairMeaning}`);
    } else {
      // Don't invent filler. State plainly that no canonical combination meaning exists for this pair.
      pairBullets.push(`- **${a.name} + ${b.name}**: (no specific combination meaning available)`);
    }
  }

  const last = drawnCards[drawnCards.length - 1];
  const lastKw = last.keywords?.slice(0, 2).join(", ") || last.name;
  const lastMeaning = last.meaning?.general || "";

  const chainNames = drawnCards.map((c) => c.name).join(", ");
  const opener = question
    ? `This fallback addresses "${question}".`
    : `This fallback addresses the situation at hand.`;
  const interpretation = `${opener} The spread **${chainNames}** reads as one Lenormand chain: what begins with **${drawnCards[0].name}** develops through **${drawnCards[1].name}**, and the closing card **${last.name}** (${lastKw}${lastMeaning ? ` — ${lastMeaning}` : ""}) is where the line is heading. The combinations below are evidence; the forecast is in the final section. This is a deterministic fallback reading, not an AI-generated interpretation.`;

  const closingPairIndex = drawnCards.length - 2;
  const closingPair = pairs?.find(
    (p) => p.indexA === closingPairIndex && p.indexB === closingPairIndex + 1,
  );
  const closingPairNames = drawnCards.length >= 2
    ? `${drawnCards[drawnCards.length - 2].name} + ${last.name}`
    : last.name;
  const predictionBlock = buildPredictionBlock(
    drawnCards,
    last.name,
    lastKw,
    lastMeaning,
    closingPairNames,
    Boolean(closingPair?.meaning),
  );

  return [
    `## Interpretation${qLine}${interpretation}`,
    "",
    "## Cards",
    "",
    pairBullets.join("\n"),
    "",
    "## Prediction",
    "",
    predictionBlock,
  ].join("\n");
}

function buildGrandTableauFallback(
  drawnCards: NormalizedFallbackCard[],
  question: string,
  qLine: string,
  pairs?: FallbackPair[],
): string {
  const findPair = (a: number, b: number): string | undefined =>
    pairs?.find((p) => p.indexA === a && p.indexB === b)?.meaning;

  const womanIdx = drawnCards.findIndex((c) => c.id === 29);
  const manIdx = drawnCards.findIndex((c) => c.id === 28);
  const sigIdx = womanIdx >= 0 ? womanIdx : manIdx;
  const sig = sigIdx >= 0 ? drawnCards[sigIdx] : null;
  const sigName = sig?.name || "Significator";
  const sigRow = sigIdx >= 0 ? Math.floor(sigIdx / 9) + 1 : 0;
  const sigCol = sigIdx >= 0 ? (sigIdx % 9) + 1 : 0;

  const aroundBullets: string[] = [];
  if (sigIdx >= 0 && sig) {
    const sigNameLocal = sig.name;
    const row = Math.floor(sigIdx / 9);
    const col = sigIdx % 9;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const ni = (row + dr) * 9 + (col + dc);
        if (ni < 0 || ni >= 36) continue;
        const nb = drawnCards[ni];
        if (!nb) continue;
        const a = Math.min(sigIdx, ni);
        const b = Math.max(sigIdx, ni);
        const meaning = findPair(a, b);
        if (meaning) {
          aroundBullets.push(`- **${sigNameLocal} + ${nb.name}**: ${meaning}`);
        } else {
          aroundBullets.push(`- **${sigNameLocal} + ${nb.name}**: (no specific combination meaning available)`);
        }
      }
    }
  }

  const houseBullets: string[] = [];
  const houseTopicIds = new Set([5, 4, 24, 14, 15, 35, 34, 3]);
  for (let i = 0; i < drawnCards.length; i++) {
    const c = drawnCards[i];
    if (!houseTopicIds.has(c.id)) continue;
    const houseCardName = c.name;
    const sigPair = sigIdx >= 0 ? findPair(Math.min(sigIdx, i), Math.max(sigIdx, i)) : undefined;
    houseBullets.push(
      sigPair
        ? `- **House of ${houseCardName}** (position ${i + 1}): ${sigPair}`
        : `- **House of ${houseCardName}** (position ${i + 1}): (no specific combination meaning available)`,
    );
  }

  const corners = [drawnCards[0], drawnCards[8], drawnCards[27], drawnCards[35]];
  const cornersLine = `Corners: ${corners.map((c) => c.name).join(", ")}.`;
  const centerFour = [drawnCards[13], drawnCards[14], drawnCards[22], drawnCards[23]];
  const centerLine = `Center four: ${centerFour.map((c) => c.name).join(", ")}.`;
  const cardsOfFate = [drawnCards[32], drawnCards[33], drawnCards[34], drawnCards[35]];
  const fateLine = `Cards of Fate (bottom row): ${cardsOfFate.map((c) => c.name).join(", ")}.`;

  const opener = question
    ? `This Grand Tableau fallback addresses "${question}".`
    : `This Grand Tableau fallback addresses the full life situation.`;

  const overview = `${opener} Reading all **${drawnCards.length}** drawn cards in the 4×9 grid${sigIdx >= 0 ? `, with the significator at **${sigName}** (Row ${sigRow}, Column ${sigCol})` : ""}. The corners, center four, and Cards of Fate anchor the tableau; the pairs around the significator carry the most immediate information, and topic houses (Heart, House, Fish, Tree, Ship, Fox, Bear, Anchor) show where the main life themes sit. The forecast is in the final section. This is a deterministic fallback reading, not an AI-generated interpretation.`;

  const primaryTimingCards: TimingCardDefinition[] = [];
  for (const c of drawnCards) {
    const def = getTimingCard(c.id);
    if (def) primaryTimingCards.push(def);
  }

  const timingEvidence = primaryTimingCards.map((def) => ({
    cardId: def.id,
    cardName: def.name,
    range: def.validatorRange,
  }));

  const primaryName = sig?.name || (drawnCards[drawnCards.length - 1]?.name ?? "the closing card");
  const primaryKw = sig?.keywords?.slice(0, 2).join(", ") || primaryName;
  const cardsOfFateNames = drawnCards.slice(32, 36).map((c) => c.name).join(", ");

  const predictionBlock = [
    `**Most likely development:** The closing tendency of this tableau points toward **${primaryName}** (${primaryKw}). ${sigIdx >= 0 ? `The immediate neighbours of ${sigName} are the most actionable signals.` : "No significator card was drawn; the bottom-row Cards of Fate carry the long-term signal."}`,
    `**Likely timing:** ${buildPredictionTimingLine(timingEvidence)}`,
    `**Watch for:** The development described by the cards of fate (${cardsOfFateNames || "the bottom row"}) begins to appear in practical form.`,
    `**Practical action:** This is a deterministic fallback, not an AI reading. Draw again or ask a follow-up question for a fuller interpretation.`,
  ].join("\n");

  return [
    `## Interpretation${qLine}${overview}`,
    "",
    cornersLine,
    centerLine,
    fateLine,
    "",
    "## Houses and mirrors",
    "",
    houseBullets.length > 0 ? houseBullets.join("\n") : "- No topic houses (Heart, House, Fish, Tree, Ship, Fox, Bear, Anchor) appeared in the spread.",
    "",
    "## Cards",
    "",
    aroundBullets.length > 0 ? aroundBullets.join("\n") : `- No significator found in this spread; read the tableau as a whole.`,
    "",
    "## Prediction",
    "",
    predictionBlock,
  ].join("\n");
}
