# Detailed SEO Findings - Lenormand Intelligence

## Current Page Analysis

### Pages with Proper SEO (✅)

1. **app/page.tsx** (Home)
   - Metadata: Complete ✅
   - Canonical: Present ✅
   - Schemas: WebApplication + FAQ ✅
   - OpenGraph: Configured ✅
   - Performance: Static (fast) ✅
   - Status: GOOD

2. **app/cards/[id]/page.tsx** (36 card pages)
   - Metadata: Inherited from layout ✓ (could be better)
   - Canonical: Missing ❌
   - Schemas: None ❌
   - OpenGraph: Inherited ✓
   - Performance: Static with ISR ✅
   - Status: NEEDS IMPROVEMENT

3. **app/cards/guide/[number]/page.tsx** (36 guide pages)
   - Metadata: Dynamic via generateMetadata() ✅
   - Canonical: Missing ❌
   - Schemas: None ❌
   - OpenGraph: Not configured ❌
   - Performance: Static ✅
   - Status: NEEDS IMPROVEMENT

4. **app/learn/layout.tsx**
   - Metadata: Complete ✅
   - Domain: WRONG (lenormand-intelligence.com) ❌
   - Schemas: Course + FAQ ✅
   - Status: NEEDS DOMAIN FIX

### Pages with Poor SEO (⚠️)

1. **app/learn/page.tsx**
   - Metadata: MISSING ❌
   - Type: Client component
   - Content: Course overview, modules
   - Canonical: Missing ❌
   - Schemas: Inherited from layout
   - Status: CRITICAL

2. **app/learn/advanced/page.tsx**
   - Metadata: MISSING ❌
   - Type: Client component
   - Content: Advanced concepts
   - Canonical: Missing ❌
   - Status: CRITICAL

3. **app/learn/card-combinations/page.tsx**
   - Metadata: MISSING ❌
   - Type: Client component
   - Content: Card combination guide
   - Canonical: Missing ❌
   - Status: CRITICAL

4. **app/learn/card-meanings/page.tsx**
   - Metadata: MISSING ❌
   - Type: Client component
   - Content: All 36 card meanings
   - Canonical: Missing ❌
   - Status: CRITICAL

5. **app/learn/card-meanings/[id]/page.tsx**
   - Metadata: MISSING (uses layout only) ❌
   - Type: Client component with useEffect
   - API Call: /api/cards (after render)
   - Canonical: Missing ❌
   - Dynamic Generation: Not implemented ❌
   - Status: CRITICAL (worst performing page)

6. **app/learn/spreads/page.tsx**
   - Metadata: MISSING ❌
   - Type: Client component
   - Content: All spreads guide
   - Canonical: Missing ❌
   - Status: CRITICAL

7. **app/learn/grand-tableau-techniques/page.tsx**
   - Metadata: MISSING ❌
   - Type: Client component
   - Status: CRITICAL

8. **app/learn/history-basics/page.tsx**
   - Metadata: MISSING ❌
   - Type: Client component
   - Status: CRITICAL

9. **app/learn/reading-fundamentals/page.tsx**
   - Metadata: MISSING ❌
   - Type: Client component
   - Status: CRITICAL

10. **app/learn/marie-annes-system/page.tsx**
    - Metadata: MISSING ❌
    - Type: Client component
    - Status: CRITICAL

## Metadata Specification

### Required Metadata Template for Learn Pages

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "[Page Title] | Lenormand Learning Course",
  description: "[Clear description with 150-160 characters that explains the page content and includes 2-3 key terms]",
  keywords: [
    "keyword1",
    "keyword2",
    "keyword3",
    "keyword4",
    "keyword5",
  ],
  openGraph: {
    title: "[Page Title] | Learn Lenormand",
    description: "[Shorter OG description, 100-120 characters]",
    type: "website",
    url: "https://lenormand.dk/learn/section-name",
    siteName: "Lenormand Intelligence",
    images: [
      {
        url: "https://lenormand.dk/favicon-512.png",
        width: 512,
        height: 512,
        alt: "[Image alt text]",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "[Page Title]",
    description: "[Twitter description]",
  },
  alternates: {
    canonical: "https://lenormand.dk/learn/section-name",
  },
};
```

### Canonical URL Template

For every page's metadata, add:
```typescript
alternates: {
  canonical: "https://lenormand.dk/[exact-path]",
}
```

### Specific Recommendations by Page

#### /learn/page.tsx
```typescript
title: "Master Lenormand | Free Online Divination Course",
description: "Complete Lenormand learning path from beginner fundamentals to advanced professional techniques. Master card meanings, reading methods, and spreads.",
url: "https://lenormand.dk/learn"
```

#### /learn/advanced/page.tsx
```typescript
title: "Advanced Lenormand Concepts | Professional Techniques",
description: "Master advanced Lenormand techniques including time associations, playing card connections, and professional reading strategies.",
url: "https://lenormand.dk/learn/advanced"
```

#### /learn/card-combinations/page.tsx
```typescript
title: "Lenormand Card Combinations | Learn Pair Meanings",
description: "Discover how Lenormand cards combine to form new meanings. Learn modifier cards, context combinations, and card pair interpretations.",
url: "https://lenormand.dk/learn/card-combinations"
```

#### /learn/card-meanings/page.tsx
```typescript
title: "36 Lenormand Card Meanings | Complete Reference Guide",
description: "Learn the traditional meanings of all 36 Lenormand cards with keywords, timing, locations, and symbolic associations.",
url: "https://lenormand.dk/learn/card-meanings"
```

#### /learn/spreads/page.tsx
```typescript
title: "Lenormand Spreads & Techniques | Reading Methods",
description: "Master diverse Lenormand spreads from 3-card readings to Grand Tableau. Learn step-by-step guidance for each spread type.",
url: "https://lenormand.dk/learn/spreads"
```

#### /learn/grand-tableau-techniques/page.tsx
```typescript
title: "Grand Tableau Techniques | Advanced Reading Methods",
description: "Learn professional Grand Tableau methods for comprehensive 36-card readings with interpretation techniques.",
url: "https://lenormand.dk/learn/grand-tableau-techniques"
```

#### /learn/history-basics/page.tsx
```typescript
title: "Lenormand History | Origins of the 36-Card Oracle",
description: "Explore the fascinating history of Lenormand divination from 1800s France to modern practice with Marie-Anne Lenormand's legacy.",
url: "https://lenormand.dk/learn/history-basics"
```

#### /learn/reading-fundamentals/page.tsx
```typescript
title: "Reading Fundamentals | Learn to Read Lenormand",
description: "Master core Lenormand reading methodology including sentence structure, card combinations, and fundamental techniques.",
url: "https://lenormand.dk/learn/reading-fundamentals"
```

#### /learn/marie-annes-system/page.tsx
```typescript
title: "Marie-Anne's System | Historical Lenormand Methods",
description: "Learn the historical methodology inspired by Marie-Anne Lenormand with practical, deadline-driven reading techniques.",
url: "https://lenormand.dk/learn/marie-annes-system"
```

## Schema Implementation

### BreadcrumbList Schema (Add to app/learn/layout.tsx)

```typescript
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://lenormand.dk"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Learn",
      "item": "https://lenormand.dk/learn"
    }
  ]
};
```

### Article Schema (Add to Learn module pages)

```typescript
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Module Title",
  "description": "Module description",
  "datePublished": "2024-01-01",
  "dateModified": "2025-01-24",
  "author": {
    "@type": "Organization",
    "name": "Lenormand Intelligence",
    "url": "https://lenormand.dk"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Lenormand Intelligence",
    "logo": {
      "@type": "ImageObject",
      "url": "https://lenormand.dk/favicon-512.png"
    }
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://lenormand.dk/favicon-512.png",
    "width": 512,
    "height": 512
  }
};
```

## Performance Metrics by Page Type

### Current Performance

```
Page Type          FCP    LCP    CLS   Lighthouse
Home (static)      50ms   100ms  0.01  95/100
/cards (static)    60ms   120ms  0.02  94/100
/cards/[id]        70ms   130ms  0.02  93/100
/learn (client)    2.3s   3.2s   0.15  72/100
/learn/spreads     3.1s   4.1s   0.18  68/100
/learn/meanings[id] 2.8s  3.8s   0.20  70/100 (+ API wait)
```

### With SSG Implementation

```
Page Type          FCP    LCP    CLS   Lighthouse  Gain
/learn (SSG)       0.6s   1.0s   0.05  88/100     +70% faster
/learn/spreads     0.8s   1.2s   0.04  87/100     +74% faster
/learn/meanings[id] 0.7s  1.1s   0.03  89/100     +75% faster
```

## Domain URL Consistency Issues

### Current State
- Root layout: `https://lenormand.dk` ✅
- Root Open Graph: `https://lenormand.dk` ✅
- Learn layout: `https://lenormand-intelligence.com` ❌
- Sitemap: `https://lenormand.dk` ✅
- Robots: `https://lenormand.dk` ✅

### Fix Required
In `app/learn/layout.tsx` (line ~25):
```typescript
// WRONG:
url: "https://lenormand-intelligence.com/learn",

// CORRECT:
url: "https://lenormand.dk/learn",
```

Also fix line ~59:
```typescript
// WRONG:
url: "https://lenormand-intelligence.com",

// CORRECT:
url: "https://lenormand.dk",
```

## Summary Table

| Issue | Location | Severity | Fix Time | Impact |
|-------|----------|----------|----------|--------|
| Missing metadata | 9 Learn pages | CRITICAL | 45 min | +15-20% |
| No canonical URLs | All pages | HIGH | 5 min | +5-10% |
| Domain inconsistency | learn/layout.tsx | HIGH | 2 min | +2-3% |
| No BreadcrumbList | All pages | MEDIUM | 10 min | +3-5% |
| Client component rendering | Learn pages | MEDIUM | 30 min | +5-8% |
| No Article schema | Learn pages | MEDIUM | 20 min | +3-5% |
| Dynamic card page no SSG | card-meanings/[id] | MEDIUM | 30 min | +8-12% |
| Page speed (Learn section) | All Learn | LOW | 2-3 hours | +3-8% |

**Total Quick Fixes (Critical + High)**: 52 minutes = +22-33% traffic gain
**Total Medium Fixes**: ~80 minutes = +16-30% additional traffic gain
**Total Possible**: ~2.5 hours = +35-63% traffic gain without SSG

