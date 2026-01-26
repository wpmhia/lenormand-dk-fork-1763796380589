# Detailed Performance Bottleneck Breakdown

## Quick Reference Table

| Issue | Severity | File | Lines | Type | Impact |
|-------|----------|------|-------|------|--------|
| Missing lazy loading on images | HIGH | app/cards/CardsClient.tsx | 249-267 | Image Loading | 250KB+ transfer |
| Multiple state updates per keystroke | HIGH | app/cards/CardsClient.tsx | 69-92 | State Mgmt | Sluggish search |
| O(n) card lookup function | MEDIUM | app/cards/[id]/CardDetailClient.tsx | 48-49 | Algorithm | 15-30 searches per render |
| Redundant useEffect state sync | MEDIUM | app/cards/CardsClient.tsx | 130-138 | React Pattern | Extra renders |
| Missing Cache-Control headers | MEDIUM | middleware.ts | 138-155 | Caching | Browser may re-fetch |
| Inefficient modal navigation | LOW | app/cards/CardsClient.tsx | 150-159 | Algorithm | O(n) search per direction |

---

## Issue-by-Issue Analysis with Code

### 1. MISSING LAZY LOADING ON CARD GRID (HIGH SEVERITY)

**File:** `/home/user/project/app/cards/CardsClient.tsx`  
**Lines:** 249-267  
**Type:** Image Loading Strategy  
**Problem:** All 36 card images (250KB total) load eagerly, not lazily

```typescript
// Current implementation - ALL images load immediately
<div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
  {filteredCards.map((card) => (
    <div
      key={card.id}
      className="group cursor-pointer"
      onClick={() => openCardModal(card)}
    >
      <Card
        card={card}
        size="sm"
        className="mx-auto transition-transform group-hover:scale-105"
        // ⚠️ Missing loading="lazy" prop
      />
      <div className="mt-2 text-center">
        <div className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {card.name}
        </div>
        <div className="text-xs text-muted-foreground">#{card.id}</div>
      </div>
    </div>
  ))}
</div>
```

**Related File:** `/home/user/project/components/Card.tsx` (Lines 82-89)
- Card component receives `loading` prop but doesn't use it in `<Image>` tag
- Current: `<Image src={card.imageUrl} alt={card.name} width={200} height={300} />`
- Missing: `loading="lazy"` attribute

**Impact:**
- 36 images × ~7KB = 250KB unnecessary transfer on page load
- Network waterfall prevents lazy rendering
- Mobile users see slower TTI (Time To Interactive)
- Images below fold still fetch eagerly

**Data:** `/home/user/project/public/images/cards/` contains 36 PNG files (312KB total)

---

### 2. MULTIPLE STATE UPDATES ON EVERY KEYSTROKE (HIGH SEVERITY)

**File:** `/home/user/project/app/cards/CardsClient.tsx`  
**Lines:** 69-92, 95-127, 129-138  
**Type:** State Management Pattern  
**Problem:** Search input causes 2+ state updates before debounce timer fires

```typescript
// Line 69-75: State declarations
const [filteredCards, setFilteredCards] = useState<CardType[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
const [sortBy, setSortBy] = useState<"number" | "name">("number");
const [selectedCategory, setSelectedCategory] = useState("all");
const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const debounceTimeoutRef = useRef<NodeJS.Timeout>();

// Line 205-210: Input handler
<Input
  placeholder="Search cards..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}  // ⚠️ Updates state immediately
  className="pl-10"
/>

// Line 78-92: Debounce effect - SETS STATE AGAIN
useEffect(() => {
  if (debounceTimeoutRef.current) {
    clearTimeout(debounceTimeoutRef.current);
  }
  
  debounceTimeoutRef.current = setTimeout(() => {
    setDebouncedSearchTerm(searchTerm);  // ⚠️ Second state update
  }, 300);

  return () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };
}, [searchTerm]);

// Line 95-127: Filtering with memoized result
const filteredCardsMemo = useMemo(() => {
  let filtered = cards;

  if (debouncedSearchTerm) {
    const searchLower = debouncedSearchTerm.toLowerCase();
    filtered = filtered.filter((card) => {
      const nameMatch = card.name.toLowerCase().includes(searchLower);
      const keywordMatch = card.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchLower),
      );
      const meaningMatch = card.uprightMeaning
        .toLowerCase()
        .includes(searchLower);
      return nameMatch || keywordMatch || meaningMatch;
    });
  }
  // ... more filtering logic
  return filtered;
}, [cards, debouncedSearchTerm, sortBy, selectedCategory]);

// Line 130-138: SYNCS MEMOIZED VALUE TO STATE - REDUNDANT!
useEffect(() => {
  setFilteredCards(filteredCardsMemo);  // ⚠️ Third state update
}, [filteredCardsMemo]);

// Line 135-138: Separate initialization effect - stale closure
useEffect(() => {
  setFilteredCards(filteredCardsMemo);  // ⚠️ Uses stale value
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);  // Empty deps = stale closure!
```

**Render Waterfall on Single Keystroke:**
1. User types 1 character
2. `setSearchTerm()` → Component renders
3. `setDebouncedSearchTerm()` fires after 300ms → Component renders again
4. `setFilteredCards()` fires → Component renders third time
5. Grid re-renders with filtered results

**Impact:**
- 3+ state updates per keystroke
- Grid re-renders multiple times for single user input
- Feels sluggish/unresponsive on slower devices
- 36 card filter happens 2-3x per keystroke during debounce period

---

### 3. O(N) CARD LOOKUP IN COMBO SECTION (MEDIUM SEVERITY)

**File:** `/home/user/project/app/cards/[id]/CardDetailClient.tsx`  
**Lines:** 48-49  
**Type:** Algorithm Inefficiency  
**Problem:** Uses `.find()` multiple times for same card lookups

```typescript
// CardDetailClient.tsx - Line 48-49
const getCardName = (id: number) =>
  allCards.find((c) => c.id === id)?.name || `Card ${id}`;
```

**How It's Used:** In `CardDetailSections.tsx` (ComboSection component)

```typescript
// CardDetailSections.tsx - Line 189-195, 209-217
export function ComboGrid({
  combos,
  getCardName,
  searchTerm = "",
}: ComboGridProps) {
  if (!combos || combos.length === 0) return null;

  const filteredCombos = searchTerm
    ? combos.filter((combo) =>
        getCardName(combo.withCardId)  // ⚠️ O(n) search
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      )
    : combos;

  if (filteredCombos.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredCombos.map((combo) => (
        <CardComboItem
          key={combo.withCardId}
          relatedCardId={combo.withCardId}
          relatedCardName={getCardName(combo.withCardId)}  // ⚠️ O(n) search PER COMBO
          meaning={combo.meaning}
        />
      ))}
    </div>
  );
}
```

**The Waterfall:**
- Card detail page has 15-20+ combos
- Each combo calls `getCardName(cardId)` which searches through 36 cards
- Total searches per render: 20 × 36 = 720 array iterations
- Search filtering adds another layer of lookups

**Impact:**
- Combo section rendering is slower than necessary
- Multiple re-renders compound the O(n) lookups
- Doesn't affect page load (combos loaded after initial render) but affects interactions

**Good Pattern Exists:** `/home/user/project/app/cards/CardsClient.tsx` (Lines 62-66) already creates a Map
```typescript
const cardsMap = useMemo(() => {
  const map = new Map<number, CardType>();
  cards.forEach(card => map.set(card.id, card));
  return map;
}, [cards]);
```

---

### 4. REDUNDANT STATE SYNCING (MEDIUM SEVERITY)

**File:** `/home/user/project/app/cards/CardsClient.tsx`  
**Lines:** 130-138  
**Type:** React Pattern Antipattern  
**Problem:** Duplicating memoized value in state, then syncing with effect

```typescript
// GOOD - Memoized computation
const filteredCardsMemo = useMemo(() => {
  let filtered = cards;
  // ... filtering logic
  return filtered;
}, [cards, debouncedSearchTerm, sortBy, selectedCategory]);

// BAD - Unnecessary state + sync effect
const [filteredCards, setFilteredCards] = useState<CardType[]>([]);

useEffect(() => {
  setFilteredCards(filteredCardsMemo);  // ⚠️ Syncs memo to state
}, [filteredCardsMemo]);

useEffect(() => {
  setFilteredCards(filteredCardsMemo);  // ⚠️ Duplicate initialization
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);  // ⚠️ Empty deps = stale closure
```

**Why This Is Bad:**
- State and memoized value do same thing
- Creates extra render on every dependency change
- Initialization effect has stale closure (references old `filteredCardsMemo`)
- Component could just use `filteredCardsMemo` directly instead of state

**Correct Pattern:**
```typescript
const filteredCards = filteredCardsMemo;  // Direct assignment, no state needed
```

**Impact:**
- Extra re-render on mount and every filter change
- Violates React optimization patterns
- Makes code harder to trace/debug

---

### 5. MISSING CACHE-CONTROL HEADERS (MEDIUM SEVERITY)

**File:** `/home/user/project/middleware.ts`  
**Lines:** 138-155, 200-266  
**Type:** HTTP Caching  
**Problem:** No explicit Cache-Control headers for static assets

```typescript
// middleware.ts - Lines 138-155
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip rate limiting but still should set cache headers
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/data') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/health') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2')
  ) {
    return NextResponse.next();  // ⚠️ No cache headers set!
  }

  // ... rest of middleware
  
  // Line 200+: Only headers set are security headers, not cache headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // ... but NO Cache-Control headers for static assets
}
```

**Missing Headers:**
```
Cache-Control: public, max-age=31536000, immutable  // For hashed assets
Cache-Control: public, max-age=3600                 // For images
Cache-Control: public, max-age=86400                // For JSON data
```

**Data Files Not Optimized:**
- `/public/data/cards.json` (220KB) - No explicit cache header
- `/public/images/cards/*.png` (36 × 7KB) - No explicit cache header
- Pages generated by ISR - No Cache-Control headers

**Impact:**
- Browser may re-validate cache on every request
- CDN may not cache aggressively
- Repeat visitors may re-download static assets
- Less critical than other issues (browsers cache by default) but non-optimal

---

### 6. INEFFICIENT MODAL NAVIGATION (LOW SEVERITY)

**File:** `/home/user/project/app/cards/CardsClient.tsx`  
**Lines:** 150-159  
**Type:** Algorithm  
**Problem:** Linear search to find current card index

```typescript
const navigateCard = (direction: "prev" | "next") => {
  if (!selectedCard) return;
  
  const currentIndex = filteredCards.findIndex(  // ⚠️ O(n) search
    (c) => c.id === selectedCard.id,
  );
  
  let newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
  if (newIndex < 0) newIndex = filteredCards.length - 1;
  if (newIndex >= filteredCards.length) newIndex = 0;
  
  setSelectedCard(filteredCards[newIndex]);
};
```

**Impact:**
- Called when user clicks Previous/Next in modal
- 36 cards max, so only 36 iterations max
- Negligible performance impact
- Only when modal is open (not on initial page load)

**Could be optimized by:**
```typescript
const filteredCardsMap = useMemo(() => {
  const map = new Map<number, number>();  // Card ID -> Index
  filteredCards.forEach((card, index) => map.set(card.id, index));
  return map;
}, [filteredCards]);

const navigateCard = (direction: "prev" | "next") => {
  if (!selectedCard) return;
  const currentIndex = filteredCardsMap.get(selectedCard.id) ?? -1;
  // ...
};
```

---

### 7. IMAGE SIZING MISMATCH (MEDIUM SEVERITY)

**File:** `/home/user/project/components/Card.tsx`  
**Lines:** 82-89  
**Type:** Image Optimization  
**Problem:** Fixed width/height don't match actual rendered sizes

```typescript
const sizeClasses = {
  sm: "w-20 h-32 text-xs",      // 80px × 128px
  md: "w-28 h-40 text-sm sm:text-base",   // 112px × 160px
  lg: "w-36 h-52 text-base",     // 144px × 208px
};

// But Image component always uses:
<Image
  src={card.imageUrl || ""}
  alt={card.name}
  width={200}      // ⚠️ Fixed, doesn't match sm/md/lg
  height={300}
  className="h-full w-full object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Issue:**
- Next.js Image component generates multiple sizes based on `width`/`height`
- But actual rendered sizes are `80px`, `112px`, or `144px`
- `sizes` prop doesn't match the actual responsive breakpoints
- Next.js may generate wrong-sized images

**Correct Approach:**
```typescript
<Image
  src={card.imageUrl || ""}
  alt={card.name}
  fill  // Instead of fixed width/height
  className="h-full w-full object-cover"
  sizes={size === "sm" ? "80px" : size === "md" ? "112px" : "144px"}
/>
```

**Impact:** Medium - generates non-optimal images, but modern Next.js handles gracefully

---

## Summary By Component

### `/app/cards/page.tsx`
- **Issue:** Full JSON data load
- **Severity:** Medium
- **Fix:** Lazy load combo data separately

### `/app/cards/CardsClient.tsx` ⚠️ HIGHEST IMPACT
- **Issues:** 
  - Missing lazy loading (HIGH)
  - Multiple state updates (HIGH)
  - Redundant useEffect (MEDIUM)
  - Inefficient navigation search (LOW)
- **Total Lines:** 385
- **Affected Users:** Every card list visitor

### `/app/cards/[id]/page.tsx`
- **Issue:** Linear search in getCardById
- **Severity:** Low (only 36 cards)
- **Fix:** Already cached via SSG

### `/app/cards/[id]/CardDetailClient.tsx` ⚠️ HIGH IMPACT
- **Issue:** O(n) card lookup function
- **Severity:** Medium
- **Fix:** Implement Map-based lookup

### `/components/Card.tsx`
- **Issues:**
  - Missing loading="lazy" support (HIGH)
  - Image sizing mismatch (MEDIUM)
- **Total Lines:** 106
- **Used by:** Both CardsClient and CardDetailClient

### `/components/CardDetailSections.tsx`
- **Issue:** Uses inefficient getCardName function
- **Severity:** Medium
- **Fix:** Pass cardsMap instead of function

### `/lib/data.ts`
- **Issue:** No optimizations for card data
- **Severity:** Low
- **Used by:** Page.tsx and [id]/page.tsx

### `/middleware.ts`
- **Issue:** No Cache-Control headers
- **Severity:** Low-Medium
- **Total Lines:** 271

---

## Performance Testing Recommendations

Run lighthouse with:
```bash
npm run build && npm start
# Then test at http://localhost:3000/cards
```

Key metrics to measure:
- **LCP (Largest Contentful Paint)** - Should be <2.5s
- **FID (First Input Delay)** - Should be <100ms
- **CLS (Cumulative Layout Shift)** - Should be <0.1
- **TTI (Time To Interactive)** - Should be <3.8s

