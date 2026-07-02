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

/** Default timeout for API requests in milliseconds */
export const API_REQUEST_TIMEOUT_MS = 30 * 1000;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  RATE_LIMITED: "Too many requests. Please try again later.",
  INVALID_INPUT: "Invalid input provided.",
  INTERNAL_ERROR: "An internal error occurred. Please try again.",
} as const;
