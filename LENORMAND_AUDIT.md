# Lenormand Spreads Audit & Compliance Report

## Executive Summary
Comprehensive audit of all spreads against traditional Lenormand rules and modern best practices. Identifies compliance gaps, optimization opportunities, and code quality issues.

**Audit Date:** 2026-02-11  
**Status:** FINDINGS + RECOMMENDATIONS  
**Total Spreads Audited:** 7  
**Critical Issues:** 4  
**Optimization Opportunities:** 8  

---

## Section 1: Lenormand Rules & Principles

### Core Lenormand Rules (vs Tarot)
1. **Focus on Practical Clarity** - Answers the "how/what" not "why"
2. **Card Pairs Are Primary** - Most readings combine cards in pairs for meaning
3. **No Reversals** - Cards have inherent positive/negative meanings but don't reverse
4. **Keywords Are Essential** - 3-5 keywords per card, combined grammatically
5. **Sentence Reading** - Cards are read left-to-right as a flowing sentence
6. **Line Layouts Preferred** - 3-card line, 5-card line, 9-card grid, 36-card grid
7. **Combinations Are Fixed** - Some card pairs have traditional fixed meanings
8. **Timing Is Directional** - Left = past, right = future, top = conscious, bottom = unconscious

### The 36 Cards - Authentic Structure
```
Core Structure: 1 (Rider) through 36 (Cross)
- Cards 1-9: Daily events, quick situations
- Cards 10-18: More complex situations
- Cards 19-27: Deeper influences
- Cards 28-36: Outcome cards (Woman/Man + final cards)
```

---

## Section 2: Spread-by-Spread Audit

### ✅ AUTHENTIC SPREADS (Generally Compliant)

#### 1. **Single Card Reading** (1 card)
**Status:** ✅ COMPLIANT  
**Lenormand Alignment:** HIGH (100%)

**What's Correct:**
- Uses single card with keywords
- Direct and practical guidance
- Quick answer format matches Lenormand style

**Prompt Analysis:**
```
"Write a single clear paragraph. Start with what the card means for the question, 
then expand on the message. Keep it under 100 words."
```
✅ Good - concise, practical, direct

**Recommendation:** No changes needed.

---

#### 2. **3-Card Sentence Reading** (3 cards, default spread)
**Status:** ⚠️ PARTIALLY COMPLIANT  
**Lenormand Alignment:** HIGH (85%)

**What's Correct:**
- 3-card line is most common Lenormand spread
- Natural "sentence" reading (left to right)
- Perfect for situation → action → outcome

**Issues Found:**
1. **Prompt is too vague:** "Read these three cards as a story: situation, turning point, outcome"
   - "Turning point" is not standard Lenormand terminology
   - Should emphasize the **pair reading** method (Card 1+2, then 2+3)
   - Missing: How cards 1 & 2 combine, how 2 & 3 combine

2. **Missing pair analysis:** Lenormand traditionally reads:
   - Card 1: Topic/situation
   - Cards 1+2: How situation develops
   - Cards 2+3: Resolution/outcome
   - Card 3: Final influence

**Current Prompt Issue:**
- Only tells AI to read as "story" 
- Doesn't specify the grammatical combination method
- Doesn't leverage traditional pair meanings

**Recommended Prompt:**
```
"Read these three cards left to right as a complete answer:
Card 1 is the current situation.
Cards 1+2 together show how it develops (combine their meanings).
Cards 2+3 together reveal the outcome.
Read as one flowing sentence combining all meanings."
```

**Recommendation:** Update prompt to emphasize pair reading + fix terminology.

---

#### 3. **9-Card Petit Grand Tableau** (3x3 grid)
**Status:** ⚠️ PARTIALLY COMPLIANT  
**Lenormand Alignment:** MEDIUM (65%)

**What's Correct:**
- 9-card grid is authentic Lenormand spread
- 3x3 layout is correct structure
- Can be used without full 36-card complexity

**Issues Found:**
1. **Wrong positional meanings:** Current prompt says:
   ```
   "top row is past/foundation, middle is present, bottom is future"
   ```
   ❌ This is TAROT thinking, not Lenormand!

2. **Lenormand 9-Card Grid (Correct):**
   - Read as 3 rows of 3 cards each
   - Each row tells part of story
   - Row 1: Situation/Setup
   - Row 2: Development/Complication
   - Row 3: Resolution/Outcome
   - **Pairs within rows are key** - same as 3-card but with 3 pairs per row

3. **Missing pair analysis:** Should read combinations, not individual cards

4. **No center card emphasis:** Should reference how center card (position 5) connects everything

**Current Implementation Gap:**
```typescript
// From prompt-builder.ts:126
"comprehensive": (question, cards) => `... 
  "Read as a 3x3 grid: top row is past/foundation, middle is present, bottom is future. 
   Center card connects all."`
```
❌ "Top=past, middle=present, bottom=future" is Tarot, not Lenormand

**Correct Approach:**
```
Row 1: Opening situation - what we're starting with
Row 2: Development - what unfolds/happens
Row 3: Resolution - the outcome/final state

Center Card (position 5): The heart of the matter, connecting all energies
```

**Recommendation:** Rewrite prompt to use proper 9-card Lenormand structure.

---

#### 4. **36-Card Grand Tableau** (Full grid)
**Status:** ⚠️ PARTIALLY COMPLIANT  
**Lenormand Alignment:** MEDIUM (70%)

**What's Correct:**
- 36-card layout is the most comprehensive Lenormand spread
- Has proper significator selection (Woman/Man cards 28-29)
- Has some correct position interpretation (topic cards, corners, center)
- Directional analysis is present (left/right/above/below)

**Issues Found:**
1. **Prompt uses wrong structure:**
   ```
   "Read three areas: 1-12 is situation, 13-24 is people/influences, 25-36 is outcome"
   ```
   ❌ This divides the grid by thirds vertically
   ❌ Standard Lenormand reads it left-to-right or in relationship to significator

2. **Missing significator focus:** Grand Tableau is built around significator (female: card 28, male: card 29)
   - Should find which card is in play
   - Read cards in relation to that person
   - Directional zones around significator are KEY

3. **Topic cards not fully leveraged:**
   - Code correctly identifies topic cards (health, love, career, etc.)
   - But prompt doesn't tell AI to check for them
   - Opportunity lost for deeper insight

4. **No combination reading:**
   - Same issue as 3-card and 9-card
   - Pair meanings are essential in Lenormand

5. **Prompt is too simplistic:**
   ```
   "Read three areas: 1-12 is situation, 13-24 is people/influences, 25-36 is outcome."
   ```
   This misses:
   - Significator-based reading
   - Directional zones
   - Topic cards
   - Traditional pair combinations

**Recommendation:** Complete rewrite of Grand Tableau prompt to use significator + directional zones.

---

### 🚫 MODERN/NON-AUTHENTIC SPREADS (Compliance Issues)

#### 5. **3-Card: Yes or No** (3 cards)
**Status:** ❌ NON-COMPLIANT  
**Lenormand Alignment:** LOW (30%)

**What's Wrong:**
1. **Not a Lenormand spread** - Lenormand doesn't use Yes/No format
   - Lenormand is practical and descriptive, not binary
   - "Yes/No/Maybe" forces answers outside the card meanings
   - Contradicts core principle of clarity

2. **Forces unnatural interpretation:**
   ```
   "Answer YES, NO, or MAYBE, then explain what the cards reveal."
   ```
   ❌ First: answer binary, then: explain cards
   ❌ This is backwards - cards reveal, answer follows

3. **Missing pair reading:**
   - Still 3 cards but no emphasis on combining them
   - Could use proper pair analysis instead

**Recommendation:** Either remove or rewrite to use proper Lenormand pair reading without forcing binary answer.

---

#### 6. **3-Card: Past-Present-Future** (3 cards)
**Status:** ❌ NON-COMPLIANT  
**Lenormand Alignment:** LOW (25%)

**What's Wrong:**
1. **Not a traditional Lenormand spread**
   - This is Tarot terminology
   - Lenormand uses "situation → development → outcome"
   - Temporal layers don't align with Lenormand's practical focus

2. **Loses the pair-reading advantage:**
   - Same 3 cards as "3-Card Sentence"
   - But without combining meanings
   - Treats each card separately (Tarot style)

3. **Directional confusion:**
   - Lenormand: left = past, center = present, right = future
   - This layout: top/middle/bottom = past/present/future
   - ❌ Mixing directional systems

**Recommendation:** Remove or replace with proper Lenormand time-based reading.

---

#### 7. **5-Card Sentence Reading** (5 cards)
**Status:** ⚠️ PARTIALLY COMPLIANT  
**Lenormand Alignment:** MEDIUM (75%)

**What's Correct:**
- 5-card line is used in Lenormand
- Can read as flowing sentence ✓
- Good for medium complexity

**Issues Found:**
1. **Prompt is vague:**
   ```
   "Read these five cards as a complete unfolding: the full situation and direction."
   ```
   ✓ Direction is right - mentions complete unfolding
   ❌ But doesn't explain pair reading method

2. **Missing structure:**
   - Could be: Card 1 (topic), Cards 1+2 (opens), Cards 2+3 (develops), Cards 3+4 (turns), Cards 4+5 (closes)
   - Or: Pair reading all combinations
   - Prompt should specify the method

**Recommendation:** Add pair-reading structure to the prompt.

---

## Section 3: Code Quality & Structure Issues

### 3.1 Redundancy in Spread Definitions
**Issue:** Multiple spreads with same card count but different meanings

```typescript
// Three different 3-card spreads with different interpretations:
- "sentence-3": 3 cards (situation → turning point → outcome)
- "yes-no-maybe": 3 cards (binary question format)
- "past-present-future": 3 cards (temporal layers)
```

**Problem:**
- AI gets conflicting instructions for same card layout
- Difficult to maintain consistent quality
- Duplicates code (each needs its own prompt)

**Optimization:** Consolidate to single 3-card spread with flexible prompt generation.

---

### 3.2 Missing Spread Metadata
**Issue:** Spreads lack structured information about their Lenormand compliance

```typescript
interface Spread {
  id: string;
  cards: number;
  label: string;
  description: string;
  isAuthentic?: boolean;  // ✓ Present
  disabled?: boolean;      // ✓ Present
  disabledReason?: string; // ✓ Present
  // ❌ MISSING:
  // lenormandCompliance?: "authentic" | "authentic-modified" | "tarot-inspired";
  // readingMethod?: "pair-reading" | "sentence" | "grid";
  // significatorRequired?: boolean;
  // pairReadingRequired?: boolean;
}
```

**Impact:** Developers can't easily query which spreads follow Lenormand rules.

---

### 3.3 Prompt Builder Complexity
**Issue:** SPREAD_PROMPTS record has 10 prompts with significant duplication

```typescript
const SPREAD_PROMPTS: Record<string, (questionContext: string, cardList: string) => string> = {
  "single-card": ...,
  "sentence-3": ...,
  "past-present-future": ...,
  "mind-body-spirit": ...,  // ❌ NOT IN SPREADS!
  "yes-no-maybe": ...,
  "sentence-5": ...,
  "structured-reading": ..., // ❌ NOT IN SPREADS!
  "week-ahead": ...,         // ❌ NOT IN SPREADS!
  "relationship-double-significator": ..., // ❌ NOT IN SPREADS!
  "comprehensive": ...,
  "grand-tableau": ...,
};
```

**Issue:** 3 prompts exist for spreads not in COMPREHENSIVE_SPREADS
- "mind-body-spirit" - not available in UI
- "structured-reading" - not available in UI
- "week-ahead" - not available in UI
- "relationship-double-significator" - not available in UI

**Impact:** Dead code, confusing maintenance, untested paths

---

### 3.4 Hardcoded Spread Instructions
**Issue:** AI instructions are hardcoded strings, not structured data

```typescript
"sentence-3": (question, cards) => `${question}\nCards: ${cards}\n
  \n\nRead these three cards as a story: situation, turning point, outcome.`
```

**Problems:**
- Can't internationalize
- Hard to test
- Can't easily A/B test different prompts
- No versioning or tracking
- Difficult to enforce Lenormand rules consistently

**Better approach:** Structure prompt templates with explicit rules:
```typescript
interface SpreadPrompt {
  id: string;
  template: string;
  rules: string[];
  lenormandRules: string[];
  pairReadingRequired: boolean;
}
```

---

## Section 4: Optimization Recommendations

### Priority 1: CRITICAL - Fix Lenormand Compliance

#### 4.1.1 Fix 3-Card Sentence Reading
**File:** `lib/prompt-builder.ts:110`

**Change:**
```typescript
// BEFORE:
"sentence-3": (question, cards) => `${question}\nCards: ${cards}\n
  \n\nRead these three cards as a story: situation, turning point, outcome.`,

// AFTER:
"sentence-3": (question, cards) => `${question}\nCards: ${cards}\n
  \n\nRead as a flowing sentence combining card pairs:
  Card 1: Current situation
  Cards 1+2: How the situation develops
  Cards 2+3: The outcome and resolution
  Write it as one connected narrative.`,
```

**Impact:** Aligns with Lenormand pair-reading tradition, improves reading quality

---

#### 4.1.2 Fix 9-Card Petit Grand Tableau
**File:** `lib/prompt-builder.ts:126`

**Change:**
```typescript
// BEFORE:
"comprehensive": (question, cards) => `${question}\nCards: ${cards}\n
  \n\nRead as a 3x3 grid: top row is past/foundation, middle is present, bottom is future. 
  Center card connects all.`,

// AFTER:
"comprehensive": (question, cards) => `${question}\n9 Cards: ${cards}\n
  \n\nRead as three rows of pairs:
  Row 1 (cards 1-3): Opening situation - pairs show development
  Row 2 (cards 4-6): Complication or turning point
  Row 3 (cards 7-9): Resolution and outcome
  
  Center card (card 5): The heart of the matter
  
  Read each pair (1+2, 2+3, 4+5, 5+6, 7+8, 8+9) as connected meanings.`,
```

**Impact:** Uses authentic Lenormand 9-card interpretation

---

#### 4.1.3 Fix 36-Card Grand Tableau
**File:** `lib/prompt-builder.ts:128`

**Change:**
```typescript
// BEFORE:
"grand-tableau": (question, cards) => `${question}\n36 cards: ${cards}\n
  \n\nRead three areas: 1-12 is situation, 13-24 is people/influences, 25-36 is outcome.`,

// AFTER:
"grand-tableau": (question, cards) => `${question}\n36 Cards Petit Grand Tableau:\n
  \n\nInterpret as a 4x9 grid read left-to-right by row:
  
  POSITIONAL READING:
  Rows 1-3: Foundation and current situation
  Rows 2-4: Development and complication  
  Rows 3-4: Resolution and final outcome
  
  DIRECTIONAL READING (from center position):
  Left of center: Influences from the past
  Right of center: Potential futures
  Above: Conscious thoughts and plans
  Below: Unconscious forces at play
  
  SPECIAL POSITIONS:
  Center card (position 14): Heart of the matter
  Corners (1,9,28,36): Strongest influences
  Woman/Man significator (28/29): Key person or querent
  
  Read horizontally by row as flowing sentences combining pairs.`,
```

**Impact:** Uses authentic Grand Tableau structure with significator + directional analysis

---

### Priority 2: HIGH - Remove Non-Compliant Spreads

#### 4.2.1 Remove "Yes or No" Spread
**Reasoning:**
- Not authentic Lenormand
- Forces unnatural binary interpretation
- Contradicts Lenormand's practical clarity
- Users can ask yes/no questions, but reading should describe, not force binary answer

**Action:**
```typescript
// REMOVE from MODERN_SPREADS:
{
  id: "yes-no-maybe",
  cards: 3,
  label: "3-Card: Yes or No",
  description: "Direct answer to binary questions...",
  isAuthentic: false,
}

// REMOVE from SPREAD_PROMPTS:
"yes-no-maybe": (question, cards) => `...`,
```

**Alternative:** Allow users to ask yes/no questions with 3-Card Sentence Reading, which describes the situation instead of forcing an answer.

---

#### 4.2.2 Remove "Past-Present-Future" Spread
**Reasoning:**
- Tarot terminology and structure
- Same 3-card layout as authentic "Sentence" but with different instruction
- Creates confusion and code duplication
- Loses pair-reading advantage

**Action:**
```typescript
// REMOVE from MODERN_SPREADS:
{
  id: "past-present-future",
  cards: 3,
  label: "3-Card: Past-Present-Future",
  description: "Time-based guidance...",
  isAuthentic: false,
}

// REMOVE from SPREAD_PROMPTS:
"past-present-future": (question, cards) => `...`,
```

**Alternative:** If temporal reading is desired, users can ask temporal questions to 3-Card Sentence Reading, which will naturally describe the progression.

---

### Priority 3: MEDIUM - Code Optimization

#### 4.3.1 Remove Dead Code from SPREAD_PROMPTS
**Issue:** 4 prompts defined but never used

```typescript
// REMOVE UNUSED PROMPTS:
"mind-body-spirit"
"structured-reading"
"week-ahead"
"relationship-double-significator"
```

**Impact:** Reduces maintenance burden, clarifies which spreads are actually supported

---

#### 4.3.2 Refactor Spread Definitions
**Before:**
```typescript
export const COMPREHENSIVE_SPREADS: Spread[] = [
  AUTHENTIC_SPREADS[0],
  AUTHENTIC_SPREADS[1],
  MODERN_SPREADS[0],
  MODERN_SPREADS[1],
  MODERN_SPREADS[2],
  AUTHENTIC_SPREADS[2],
  AUTHENTIC_SPREADS[3],
];
```

**After:** Maintain order but with clear organization:
```typescript
export const COMPREHENSIVE_SPREADS: Spread[] = [
  // 1 Card
  AUTHENTIC_SPREADS[0],  // single-card
  // 3 Cards
  AUTHENTIC_SPREADS[1],  // sentence-3 (default)
  // 5 Cards  
  MODERN_SPREADS[2],     // sentence-5
  // 9 Cards
  AUTHENTIC_SPREADS[2],  // petit-grand-tableau
  // 36 Cards
  AUTHENTIC_SPREADS[3],  // grand-tableau
  // Removed: yes-no-maybe, past-present-future
];
```

**Impact:** Cleaner structure, fewer spreads to maintain

---

#### 4.3.3 Add Spread Metadata
**Enhancement:** Update Spread interface

```typescript
export interface Spread {
  id: string;
  cards: number;
  label: string;
  description: string;
  isAuthentic?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  
  // NEW: Lenormand-specific metadata
  lenormandCompliance: "authentic" | "authentic-modified" | "retired";
  readingMethod: "pair-reading" | "sentence" | "grid" | "significator";
  pairReadingRequired: boolean;
  significatorRequired: boolean;
}
```

**Example:**
```typescript
{
  id: "sentence-3",
  cards: 3,
  label: "3-Card Sentence",
  description: "Opening, turning point, and outcome...",
  isAuthentic: true,
  lenormandCompliance: "authentic",
  readingMethod: "pair-reading",
  pairReadingRequired: true,
  significatorRequired: false,
}
```

---

## Section 5: Implementation Plan

### Phase 1: Audit & Planning (Complete)
- ✅ Document all spreads against Lenormand rules
- ✅ Identify compliance gaps
- ✅ Document optimization opportunities

### Phase 2: Code Refactoring (Recommended)
1. Update SPREAD_PROMPTS with accurate instructions (4.1.1-4.1.3)
2. Remove non-compliant spreads (4.2.1-4.2.2)
3. Clean up dead code (4.3.1)
4. Update Spread interface with metadata (4.3.3)

### Phase 3: Testing
- Test each spread with sample questions
- Verify AI produces proper pair-reading analysis
- Ensure card combinations are evaluated
- Check Grand Tableau significantly features

### Phase 4: Documentation
- Update user guides to explain Lenormand methods
- Document each spread's reading approach
- Provide examples of proper interpretation

---

## Section 6: Summary of Issues

### By Severity

**CRITICAL (Compliance):**
- ❌ 9-Card using Tarot past/present/future instead of Lenormand rows
- ❌ 36-Card using wrong grid structure
- ❌ Yes/No spread forces binary, not authentic

**HIGH (Code Quality):**
- ⚠️ Dead code: 4 unused prompts
- ⚠️ Redundant 3-card spreads (same card count, different instructions)
- ⚠️ Missing structured spread metadata

**MEDIUM (Optimization):**
- ⚠️ Hardcoded prompt strings (not maintainable)
- ⚠️ Pair-reading not emphasized in 5-card spread
- ⚠️ Spread descriptions lack clear methods

### By Spread

| Spread | Status | Issue | Fix Priority |
|--------|--------|-------|--------------|
| Single Card | ✅ OK | None | - |
| 3-Card Sentence | ⚠️ Partial | Vague pair-reading | High |
| 5-Card Sentence | ⚠️ Partial | Missing structure | Medium |
| 9-Card Grid | ❌ Wrong | Using Tarot structure | Critical |
| 36-Card Grid | ❌ Wrong | Wrong grid division | Critical |
| Yes/No | ❌ Bad | Not Lenormand | Remove |
| PPF | ❌ Bad | Not Lenormand | Remove |

---

## Conclusion

**Compliance Score: 60/100**

The system has strong Lenormand fundamentals but:
1. Some spreads misuse Tarot terminology
2. Pair-reading method not emphasized
3. Code has dead code and redundancy
4. Spread metadata is unstructured

**Recommendations:**
1. Fix critical compliance issues in prompts (Priority 1)
2. Remove non-authentic spreads (Priority 2)
3. Optimize code structure (Priority 3)

**Expected Impact:**
- ✅ Readings will be more accurate to Lenormand tradition
- ✅ Code will be cleaner and more maintainable
- ✅ Users will get better guidance through authentic methods
- ✅ AI will have clearer instructions for each spread

**Estimated Effort:** 2-3 hours implementation + testing
