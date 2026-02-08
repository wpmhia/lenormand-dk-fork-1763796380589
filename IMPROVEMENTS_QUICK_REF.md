# 5 Under-the-Hood Improvements - Quick Reference

## Files Created/Updated

### New Files:
✅ `lib/constants.ts` (5.0 KB) - Centralized configuration
✅ `lib/errors.ts` (7.5 KB) - Unified error handling
✅ `lib/prompt-builder.ts` (5.6 KB) - AI prompt generation
✅ `lib/stream-utils.ts` (3.4 KB) - Streaming utilities

### Updated Files:
✅ `lib/rate-limit.ts` - Now uses centralized constants

---

## Usage Examples

### 1. Use Constants Instead of Magic Numbers
```typescript
import { TOTAL_CARDS, MAX_QUESTION_LENGTH, RATE_LIMIT_DEFAULT } from "@/lib/constants";

// Before: if (id < 1 || id > 36)
// After:
if (id < 1 || id > TOTAL_CARDS)
```

### 2. Handle Errors Consistently
```typescript
import { createValidationError, createRateLimitError, logger } from "@/lib/errors";

try {
  validateInput(data);
} catch (error) {
  logger.error("Validation failed", error);
  throw createValidationError("Invalid data");
}
```

### 3. Build AI Prompts Properly
```typescript
import { buildPrompt } from "@/lib/prompt-builder";

const cards = [
  { id: 1, name: "Rider" },
  { id: 2, name: "Clover" }
];
const prompt = buildPrompt(cards, "sentence-3", "What will happen?");
```

### 4. Stream Responses Safely
```typescript
import { createStreamingResponse, withStreamTimeout } from "@/lib/stream-utils";

async function* generateReading() {
  yield "The cards suggest ";
  yield "a positive change...";
}

export async function GET() {
  return createStreamingResponse(generateReading());
}
```

### 5. Configure Rate Limiting Globally
```typescript
// In lib/constants.ts, adjust these:
export const DEFAULT_RATE_LIMIT = 5; // Requests
export const DEFAULT_RATE_WINDOW_MS = 60 * 1000; // 1 minute
export const MAX_RATE_LIMIT_CACHE_SIZE = 10000;
export const RATE_LIMIT_EVICTION_PERCENTAGE = 0.2; // 20%

// No changes needed in rate-limit.ts!
```

---

## Benefits Checklist

- ✅ **Single source of truth** for all configuration
- ✅ **Type-safe** error handling with proper HTTP codes
- ✅ **Security** improvements with centralized sanitization
- ✅ **Code reusability** - less duplication across routes
- ✅ **Easy to maintain** - change config once, affects everywhere
- ✅ **Better debugging** - structured logging and errors
- ✅ **Production-ready** - proper error handling and timeouts

---

## Next Steps

Consider these follow-ups:
1. Update existing API routes to use `buildPrompt()` instead of duplicate code
2. Replace scattered error handling with factory functions
3. Use streaming utilities in `/api/readings/interpret` route
4. Monitor what other magic numbers could be centralized
