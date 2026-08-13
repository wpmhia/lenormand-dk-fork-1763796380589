import { Card } from "@/lib/types";
import { PRIMARY_TIMING_CARD_IDS, getTimingCard, TimingCardDefinition } from "@/lib/timing";

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
  "these cards together tell a story",
];

export const BANNED_QUESTION_PREFIX = /^Your question:.*\n\n/s;

const TIMING_CARD_IDS = PRIMARY_TIMING_CARD_IDS;

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
  "sentence-3": ["## Reading", "## Key combinations", "## Prediction"],
  "sentence-5": ["## Reading", "## Key combinations", "## Prediction"],
  "comprehensive": ["## Reading", "## Key combinations", "## Prediction"],
  "grand-tableau": ["## Grand Tableau overview", "## Around the significator", "## Houses and mirrors", "## Prediction"],
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
  const bodyWithoutHeadings = reading
    .split("\n")
    .filter((line) => !/^#{1,6}\s/.test(line))
    .join("\n");
  const cardNamePattern = /\b(?:Rider|Clover|Ship|House|Tree|Clouds|Snake|Coffin|Bouquet|Scythe|Whip|Birds|Child|Fox|Bear|Stars|Stork|Dog|Tower|Garden|Mountain|Paths|Crossroads|Mice|Heart|Ring|Book|Letter|Man|Woman|Lily|Sun|Moon|Key|Fish|Anchor|Cross)\b/g;
  const mentionedCards = new Set<string>();
  let match;
  while ((match = cardNamePattern.exec(bodyWithoutHeadings)) !== null) {
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

export function isCriticalIssue(issue: ValidationIssue): boolean {
  return issue.type === "banned_term" || issue.type === "invented_card" || issue.type === "unsupported_timing";
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
  traditionalPairMeaning?: string;
}

export function buildDeterministicFallback(
  drawnCards: NormalizedFallbackCard[],
  spreadId: string,
  question: string,
): string {
  const q = question ? `Question: "${question}"` : "";
  const qLine = q ? `\n_${q}_\n\n` : "\n\n";

  if (drawnCards.length === 0) return `## Reading\n\nNo cards were drawn.`;

  if (drawnCards.length === 1) {
    const c = drawnCards[0];
    const kw = c.keywords?.slice(0, 3).join(", ") || "";
    const note = c.meaning?.general || c.traditionalPairMeaning || "";
    const opener = question
      ? `This is the situation you are sitting with regarding "${question}".`
      : `This is what the drawn card says about the situation.`;
    return `## Reading${qLine}${opener} **${c.name}** is the focus${kw ? ` — ${kw}` : ""}${note ? `. ${note}` : ""}.`;
  }

  const pairBullets: string[] = [];
  for (let i = 0; i < drawnCards.length - 1; i++) {
    const a = drawnCards[i];
    const b = drawnCards[i + 1];
    const meaning = a.traditionalPairMeaning || b.traditionalPairMeaning || `${a.name} combined with ${b.name} sets the direction of this stretch of the line.`;
    pairBullets.push(`- **${a.name} + ${b.name}**: ${meaning}`);
  }

  const last = drawnCards[drawnCards.length - 1];
  const lastKw = last.keywords?.slice(0, 2).join(", ") || last.name;
  const lastMeaning = last.meaning?.general || last.traditionalPairMeaning || "";

  const chainNames = drawnCards.map((c) => c.name).join(", ");
  const opener = question
    ? `This reading addresses "${question}".`
    : `This reading addresses the situation at hand.`;
  const reading = `${opener} Reading **${chainNames}** as one Lenormand chain, what begins with **${drawnCards[0].name}** develops through **${drawnCards[1].name}** and the closing card **${last.name}** (${lastKw}${lastMeaning ? ` — ${lastMeaning}` : ""}) shows where the line is most likely to land. Each adjacent pair below shows what changes between one card and the next.`;

  const primaryTimingCards: TimingCardDefinition[] = [];
  for (const c of drawnCards) {
    const def = getTimingCard(c.id);
    if (def) primaryTimingCards.push(def);
  }

  const timingLine = primaryTimingCards.length > 0
    ? primaryTimingCards.length === 1
      ? `**Likely timing:** ${primaryTimingCards[0].promptGuidance}`
      : `**Likely timing:** ${primaryTimingCards.map((t) => t.name).join(" and ")} are both drawn — ${primaryTimingCards[0].promptGuidance}`
    : "**Likely timing:** Not clearly shown by these cards.";

  return [
    `## Reading${qLine}${reading}`,
    "",
    "## Key combinations",
    "",
    pairBullets.join("\n"),
    "",
    "## Prediction",
    "",
    `**Most likely development:** The chain points toward **${last.name}** (${lastKw}) as the closing tendency of this situation${lastMeaning ? ` — ${lastMeaning}` : ""}.`,
    timingLine,
    "**Observable sign:** Watch for the practical situation described by the closing pair to start showing up in concrete form.",
    `**Practical action:** Move in the direction **${last.name}** suggests and respond to **${drawnCards[drawnCards.length - 1].name}** in kind.`,
  ].join("\n");
}
