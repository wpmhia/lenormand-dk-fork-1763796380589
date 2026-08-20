import { Card } from "@/lib/types";
import { getTimingCard, REQUIRED_PREDICTION_FIELDS, OPTIONAL_PREDICTION_FIELDS } from "@/lib/timing";

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
  const knownCardNames = new Set([
    "rider", "clover", "ship", "house", "tree", "clouds", "snake", "coffin", "bouquet", "scythe",
    "whip", "birds", "child", "fox", "bear", "stars", "stork", "dog", "tower", "garden",
    "mountain", "paths", "crossroads", "mice", "heart", "ring", "book", "letter", "man",
    "woman", "lily", "sun", "moon", "key", "fish", "anchor", "cross",
  ]);
  const mentionedCards = new Set<string>();
  const cardAlternation = [...knownCardNames].join("|");
  const explicitCardPattern = new RegExp(`\\b(${cardAlternation})\\s*\\+\\s*(${cardAlternation})\\b|\\b(${cardAlternation})\\s+card\\b`, "gi");
  let match;
  while ((match = explicitCardPattern.exec(bodyWithoutHeadings)) !== null) {
    if (match[1]) mentionedCards.add(match[1].toLowerCase());
    if (match[2]) mentionedCards.add(match[2].toLowerCase());
    if (match[3]) mentionedCards.add(match[3].toLowerCase());
  }
  const cardAlternationCapitalized = [...knownCardNames]
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
    .join("|");
  const namedCardPattern = new RegExp(`\\b(?:[Tt]he|[Cc]ard)\\s+(${cardAlternationCapitalized})\\b`, "g");
  while ((match = namedCardPattern.exec(bodyWithoutHeadings)) !== null) {
    mentionedCards.add(match[1].toLowerCase());
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

  // Timing claims are unsupported wherever they appear, not just in Prediction.
  // A timing card must support any explicit time range in the complete reading.
  const timingText = reading;
  const numericTimingPattern = /\b\d+\s*(?:-|–|—|\s+to\s+)\s*\d+\s*(day|days|week|weeks|month|months|year|years)\b|\b\d+\s+(day|days|week|weeks|month|months|year|years)\b/i;
  const numericTimingMatch = timingText.match(numericTimingPattern);

  const nonnumericTimingPattern = /\b(?:within|in|over|coming|next|next few|last|past|the coming|the next)\s+(?:days?|weeks?|months?|years?|fortnight)\b|\bin\s+the\s+(?:short|long|near)\s+term\b|\bnear term\b|\bsoon\b|\bvery soon\b|\bshortly\b/i;
  const nonnumericTimingMatch = timingText.match(nonnumericTimingPattern);

  const drawnTimingCards = spreadId === "grand-tableau"
    ? []
    : drawnCardIds.map((id) => getTimingCard(id))
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
