/**
 * Map of Lenormand concepts to learning resources
 */
export interface ConceptLink {
  concept: string;
  url: string;
  description: string;
}

export const CONCEPT_LINKS: ConceptLink[] = [
  // Marie-Anne's system concepts
  {
    concept: "deadline",
    url: "/learn/marie-annes-system",
    description: "Marie-Anne deadline system for timing",
  },
  {
    concept: "timing",
    url: "/learn/marie-annes-system",
    description: "Card timing and duration",
  },
  {
    concept: "significator",
    url: "/learn/marie-annes-system",
    description: "Significator card method",
  },
  {
    concept: "grand tableau",
    url: "/learn/marie-annes-system",
    description: "Grand Tableau reading method",
  },
  {
    concept: "sentence reading",
    url: "/learn/spreads#3-card-spreads",
    description: "Sentence reading method",
  },
  {
    concept: "combination",
    url: "/learn/reading-basics",
    description: "Card combinations and pairs",
  },
  {
    concept: "combinations",
    url: "/learn/reading-basics",
    description: "Card combinations and pairs",
  },
  {
    concept: "adjacent",
    url: "/learn/reading-basics",
    description: "Adjacent card relationships",
  },
  {
    concept: "mirror",
    url: "/learn/reading-basics",
    description: "Mirror card reflections",
  },
  {
    concept: "mirror cards",
    url: "/learn/reading-basics",
    description: "Mirror card reflections",
  },
  {
    concept: "direct answer",
    url: "/learn/reading-basics",
    description: "Direct answers in readings",
  },
  {
    concept: "positive card",
    url: "/learn/reading-basics",
    description: "Positive card meanings",
  },
  {
    concept: "negative card",
    url: "/learn/reading-basics",
    description: "Negative card meanings",
  },
  {
    concept: "neutralizing",
    url: "/learn/reading-basics",
    description: "Neutralizing card effects",
  },
];

/**
 * Converts concept mentions in text to markdown links
 * E.g., "The deadline shows urgency" → "The [deadline](/learn/marie-annes-system) shows urgency"
 */
export function linkifyConcepts(text: string): string {
  if (!text) {
    return text;
  }

  // Sort concepts by length (longest first) to avoid partial matches
  const sortedConcepts = [...CONCEPT_LINKS].sort(
    (a, b) => b.concept.length - a.concept.length,
  );

  let result = text;

  for (const conceptLink of sortedConcepts) {
    const { concept, url } = conceptLink;

    // Create regex that matches the concept as a whole word (case-insensitive)
    const regex = new RegExp(`\\b${concept}\\b`, "gi");

    // Replace all matches, but avoid linking if already part of a link
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const regexWithGlobal = new RegExp(`\\b${concept}\\b`, "gi");
    while ((match = regexWithGlobal.exec(result)) !== null) {
      const matchIndex = match.index;

      // Add text before the match
      parts.push(result.substring(lastIndex, matchIndex));

      // Check if already in a markdown link
      const beforeText = result.substring(Math.max(0, matchIndex - 50));
      const afterText = result.substring(
        matchIndex + match[0].length,
        Math.min(result.length, matchIndex + match[0].length + 50),
      );

      // If already inside brackets or parentheses, don't link
      if (
        (beforeText.includes("[") && !beforeText.includes("]")) ||
        (beforeText.includes("](") && !afterText.includes(")"))
      ) {
        parts.push(match[0]);
      } else {
        // Create the markdown link
        parts.push(`[${match[0]}](${url})`);
      }

      lastIndex = regexWithGlobal.lastIndex;
    }

    // Add remaining text
    parts.push(result.substring(lastIndex));
    result = parts.join("");
  }

  return result;
}

/**
 * Extract unique concepts mentioned in text
 */
export function extractMentionedConcepts(text: string): ConceptLink[] {
  if (!text) return [];

  const mentioned = new Set<string>();

  CONCEPT_LINKS.forEach((conceptLink) => {
    const regex = new RegExp(`\\b${conceptLink.concept}\\b`, "gi");
    if (regex.test(text)) {
      mentioned.add(conceptLink.concept);
    }
  });

  // Return the concept links for mentioned concepts
  return CONCEPT_LINKS.filter((link) =>
    mentioned.has(link.concept.toLowerCase()),
  );
}
