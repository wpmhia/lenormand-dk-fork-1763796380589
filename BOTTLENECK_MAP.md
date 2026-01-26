# Visual Performance Bottleneck Map

## Request Flow and Bottleneck Points

```
USER VISITS /cards
│
├─ Server Component: page.tsx
│  │
│  ├─ getCards() → imports /public/data/cards.json (220KB)
│  │  └─ [Issue #1] Full JSON parse (Medium severity)
│  │
│  └─ Renders CardsClient with initialCards
│
└─ Client Component: CardsClient.tsx ⚠️ HIGHEST IMPACT
   │
   ├─ State: searchTerm, debouncedSearchTerm, filteredCards
   │  └─ [Issue #2] 3 state updates per keystroke (HIGH)
   │  └─ [Issue #3] Redundant useEffect sync (MEDIUM)
   │
   ├─ Effect: Debounce search input (300ms delay)
   │  └─ Triggers 3+ state updates before render
   │
   ├─ Render: Grid with 36 cards
   │  │
   │  └─ <Card> component for each card
   │     │
   │     └─ Image component ⚠️ IMAGE BOTTLENECK
   │        ├─ [Issue #4] No loading="lazy" (HIGH)
   │        │  → 36 images × 7KB = 250KB loads immediately
   │        │
   │        └─ [Issue #5] Fixed width/height mismatch (MEDIUM)
   │           → Size {200} × {300} doesn't match sm/md/lg
   │
   ├─ Modal: Card detail in dialog
   │  │
   │  └─ Navigation buttons
   │     └─ [Issue #6] findIndex() search per click (LOW)
   │        → O(n) search on 36 items
   │
   └─ Search interaction
      └─ User types character
         → setSearchTerm() + debounce + setFilteredCards() + render grid
            = 3 state updates + multiple re-renders per keystroke
```

## User Visits /cards/[id] Detail Page

```
USER VISITS /cards/1
│
├─ Build Time: generateStaticParams() ✓ GOOD
│  └─ Pre-generates all 36 pages at build time
│
├─ Server Component: page.tsx ✓ GOOD
│  │
│  ├─ Revalidate: 3600 seconds (1 hour ISR)
│  │
│  └─ getCardById(cards, id) → Linear search (only 36 items, acceptable)
│
└─ Client Component: CardDetailClient.tsx ⚠️ MEDIUM IMPACT
   │
   ├─ getCardName function (Line 48-49)
   │  └─ [Issue #7] O(n) lookup: allCards.find() (MEDIUM)
   │
   ├─ Render: Card image
   │  │
   │  └─ Image with priority=true ✓ GOOD
   │     └─ Correctly marked as LCP element
   │
   ├─ Render: Combos section
   │  │
   │  └─ Map combos (15-20 items)
   │     │
   │     └─ CardComboItem component
   │        │
   │        └─ Call getCardName() for each combo
   │           └─ [Issue #7] 15-20 × O(n) searches per render
   │              = ~720 array iterations
   │
   └─ CardDetailSections.tsx (ComboSection)
      │
      ├─ ComboGrid/ComboList components
      │  │
      │  └─ Filter combos with search
      │     └─ [Issue #7] Extra O(n) lookups during search
      │
      └─ Pass getCardName function to children
         └─ [Issue #7] Called for every combo render
```

## Component Tree with Bottlenecks

```
page.tsx (/cards)
│
├─ CardsClient [Client Component] ⚠️ MAIN BOTTLENECK
│  │
│  ├─ Input: Search field
│  │  └─ [Issue #2] onChange → 3 state updates per keystroke
│  │
│  ├─ Select: Category filter
│  │  └─ [Issue #2] Triggers filter computation
│  │
│  ├─ Buttons: Sort by number/name
│  │  └─ [Issue #2] Triggers filter computation
│  │
│  ├─ Grid: 36 cards
│  │  │
│  │  └─ Card [Shared Component] ⚠️ IMAGE BOTTLENECK
│  │     │
│  │     └─ Image
│  │        ├─ [Issue #4] Missing loading="lazy"
│  │        │  → 250KB+ unnecessary transfer
│  │        │
│  │        └─ [Issue #5] Wrong dimensions passed
│  │           → width={200} height={300} for sm/md/lg sizes
│  │
│  └─ Dialog: Modal with card preview
│     │
│     └─ Card [Shared Component]
│        │
│        └─ Image (with priority) ✓ GOOD
│
└─ Navigation: Previous/Next buttons
   └─ [Issue #6] findIndex() per click → O(n)


page.tsx (/cards/[id])
│
└─ CardDetailClient [Client Component] ⚠️ LOOKUP BOTTLENECK
   │
   ├─ Image: Card image
   │  └─ [Issue #4] Missing lazy load on modal images
   │
   ├─ Tabs: Overview/Meanings/Combinations
   │  │
   │  └─ Combinations Tab
   │     │
   │     └─ ComboSection [From CardDetailSections.tsx]
   │        │
   │        ├─ Input: Search combos
   │        │  └─ [Issue #7] getCardName() per combo
   │        │
   │        └─ ComboGrid/ComboList
   │           │
   │           └─ CardComboItem (15-20 items)
   │              │
   │              └─ [Issue #7] getCardName() call
   │                 → O(n) search through 36 cards
   │                 → ~720 iterations if 20 combos
   │
   └─ getCardName: O(n) lookup function
      └─ allCards.find((c) => c.id === id)
         └─ [Issue #7] Called per combo + search filtering
```

## Middleware Processing

```
middleware.ts

Request arrives
│
├─ Rate limiting check ✓ GOOD
│  └─ Efficient, only for non-static paths
│
├─ Static asset bypass
│  │
│  └─ Paths skipped:
│     ├─ /_next/* ✓
│     ├─ /images/* 
│     ├─ /data/*
│     ├─ *.png, *.jpg, *.webp
│     └─ [Issue #8] ⚠️ NO Cache-Control headers set
│        → Browser may not cache aggressively
│        → Repeat visitors may re-download assets
│
└─ Security headers ✓ GOOD
   ├─ X-Content-Type-Options
   ├─ X-XSS-Protection
   ├─ CSP headers
   └─ [Missing] Cache-Control headers

Missing:
  Cache-Control: public, max-age=31536000, immutable  // hashed assets
  Cache-Control: public, max-age=3600                 // images
  Cache-Control: public, max-age=86400                // JSON
```

## Data Flow Diagram

```
FIRST LOAD (/cards)
┌─────────────────────────────────────────┐
│ Browser                                 │
│  (empty cache)                          │
└────────────────┬────────────────────────┘
                 │ GET /cards
                 ▼
┌─────────────────────────────────────────┐
│ Server                                  │
│  - Generate static page (at build)      │
│  - Execute page.tsx                     │
│  - Call getCards() → import JSON        │
│  └─ [Issue #1] 220KB JSON parse        │
└────────────────┬────────────────────────┘
                 │ Response: HTML + JSON data
                 ▼
┌─────────────────────────────────────────┐
│ Browser                                 │
│  - Parse HTML                           │
│  - Execute JavaScript                   │
│  - Hydrate React components             │
│  - Render grid with 36 cards            │
│  └─ [Issue #4] Load ALL 36 images       │
│     ├─ 36 images × 7KB = 250KB         │
│     └─ Network waterfall                │
└──────────────────────────────────────────┘

Timeline:
0ms   ┼─ Request
      │
100ms ├─ Server processing
      │
150ms ├─ Receive HTML (32KB)
      │
200ms ├─ Start loading images (if lazy: stop here)
      │
400ms ├─ Receive JSON in HTML (220KB)
      │
600ms ├─ React hydration
      │
700ms ├─ Grid render
      │
1200ms├─ All 36 images loaded (if eager)
      │
1500ms├─ Time to Interactive (TTI)
      └─


AFTER TYPING IN SEARCH (Current - Bad)
┌─────────────────────────────────────────┐
│ User types "Sun"                        │
│ Character 1: 'S'                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ setSearchTerm('S')│  ← Update 1
         └───────┬───────────┘
                 │ Render (with 'S')
                 ▼
         ┌───────────────────────┐
         │ Debounce starts (300ms)
         │ Waiting...            │
         └───────────────────────┘
                 │
Character 2: 'u' │
                 ▼
         ┌────────────────────┐
         │ setSearchTerm('Su')│  ← Update 1 again
         └────────┬───────────┘
                  │ Render (with 'Su')
                  │
                  ├─ Debounce resets (300ms)
                  │ Waiting...
                  │
Character 3: 'n' │
                 ▼
         ┌─────────────────────┐
         │ setSearchTerm('Sun')│  ← Update 1 again
         └────────┬────────────┘
                  │ Render (with 'Sun')
                  │
                  ├─ Debounce resets (300ms)
                  │ Waiting...
                  │
         (User stops typing)
                  │
                  ├─ 300ms passes...
                  ▼
         ┌──────────────────────────┐
         │setDebouncedSearchTerm... │  ← Update 2
         └────────┬─────────────────┘
                  │ Trigger useMemo
                  │ Filter cards
                  ▼
         ┌──────────────────────────┐
         │ setFilteredCards(filtered)│  ← Update 3
         └────────┬─────────────────┘
                  │ Render with filtered grid
                  ▼
         ┌──────────────────────────┐
         │ Show 2 matching cards    │
         │ (Sun card, etc.)         │
         └──────────────────────────┘

Total: 5+ renders for 3 characters!
With [Issue #3] redundant sync: Even more!


AFTER TYPING IN SEARCH (Optimal - If Fixed)
┌─────────────────────────────────────────┐
│ User types "Sun"                        │
│ Character 1: 'S'                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
         ┌───────────────────┐
         │ setSearchTerm('S')│
         └───────┬───────────┘
                 │ Debounce starts (300ms)
                 │
Character 2: 'u' │
                 ▼
         ┌────────────────────┐
         │ setSearchTerm('Su')│  ← Only state update
         │ Debounce resets    │
         │                    │
Character 3: 'n' │
                 ▼
         ┌─────────────────────┐
         │ setSearchTerm('Sun')│  ← Only state update
         │ Debounce resets     │
         │                     │
         (User stops typing)    │
                 │              │
                 ├─ 300ms passes │
                 ▼              │
         ┌──────────────────────┐
         │ setDebouncedSearchTerm
         │ useMemo computes
         │ Render with filtered cards
         └──────────────────────┘

Total: 2 renders for 3 characters!
(One for input, one for debounce)
```

## File Dependency Graph

```
                    ┌─────────────────┐
                    │ middleware.ts   │
                    │ [Issue #8]      │
                    │ No cache headers│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   /images/cards/    /data/cards.json      /api/routes
   [Issue #4]        [Issue #1]
   No lazy load       Full parse


    ┌──────────────────┐
    │ lib/data.ts      │
    │ [Issue #1]       │
    │ getCards()       │
    │ getCardById()    │
    └────────┬─────────┘
             │
   ┌─────────┴──────────┐
   │                    │
   ▼                    ▼
page.tsx          [id]/page.tsx
(/cards)          (/cards/[id])


    ┌─────────────────────────────────────────────┐
    │ app/cards/CardsClient.tsx                   │
    │ [Issues #2, #3, #4, #6]                    │
    │ - State management                         │
    │ - Missing lazy load                        │
    │ - Redundant sync                           │
    │ - Modal navigation O(n)                    │
    └───────────┬─────────────────────────────────┘
                │
                ▼
    ┌─────────────────────────────────────────────┐
    │ components/Card.tsx                        │
    │ [Issues #4, #5]                           │
    │ - Missing loading prop                    │
    │ - Image sizing mismatch                   │
    │ - Fixed width/height                      │
    └────────────────────────────────────────────┘


    ┌────────────────────────────────────────────────┐
    │ app/cards/[id]/CardDetailClient.tsx           │
    │ [Issue #7]                                    │
    │ - O(n) getCardName function                  │
    │ - Line 48-49                                 │
    └────────────┬─────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────────────┐
    │ components/CardDetailSections.tsx             │
    │ [Issue #7]                                    │
    │ - ComboSection uses getCardName              │
    │ - Calls for each combo                       │
    │ - 15-20 calls × O(n) = 720 iterations       │
    └────────────────────────────────────────────────┘
```

## Impact Heatmap

```
               LOW        MEDIUM         HIGH
START            │          │            │
                 │          │            │
PAGE LOAD ───────┼──────────┼────────────┼─────────────────
(First Paint)    │          │            │
                 │    [#5]  │ [#1] [#4]  │ Missing lazy load
                 │    Image │ Issue:     │ 250KB images
                 │    size  │ 250KB      │
                 │          │ transfer   │
                 │          │            │
INTERACTION ─────┼──────────┼────────────┼─────────────────
(Search)         │  [#6]    │ [#2] [#3]  │ State mgmt
(Modal nav)      │  Modal   │ [#7] O(n)  │ Sluggish
(Combos)         │  search  │ lookups    │ response
                 │  O(n)    │            │
                 │          │            │
CACHING ─────────┼──────────┼────────────┼─────────────────
(Repeat visits)  │          │ [#8]       │
                 │          │ Missing    │
                 │          │ Cache-     │
                 │          │ Control    │
```

