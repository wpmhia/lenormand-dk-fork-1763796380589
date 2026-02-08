/**
 * Output validation for AI readings
 * Detects garbled output, hallucinations, and incomplete sentences
 */

import { VALID_CARD_NAMES } from "./prompt-builder";

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  severity: "low" | "medium" | "high";
}

// Patterns that indicate garbled output
const GARBLED_PATTERNS = [
  { pattern: /\bisn\b/, desc: "incomplete_contraction_isn" },
  { pattern: /\bthisn\b/, desc: "incomplete_contraction_thisn" },
  { pattern: /\bare\s*[,;.]\s*$/m, desc: "fragment_are" },
  { pattern: /\bis\s*[,;.]\s*$/m, desc: "fragment_is" },
  { pattern: /\bof\s+and\s+/i, desc: "garbled_of_and" },
  { pattern: /\bthe\s+\w+\s*,\s*the\s+\w+\s*$/m, desc: "fragment_card_list" },
  { pattern: /\s{2,}/g, desc: "excessive_whitespace" },
];

// Patterns for structural issues
const STRUCTURAL_PATTERNS = [
  { pattern: /^\s*[-•*]\s*/m, desc: "bullet_point" },
  { pattern: /^(First|Second|Third|1\.|2\.|3\.)\s*card/i, desc: "card_labeling" },
];

/**
 * Validate AI reading output for quality issues
 */
export function validateReading(text: string): ValidationResult {
  const issues: string[] = [];
  let severity: "low" | "medium" | "high" = "low";

  // Check for garbled patterns (HIGH severity)
  for (const { pattern, desc } of GARBLED_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(desc);
      severity = "high";
    }
  }

  // Check for structural issues (MEDIUM severity)
  for (const { pattern, desc } of STRUCTURAL_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(desc);
      if (severity === "low") severity = "medium";
    }
  }

  // Check for incomplete sentence at end
  const lastSentence = text.split(/[.!?]/).pop()?.trim();
  if (lastSentence && lastSentence.length > 0 && lastSentence.length < 20) {
    issues.push("incomplete_final_sentence");
    severity = "high";
  }

  // Check for valid card names (MEDIUM severity if wrong, HIGH if hallucinated)
  const mentionedCards = text.match(/\b[A-Z][a-z]+\b/g) || [];
  const validNames = new Set(VALID_CARD_NAMES);
  const invalidCards = mentionedCards.filter(c => 
    !validNames.has(c) && 
    !["Marie", "Anne", "Lenormand", "The", "This", "Your"].includes(c)
  );
  if (invalidCards.length > 0) {
    issues.push(`invalid_cards: ${invalidCards.join(", ")}`);
    severity = "high";
  }

  // Check sentence count for completeness
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
  if (sentenceCount < 2 && text.length > 100) {
    issues.push("run_on_sentence");
    if (severity === "low") severity = "medium";
  }

  return {
    valid: issues.length === 0,
    issues,
    severity,
  };
}

/**
 * Get retry parameters based on validation failure
 */
export function getRetryParams(previousAttempt: number): {
  temperature: number;
  topP: number;
  maxTokens: number;
} {
  if (previousAttempt === 1) {
    // First retry: Increase temperature for more variety
    return { temperature: 0.7, topP: 0.9, maxTokens: 1200 };
  }
  // Second retry: Max diversity
  return { temperature: 0.9, topP: 0.95, maxTokens: 1400 };
}

/**
 * Log validation result for analytics
 */
export function logValidationResult(
  result: ValidationResult,
  metadata: {
    cardCount: number;
    spreadId: string;
    responseLength: number;
  }
): void {
  // Structured logging for later analysis
  console.log(JSON.stringify({
    type: "ai_output_validation",
    valid: result.valid,
    severity: result.severity,
    issues: result.issues,
    ...metadata,
    timestamp: new Date().toISOString(),
  }));
}
