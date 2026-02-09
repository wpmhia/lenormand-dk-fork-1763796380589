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

/** Significator card IDs */
export const SIGNIFICATORS = {
  MAN: 28,
  WOMAN: 29,
} as const;

/** Grand Tableau section boundaries */
export const GRAND_TABLEAU_SECTIONS = {
  SITUATION: { start: 1, end: 12 },
  PEOPLE: { start: 13, end: 24 },
  OUTCOME: { start: 25, end: 36 },
} as const;

// ============================================================================
// Input Validation Constraints
// ============================================================================

/** Maximum question length for AI prompts */
export const MAX_QUESTION_LENGTH = 500;

/** Maximum card name length for sanitization */
export const MAX_CARD_NAME_LENGTH = 100;

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/** Default rate limit: requests per window */
export const DEFAULT_RATE_LIMIT = 5;

/** Default rate limit window in milliseconds (1 minute) */
export const DEFAULT_RATE_WINDOW_MS = 60 * 1000;

/** Maximum number of IP entries in cache before LRU eviction */
export const MAX_RATE_LIMIT_CACHE_SIZE = 10000;

/** Percentage of cache to evict when max size is reached */
export const RATE_LIMIT_EVICTION_PERCENTAGE = 0.2;

// ============================================================================
// API Configuration
// ============================================================================

/** DeepSeek API base URL */
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/** Default timeout for API requests in milliseconds */
export const API_REQUEST_TIMEOUT_MS = 30 * 1000;

// ============================================================================
// AI Model Configuration
// ============================================================================

/** AI enforcement clause to maintain reading style - appended to user prompts */
export const AI_ENFORCEMENT_CLAUSE =
  "Write complete sentences. Use only card names shown. No bullet points or lists. Answer their question directly.";

/** Sentence lengths for different reading types */
export const READING_SENTENCE_COUNTS = {
  SINGLE_CARD: { min: 1, max: 2 },
  SENTENCE_3: { min: 3, max: 5 },
  PAST_PRESENT_FUTURE: { min: 4, max: 5 },
  MIND_BODY_SPIRIT: { min: 4, max: 5 },
  YES_NO_MAYBE: { min: 2, max: 3 },
  SENTENCE_5: { min: 5, max: 7 },
  STRUCTURED_READING: { min: 6, max: 8 },
  WEEK_AHEAD: { min: 6, max: 8 },
  RELATIONSHIP_DOUBLE: { min: 6, max: 8 },
  COMPREHENSIVE: { min: 8, max: 12 },
  GRAND_TABLEAU: { min: 12, max: 15 },
} as const;

// ============================================================================
// Caching Configuration
// ============================================================================

/** Cache duration for card data in milliseconds (24 hours) */
export const CARD_DATA_CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/** Cache duration for spread data in milliseconds (24 hours) */
export const SPREAD_DATA_CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Pagination Configuration
// ============================================================================

/** Default page size for card listings */
export const DEFAULT_PAGE_SIZE = 10;

/** Maximum page size to prevent abuse */
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  RATE_LIMITED: "Too many requests. Please try again later.",
  INVALID_CARD_ID: "Invalid card ID. Cards must be between 1 and 36.",
  INVALID_SPREAD_ID: "Invalid spread ID.",
  MISSING_QUESTION: "A question is required for readings.",
  INTERNAL_ERROR: "An internal error occurred. Please try again.",
  INVALID_INPUT: "Invalid input provided.",
  UNAUTHORIZED: "Unauthorized access.",
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  READING_GENERATED: "Reading generated successfully.",
  DATA_SAVED: "Data saved successfully.",
} as const;
