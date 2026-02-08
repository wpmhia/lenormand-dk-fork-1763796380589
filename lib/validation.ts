/**
 * Validation Utilities
 * 
 * Type-safe validators for common data types and API inputs.
 * Provides consistent error handling and type narrowing.
 */

import {
  createValidationError,
  AppError,
  ErrorCode,
} from "./errors";

// ============================================================================
// Card Validation
// ============================================================================

/**
 * Validates a card ID is within valid range (1-36)
 */
export function validateCardId(id: unknown): asserts id is number {
  if (typeof id !== "number" || id < 1 || id > 36) {
    throw createValidationError(
      "Invalid card ID. Cards must be between 1 and 36.",
      { providedId: id },
    );
  }
}

/**
 * Validates card IDs array
 */
export function validateCardIds(ids: unknown): asserts ids is number[] {
  if (!Array.isArray(ids)) {
    throw createValidationError("Card IDs must be an array", {
      received: typeof ids,
    });
  }

  if (ids.length === 0) {
    throw createValidationError("At least one card is required");
  }

  ids.forEach((id, index) => {
    if (typeof id !== "number" || id < 1 || id > 36) {
      throw createValidationError(
        `Card at index ${index} has invalid ID: ${id}`,
      );
    }
  });
}

/**
 * Validates card count matches expected count for spread type
 */
export function validateCardCount(
  cardCount: number,
  expectedCount: number | number[],
): asserts cardCount is number {
  const expectedCounts = Array.isArray(expectedCount)
    ? expectedCount
    : [expectedCount];

  if (!expectedCounts.includes(cardCount)) {
    throw createValidationError(
      `Expected ${expectedCounts.join(" or ")} cards, got ${cardCount}`,
      { cardCount, expectedCounts },
    );
  }
}

// ============================================================================
// Spread Validation
// ============================================================================

const VALID_SPREAD_IDS = [
  "single-card",
  "sentence-3",
  "past-present-future",
  "mind-body-spirit",
  "yes-no-maybe",
  "sentence-5",
  "structured-reading",
  "week-ahead",
  "relationship-double-significator",
  "comprehensive",
  "grand-tableau",
];

/**
 * Validates spread ID is in allowed list
 */
export function validateSpreadId(spreadId: unknown): asserts spreadId is string {
  if (typeof spreadId !== "string") {
    throw createValidationError("Spread ID must be a string", {
      received: typeof spreadId,
    });
  }

  if (!VALID_SPREAD_IDS.includes(spreadId)) {
    throw createValidationError(
      `Unknown spread ID: ${spreadId}. Valid options are: ${VALID_SPREAD_IDS.join(", ")}`,
      { providedId: spreadId, validIds: VALID_SPREAD_IDS },
    );
  }
}

// ============================================================================
// String Validation
// ============================================================================

/**
 * Validates string is not empty and within length constraints
 */
export function validateString(
  value: unknown,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = Infinity,
): asserts value is string {
  if (typeof value !== "string") {
    throw createValidationError(
      `${fieldName} must be a string`,
      { field: fieldName, received: typeof value },
    );
  }

  if (value.length < minLength) {
    throw createValidationError(
      `${fieldName} is too short (minimum ${minLength} characters)`,
      { field: fieldName, length: value.length },
    );
  }

  if (value.length > maxLength) {
    throw createValidationError(
      `${fieldName} is too long (maximum ${maxLength} characters)`,
      { field: fieldName, length: value.length },
    );
  }
}

/**
 * Validates question string for readings
 */
export function validateQuestion(question: unknown): asserts question is string {
  validateString(question, "Question", 1, 500);
}

// ============================================================================
// Object/Record Validation
// ============================================================================

/**
 * Validates required fields exist in object
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  obj: unknown,
  requiredFields: string[],
): asserts obj is T {
  if (typeof obj !== "object" || obj === null) {
    throw createValidationError("Expected an object", {
      received: typeof obj,
    });
  }

  const missing: string[] = [];
  for (const field of requiredFields) {
    if (!(field in obj)) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw createValidationError(
      `Missing required fields: ${missing.join(", ")}`,
      { missingFields: missing },
    );
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a valid card object
 */
export function isValidCard(
  obj: unknown,
): obj is { id: number; name: string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj &&
    typeof (obj as { id: unknown }).id === "number" &&
    typeof (obj as { name: unknown }).name === "string"
  );
}

/**
 * Check if value is a valid reading request
 */
export function isValidReadingRequest(obj: unknown): obj is {
  question: string;
  cards: Array<{ id: number; name: string }>;
  spreadId?: string;
} {
  if (
    typeof obj !== "object" ||
    obj === null ||
    !("question" in obj) ||
    !("cards" in obj)
  ) {
    return false;
  }

  const request = obj as {
    question: unknown;
    cards: unknown;
    spreadId?: unknown;
  };

  if (typeof request.question !== "string") return false;
  if (!Array.isArray(request.cards)) return false;
  if (request.cards.length === 0) return false;

  return request.cards.every(isValidCard);
}

// ============================================================================
// Safe Validation Wrappers
// ============================================================================

/**
 * Safely validate card ID, returning result instead of throwing
 */
export function safeValidateCardId(
  id: unknown,
): { valid: true; value: number } | { valid: false; error: AppError } {
  try {
    validateCardId(id);
    return { valid: true, value: id as number };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof AppError
        ? error
        : new AppError("Card validation failed"),
    };
  }
}

/**
 * Safely validate spread ID, returning result instead of throwing
 */
export function safeValidateSpreadId(
  spreadId: unknown,
): { valid: true; value: string } | { valid: false; error: AppError } {
  try {
    validateSpreadId(spreadId);
    return { valid: true, value: spreadId as string };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof AppError
        ? error
        : new AppError("Spread validation failed"),
    };
  }
}

/**
 * Safely validate reading request
 */
export function safeValidateReadingRequest(
  obj: unknown,
): { valid: true; value: unknown } | { valid: false; error: AppError } {
  try {
    if (!isValidReadingRequest(obj)) {
      throw createValidationError("Invalid reading request format");
    }
    return { valid: true, value: obj };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof AppError
        ? error
        : new AppError("Reading request validation failed"),
    };
  }
}
