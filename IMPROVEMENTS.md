# 5 Under-the-Hood Improvements

## Summary

Made 5 practical improvements to improve code quality, maintainability, and reduce errors without over-engineering.

---

## **IMPROVEMENT #1: Centralized Constants Module** ✅
**File:** `/lib/constants.ts` (137 lines)

Consolidated all magic numbers and configuration values into a single source of truth.

### Benefits:
- Easy to adjust configuration (rate limits, card counts, lengths)
- Type-safe constant access
- Self-documenting code
- 25+ previously scattered constants now organized

### What's Included:
- Card & spread configuration (card counts, significators, grand tableau sections)
- Rate limiting settings (defaults, cache sizes, eviction percentages)
- AI model configuration (enforcement clause, expected sentence counts)
- Input validation constraints (max lengths, error messages)
- Streaming & timeout settings

### Example Usage:
```typescript
import { TOTAL_CARDS, RATE_LIMIT_DEFAULT, MAX_QUESTION_LENGTH } from "@/lib/constants";

// Now rate-limit.ts can use: RATE_LIMIT_DEFAULT instead of hardcoded 5
```

---

## **IMPROVEMENT #2: Unified Error Handling Framework** ✅
**File:** `/lib/errors.ts` (331 lines)

Replaced scattered try-catch blocks with structured error handling.

### Benefits:
- Consistent error codes across entire app
- Structured error logging
- Type-safe error creation with factory functions
- Easy to identify and handle errors programmatically

### What's Included:
- `ErrorCode` enum (25+ error types)
- `AppError` class with serialization
- Factory functions for common errors
- `Logger` class for structured logging
- `normalizeError()` to convert any error to AppError
- `safeAsync()` wrapper for async operations

### Example Usage:
```typescript
import { AppError, ErrorCode, createValidationError } from "@/lib/errors";

// Before: throw new Error("Invalid card")
// After:
throw createValidationError("Invalid card ID", { providedId: 99 });
```

---

## **IMPROVEMENT #3: Prompt Builder Utility** ✅
**File:** `/lib/prompt-builder.ts` (119 lines)

Centralized AI prompt generation with proper input sanitization.

### Benefits:
- Prevents prompt injection attacks
- Single place to adjust all spread prompts
- Reusable sanitization functions
- Cleaner code in API routes

### What's Included:
- `buildPrompt()` for all 11 spread types
- Spread-specific prompt templates
- Input sanitization (control characters, quotes, newlines)
- Fallback handling for unknown spreads

### Example Usage:
```typescript
import { buildPrompt } from "@/lib/prompt-builder";

const prompt = buildPrompt(
  [{ id: 1, name: "Rider" }, { id: 2, name: "Clover" }],
  "sentence-3",
  "What will happen?"
);
```

---

## **IMPROVEMENT #4: Rate Limiting with Constants** ✅
**Updated:** `/lib/rate-limit.ts`

Refactored to use constants instead of hardcoded values.

### Changes:
- Imports from `constants.ts`: `RATE_LIMIT_DEFAULT`, `RATE_LIMIT_WINDOW_MS`, `MAX_RATE_LIMIT_CACHE_SIZE`, `RATE_LIMIT_EVICTION_PERCENTAGE`
- Removed duplicated magic numbers
- Now easier to adjust rate limiting behavior globally

### Before:
```typescript
const MAX_CACHE_SIZE = 10000;
const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
```

### After:
```typescript
import { MAX_RATE_LIMIT_CACHE_SIZE, RATE_LIMIT_EVICTION_PERCENTAGE } from "./constants";

const entriesToRemove = Math.floor(MAX_RATE_LIMIT_CACHE_SIZE * RATE_LIMIT_EVICTION_PERCENTAGE);
```

---

## **IMPROVEMENT #5: Streaming Response Helper** ✅
**File:** `/lib/stream-utils.ts` (94 lines)

Utility functions for handling streamed responses safely and consistently.

### Benefits:
- Reduces duplication in streaming code
- Handles errors and cleanup automatically
- Timeout support to prevent hung connections
- Type-safe stream handling

### What's Included:
- `streamResponse()` - Create streaming response from ReadableStream
- `writeChunk()` & `writeChunksWithDelay()` - Write to stream
- `createStreamingResponse()` - Create from async generator
- `parseStreamingResponse()` - Parse incoming streams
- `withStreamTimeout()` - Add timeout to stream promises

### Example Usage:
```typescript
import { createStreamingResponse } from "@/lib/stream-utils";

async function* generateReading(cards, question) {
  yield "The ";
  yield "cards ";
  yield "suggest...";
}

export async function GET(request: Request) {
  return createStreamingResponse(generateReading(cards, question));
}
```

---

## Impact Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Magic Numbers** | Scattered across files | Centralized in constants.ts |
| **Error Handling** | Silent catches, generic errors | Structured error codes & factory functions |
| **Prompts** | Hardcoded in routes | Centralized builder with sanitization |
| **Rate Limiting Config** | Hardcoded values | Uses centralized constants |
| **Streaming Code** | Duplicated across routes | Reusable utility functions |

---

## Next Steps

These 5 improvements create a solid foundation for:
1. Easy configuration updates (edit constants.ts once, affects everywhere)
2. Consistent error handling (use factory functions consistently)
3. Security improvements (centralized sanitization)
4. Code reusability (streaming utils, prompt builder)
5. Maintenance (single source of truth for each concern)
