# SECURITY AUDIT - QUICK FIX GUIDE

## 🚨 CRITICAL - Fix These First (Priority Order)

### Fix #1: Base64 Decoding Validation (20 mins)

**File:** `/lib/data.ts`
**Problem:** Unvalidated data from shared URLs can cause XSS
**Status:** ⚠️ MUST FIX BEFORE DEPLOYMENT

```bash
# Step 1: Add HMAC secret to .env.local
echo "READING_HMAC_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" >> .env.local

# Step 2: Update /lib/data.ts with validation functions
# (See lines 1-150 in SECURITY_AUDIT_REPORT.md for exact code)

# Step 3: Test shared reading URLs still work
npm run dev  # Verify /read/shared/* routes work
```

---

### Fix #2: XSS in Schema Markup (15 mins)

**File:** `/app/layout.tsx` and 8 other files
**Problem:** dangerouslySetInnerHTML could execute injected scripts
**Status:** ⚠️ MUST FIX BEFORE DEPLOYMENT

```typescript
// Before: VULNERABLE
dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}

// After: SAFE
import Script from 'next/script';
<Script
  id="schema-org"
  type="application/ld+json"
  suppressHydrationWarning
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(structuredData)
  }}
/>
```

**Files to update:**

- `/app/layout.tsx` (lines 190, 195)
- `/app/learn/layout.tsx` (line 61)
- `/app/learn/advanced/layout.tsx` (line 56)
- `/app/learn/card-meanings/layout.tsx` (line 56)
- `/app/learn/card-combinations/layout.tsx` (line 56)
- `/app/learn/spreads/layout.tsx` (line 57)
- `/app/learn/reading-fundamentals/layout.tsx` (line 56)
- `/app/learn/marie-annes-system/layout.tsx` (line 56)
- `/app/learn/history-basics/layout.tsx` (line 56)
- `/components/BreadcrumbNav.tsx` (line 34)
- `/app/env-check/page.tsx` (line 183)

---

### Fix #3: API Key Management (45 mins)

**File:** `/app/api/readings/interpret/route.ts`
**Problem:** API key exposed to error logs and potential attacks
**Status:** ⚠️ MUST FIX BEFORE DEPLOYMENT

```bash
# 1. Never log API keys
# 2. Check origin header
# 3. Add CSRF protection

# See CRITICAL #2 remediation in full report
```

---

## 🔴 HIGH - Fix Next (Priority Order)

### High Fix #1: CORS Configuration (10 mins)

**File:** `/middleware.ts` (lines 271-275)

```typescript
// Before: VULNERABLE
response.headers.set("Access-Control-Allow-Origin", "*");

// After: SAFE
const ALLOWED_ORIGINS = ["https://lenormand.dk", "https://www.lenormand.dk"];
const origin = request.headers.get("origin");
if (origin && ALLOWED_ORIGINS.includes(origin)) {
  response.headers.set("Access-Control-Allow-Origin", origin);
}
```

---

### High Fix #2: Rate Limiting Hash (10 mins)

**File:** `/middleware.ts` (lines 88-104)

```typescript
// Before: WEAK HASH
let hash = 0;
for (let i = 0; i < combined.length; i++) {
  hash = ((hash << 5) - hash + char) & 0xffffffff;
}

// After: STRONG HASH
import crypto from "crypto";
const hash = crypto
  .createHash("sha256")
  .update(combined)
  .digest("hex")
  .slice(0, 16);
```

---

### High Fix #3: Stream Error Handling (15 mins)

**File:** `/app/read/new/page.tsx` (lines 262-330)

```typescript
// Add finally block to cleanup reader
try {
  // ... existing code ...
} finally {
  if (reader) {
    try {
      await reader.cancel();
    } catch (e) {
      console.error("Reader cancel error:", e);
    }
  }
}
```

---

### High Fix #4: Input Validation (20 mins)

**File:** `/app/read/new/page.tsx` (lines 394-436)

```typescript
// Add size limit
const MAX_INPUT_SIZE = 1000;
if (input.length > MAX_INPUT_SIZE) {
  setPhysicalCardsError("Input too long");
  return [];
}

// Create lookup maps for O(1) instead of O(n)
const cardByNumber = new Map(allCards.map((c) => [c.id, c]));
```

---

### High Fix #5: CSRF Protection (30 mins)

**File:** `/app/api/readings/interpret/route.ts`

```typescript
// Check origin header
const origin = headersList.get("origin");
if (!origin?.includes(allowedOrigin)) {
  return new Response(JSON.stringify({ error: "Invalid origin" }), {
    status: 403,
  });
}

// TODO: Add CSRF token verification
const csrfToken = headersList.get("x-csrf-token");
if (!csrfToken) {
  return new Response(JSON.stringify({ error: "Missing CSRF token" }), {
    status: 403,
  });
}
```

---

## 🟠 MEDIUM - Fix After Critical/High

### Medium Fix #1: CSP Headers (5 mins)

**File:** `/middleware.ts` (lines 232-242)

```typescript
// Remove 'unsafe-eval' and 'unsafe-inline'
// Use separate CSS files instead of inline styles
// Use external scripts instead of eval()
```

### Medium Fix #2: Dependencies (10 mins)

**Command:**

```bash
npm audit fix --force
npm install lodash@latest prisma@latest
npm audit  # Verify no remaining vulnerabilities
```

### Medium Fix #3: TypeScript Strict Mode (5 mins)

**File:** `/tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

---

## ✅ EXECUTION CHECKLIST

### Day 1 - Critical Fixes (2-3 hours)

- [ ] Fix #1: Base64 validation (20 min)
- [ ] Fix #2: XSS in schemas (15 min)
- [ ] Fix #3: API key handling (45 min)
- [ ] Test all features work

### Day 2 - High Priority Fixes (1.5-2 hours)

- [ ] High #1: CORS configuration (10 min)
- [ ] High #2: Rate limiting hash (10 min)
- [ ] High #3: Stream cleanup (15 min)
- [ ] High #4: Input validation (20 min)
- [ ] High #5: CSRF protection (30 min)
- [ ] Run full test suite

### Day 3 - Medium Fixes (30 mins)

- [ ] Medium #1: CSP headers (5 min)
- [ ] Medium #2: Update dependencies (10 min)
- [ ] Medium #3: TypeScript strict mode (5 min)
- [ ] Fix any TypeScript errors

### Day 4 - Testing & Verification

- [ ] Run `npm run build` - verify no errors
- [ ] Run unit tests - verify all pass
- [ ] Manual security testing
- [ ] Final review before deployment

---

## 🧪 TESTING AFTER FIXES

```bash
# Build test
npm run build

# Type checking
npx tsc --noEmit

# Audit
npm audit

# Unit tests
npm test

# E2E tests (if available)
npm run test:e2e
```

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All CRITICAL findings fixed and tested
- [ ] All HIGH findings fixed and tested
- [ ] All MEDIUM findings fixed
- [ ] `npm audit` shows 0 vulnerabilities
- [ ] `npm run build` succeeds with no errors
- [ ] All tests pass
- [ ] Security headers verified
- [ ] CORS properly configured
- [ ] API keys in .env.local (NOT committed)
- [ ] HTTPS enabled
- [ ] Rate limiting working

---

## ⚡ QUICK WINS SUMMARY

| Priority | Issue             | File             | Time   |
| -------- | ----------------- | ---------------- | ------ |
| 1        | Base64 validation | `/lib/data.ts`   | 20 min |
| 2        | XSS in schemas    | 11 files         | 15 min |
| 3        | API key handling  | `/app/api/*`     | 45 min |
| 4        | CORS config       | `/middleware.ts` | 10 min |
| 5        | Hash function     | `/middleware.ts` | 10 min |
| 6        | Stream cleanup    | `/app/read/new`  | 15 min |

**Total Time: ~2 hours for most critical issues**

---

## 🆘 IF YOU GET STUCK

1. **Consult full report:** `SECURITY_AUDIT_REPORT.md`
2. **Look at code examples:** Each fix has working code
3. **Test incrementally:** Fix one issue, run tests, commit
4. **Keep git history:** So you can revert if needed

---

## 📞 NEED HELP?

- Full detailed report: `SECURITY_AUDIT_REPORT.md`
- Code examples provided for every fix
- All file locations documented
- Estimated time for each fix provided

---

**Status:** Ready to fix  
**Estimated Total Time:** 4-5 hours  
**Expected Outcome:** Production-ready security posture
