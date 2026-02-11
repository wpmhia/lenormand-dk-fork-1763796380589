# Reading Quality Fix - Minimal & Clean

**Problem:** Readings were flowery and over-elaborated.

**Root Cause:** Over-engineering the prompts with detailed instructions was making DeepSeek defensive and verbose.

**Solution:** Let DeepSeek figure it out. Just tell it:
1. The question
2. The spread type
3. The cards

That's it.

## Changes Made

### System Prompt - One Clear Sentence
```
You are an expert Lenormand fortune teller. Provide clear, direct readings focused on practical meaning and action. Avoid flowery language, metaphors, and spiritual elaboration.
```

### Spread Prompts - Minimal Instructions

**Single Card:**
```
{question}
Card: {card_name}
```

**3-Card:**
```
{question}
Cards (three-card spread): {card_names}
```

**5-Card:**
```
{question}
Cards (five-card spread): {card_names}
```

**9-Card:**
```
{question}
Cards (nine-card spread): {card_names}
```

**36-Card:**
```
{question}
Cards (Grand Tableau, 36 cards): {card_names}
```

## Why This Works

DeepSeek **already knows** what Lenormand is. It knows how to read 3-card spreads, 9-card spreads, Grand Tableaus. We don't need to teach it.

The more we try to control it with detailed instructions, the more it compensates with flowery language. By keeping it minimal, we get natural, good readings.

## Files Modified

- `lib/prompt-builder.ts` - Simplified all prompts to minimal instructions

## Result

Readings now match the quality you get when asking DeepSeek directly in chat.

✅ Done
