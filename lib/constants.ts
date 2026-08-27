/**
 * Centralized Constants Module
 * 
 * All application-wide constants are defined here for:
 * - Easy maintenance and updates
 * - Type safety
 * - Single source of truth
 */

// ============================================================================
// Card and Spread Configuration
// ============================================================================

/** Total number of Lenormand cards */
export const TOTAL_CARDS = 36;

/** Grand Tableau card count */
export const GRAND_TABLEAU_CARD_COUNT = 36;

// ============================================================================
// Input Validation Constraints
// ============================================================================

/** Maximum question length for AI prompts */
export const MAX_QUESTION_LENGTH = 2000;

/** Maximum card name length for sanitization */
export const MAX_CARD_NAME_LENGTH = 100;

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/** Default rate limit: requests per window */
export const DEFAULT_RATE_LIMIT = 5;

/** Default rate limit window in milliseconds (1 minute) */
export const DEFAULT_RATE_WINDOW_MS = 60 * 1000;

// ============================================================================
// API Configuration
// ============================================================================

/** Mistral API base URL */
export const MISTRAL_BASE_URL = "https://api.mistral.ai";

/** Maximum route budget, including a possible validation repair. */
export const API_REQUEST_TIMEOUT_MS = 60 * 1000;

/** Generation budgets leave room for one short validation repair. */
export function getReadingTimeoutMs(cardCount: number): number {
  if (cardCount <= 1) return 15_000;
  if (cardCount <= 3) return 20_000;
  if (cardCount <= 5) return 25_000;
  if (cardCount <= 9) return 42_000;
  return 44_000;
}

export function getReadingRepairTimeoutMs(cardCount: number): number {
  return cardCount >= 36 ? 10_000 : cardCount >= 9 ? 12_000 : 8_000;
}

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  RATE_LIMITED: "Too many requests. Please try again later.",
  INVALID_INPUT: "Invalid input provided.",
  INTERNAL_ERROR: "An internal error occurred. Please try again.",
} as const;
