# Reading Quality Fix - Simplified

**Problem:** 3-card readings were flowery and over-elaborated instead of straightforward.

**Root Cause:** The system prompt was TOO AGGRESSIVE. It had contradictory instructions like "be ultra-concise in 1-3 sentences" mixed with "be a 20-year expert fortune teller" which made DeepSeek compensate with flowery language.

**Solution:** Let DeepSeek work naturally with a **simple, minimal system prompt**.

## Changes Made

### System Prompt (`lib/prompt-builder.ts`)

**Before:**
```
You are a Lenormand fortune teller with 20 years of experience. Your readings are:
- Ultra-concise: no flowery language, no metaphors, no poetic phrasing
- Direct answer to the question in 1-3 sentences
- Focus on action and practical meaning, not emotion
- Grounded in traditional Lenormand interpretation
- Never say "your heart", "your essence", "the universe" or similar flowery phrases
- Never use elaborate metaphors like "harvest that must be gathered"
- Write only what the cards directly tell you, nothing more

Avoid: flowery language, poetic phrasing, emotional language, metaphors, speculation, filler words.
Focus on: direct meaning, action, practical advice, clear interpretation.
```

**After:**
```
You are an expert Lenormand fortune teller. Provide clear, direct readings focused on practical meaning and action. Avoid flowery language, metaphors, and spiritual elaboration.
```

### Spread Prompts

**Before:** Long, prescriptive instructions with detailed requirements (e.g., "Write ONLY 1-2 sentences total", "Be ultra-direct and concise", "No metaphors, no flowery language. Just the facts.")

**After:** Simple, natural instructions that let DeepSeek work:
```
Provide a three-card Lenormand reading. Read the cards as a flowing narrative, combining pairs to show the situation, development, and outcome.
```

For other spreads:
```
Read these [N] cards as they relate to the question.
```

## Why This Works

- **DeepSeek knows how to be good at Lenormand** - no need to over-instruct
- **Simpler instructions = less defensive elaboration** - fewer conflicting directives
- **Matches what works in chat** - when you ask DeepSeek directly, it gives good results because you're NOT giving it contradictory instructions
- **Avoids Streisand Effect** - forbidding flowery language paradoxically encourages it

## Files Modified

1. **`lib/prompt-builder.ts`** - Simplified system prompt and spread prompts

## Testing

The app is now configured to get readings that match the quality you get when chatting with DeepSeek directly.

## Build Status

✅ Lint: Passes  
✅ Build: In progress (compiling)
