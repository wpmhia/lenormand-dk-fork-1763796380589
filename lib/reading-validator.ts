import { Card } from "@/lib/types";
import { getCardById } from "@/lib/data";

export const BANNED_TERMS = [
  "energy",
  "vibration",
  "shadow work",
  "higher self",
  "soul lesson",
  "chakra",
  "archetype",
  "the universe",
  "spiritual journey",
  "divine guidance",
  "soul-purpose",
  "soul purpose",
  "everything happens for a reason",
  "trust the process",
];

const TIMING_CARD_IDS = new Set([12, 17, 5, 32]);

export interface ValidationIssue {
  type: "banned_term" | "invented_card" | "unsupported_timing" | "missing_section" | "extra_section";
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const SPREAD_SECTIONS: Record<string, string[]> = {
  "single-card": ["## Reading"],
  "daily-card": [],
  "sentence-3": ["## Reading", "## Key combinations", "## Key action"],
  "sentence-5": ["## Reading", "## Key combinations", "## Key action"],
  "comprehensive": ["## Reading", "## Key combinations", "## Key action", "## Likely timing"],
  "grand-tableau": ["## Grand Tableau overview", "## Around the significator", "## Houses and mirrors", "## Key action", "## Likely timing"],
};

export function validateReadingOutput(
  reading: string,
  drawnCardIds: number[],
  spreadId: string,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const lower = reading.toLowerCase();

  for (const term of BANNED_TERMS) {
    const regex = new RegExp(`\\b${term.replace(/[-]/g, "\\b.*?\\b")}\\b`, "i");
    if (regex.test(lower)) {
      issues.push({ type: "banned_term", message: `Contains banned term: "${term}"` });
    }
  }

  const drawnSet = new Set(drawnCardIds);
  const cardNamePattern = /\b(?:Rider|Clover|Ship|House|Tree|Clouds|Snake|Coffin|Bouquet|Scythe|Whip|Birds|Child|Fox|Bear|Stars|Stork|Dog|Tower|Garden|Mountain|Paths|Crossroads|Mice|Heart|Ring|Book|Letter|Man|Woman|Lily|Sun|Moon|Key|Fish|Anchor|Cross)\b/g;
  const mentionedCards = new Set<string>();
  let match;
  while ((match = cardNamePattern.exec(reading)) !== null) {
    mentionedCards.add(match[0].toLowerCase());
  }

  const nameToId: Record<string, number> = {
    rider: 1, clover: 2, ship: 3, house: 4, tree: 5, clouds: 6, snake: 7,
    coffin: 8, bouquet: 9, scythe: 10, whip: 11, birds: 12, child: 13,
    fox: 14, bear: 15, stars: 16, stork: 17, dog: 18, tower: 19,
    garden: 20, mountain: 21, crossroads: 22, mice: 23, heart: 24,
    ring: 25, book: 26, letter: 27, man: 28, woman: 29, lily: 30,
    sun: 31, moon: 32, key: 33, fish: 34, anchor: 35, cross: 36,
  };

  for (const cardName of mentionedCards) {
    const cardId = nameToId[cardName];
    if (cardId && !drawnSet.has(cardId)) {
      issues.push({ type: "invented_card", message: `Mentions card "${cardName}" that was not drawn` });
    }
  }

  const timingPattern = /\b(\d+)\s*(day|days|week|weeks|month|months|year|years)\b/i;
  const timingMatch = reading.match(timingPattern);
  if (timingMatch) {
    const hasTimingCard = drawnCardIds.some((id) => TIMING_CARD_IDS.has(id));
    if (!hasTimingCard) {
      issues.push({
        type: "unsupported_timing",
        message: `States timing "${timingMatch[0]}" but no timing card (Birds, Stork, Tree, Moon) was drawn`,
      });
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
  }

  return { valid: issues.length === 0, issues };
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

export function repairMarkdownToContract(reading: string, spreadId: string): string {
  const expected = SPREAD_SECTIONS[spreadId];
  if (!expected) return reading;

  const lines = reading.split("\n");
  const cleaned: string[] = [];
  let inBadSection = false;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (level === 2) {
        cleaned.push(line);
        inBadSection = false;
      } else {
        inBadSection = true;
      }
      continue;
    }

    if (inBadSection) continue;

    if (/<[a-z][\s>]/i.test(line)) continue;
    if (/\|.+\|/.test(line)) continue;

    cleaned.push(line);
  }

  return cleaned.join("\n");
}

export function buildDeterministicFallback(
  drawnCards: { id: number; name: string; keywords: string[]; meaning?: { general: string } }[],
  spreadId: string,
  question: string,
): string {
  const count = drawnCards.length;
  const cardLines = drawnCards
    .map((c, i) => {
      const keywords = c.keywords?.slice(0, 3).join(", ") || "";
      const meaning = c.meaning?.general || "";
      return `**${i + 1}. ${c.name}**${keywords ? ` — ${keywords}` : ""}${meaning ? `: ${meaning}` : ""}`;
    })
    .join("\n\n");

  const intro = question
    ? `Your question: "${question}"\n\n`
    : "";

  if (count <= 1) {
    const c = drawnCards[0];
    const kw = c.keywords?.slice(0, 3).join(", ") || "";
    return `${intro}## Reading\n\n${c.name} — ${kw}. ${c.meaning?.general || ""}`;
  }

  const pairs = [];
  for (let i = 0; i < count - 1; i++) {
    pairs.push(`**${drawnCards[i].name} + ${drawnCards[i + 1].name}**`);
  }
  const pairText = pairs.join("\n");

  return `${intro}## Reading\n\nThese cards together tell a story. ${drawnCards.map((c) => c.name).join(" followed by ")}.\n\n## Key combinations\n\n${pairText}\n\n## Key action\n\nLook at the last card (${drawnCards[count - 1].name}) for practical guidance.`;
}
