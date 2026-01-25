import { LRUCache } from 'lru-cache'

/**
 * Response Cache Manager
 * 
 * Implements a two-tier caching strategy:
 * 1. In-memory LRU cache for fast retrieval
 * 2. Request deduplication to prevent thundering herd
 * 
 * Cache TTL: 6 hours (balances uniqueness + performance)
 * Max entries: 1000 (each ~1-5KB, total ~5-10MB)
 */

interface CacheParams {
  question: string
  cardIds: number[]
  spreadId: string
}

interface CachedResponse {
  content: string
  timestamp: number
  hits: number
}

// In-memory LRU cache: 1000 entries × ~3KB avg = ~3MB
const cache = new LRUCache<string, CachedResponse>({
  max: 1000,
  ttl: 1000 * 60 * 60 * 6, // 6 hours
  updateAgeOnGet: true,
  allowStale: false,
})

// Track in-flight requests to prevent thundering herd
const inFlightRequests = new Map<string, Promise<string>>()

// Cache statistics for monitoring
export interface CacheStats {
  size: number
  maxSize: number
  hitCount: number
  missCount: number
  deduplicationCount: number
  hitRate: number
}

let hitCount = 0
let missCount = 0
let deduplicationCount = 0

/**
 * Generate consistent cache key from request parameters
 * Normalizes question for better matching
 */
function generateCacheKey(params: CacheParams): string {
  // Normalize question: lowercase, trim, remove extra spaces
  const normalizedQuestion = params.question
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 200) // Limit to 200 chars for key size

  // Sort card IDs for consistent key regardless of order
  const cardsKey = params.cardIds.sort((a, b) => a - b).join(',')

  // Combine into cache key
  return `${params.spreadId}:${cardsKey}:${normalizedQuestion}`
}

/**
 * Get or generate interpretation with caching + deduplication
 * 
 * Strategy:
 * 1. Check memory cache (sub-millisecond)
 * 2. Check in-flight requests (deduplication)
 * 3. Generate new response if needed
 * 4. Cache result for 6 hours
 */
export async function getInterpretationWithCache<T>(
  params: CacheParams,
  generateFn: () => Promise<T>
): Promise<T> {
  const key = generateCacheKey(params)

  // 1. Check in-memory cache (fastest path)
  const cached = cache.get(key)
  if (cached) {
    cached.hits++
    hitCount++
    return cached.content as T
  }

  // 2. Check if request is already in flight (deduplication)
  if (inFlightRequests.has(key)) {
    deduplicationCount++
    return inFlightRequests.get(key)! as Promise<T>
  }

  // 3. Generate new response
  missCount++
  const promise = (async () => {
    try {
      const content = await generateFn()

      // Store in cache
      cache.set(key, {
        content: typeof content === 'string' ? content : JSON.stringify(content),
        timestamp: Date.now(),
        hits: 0,
      })

      return content
    } finally {
      // Remove from in-flight tracking
      inFlightRequests.delete(key)
    }
  })()

  // Track this request as in-flight
  inFlightRequests.set(key, promise as any)

  return promise
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): CacheStats {
  const totalRequests = hitCount + missCount
  const hitRate = totalRequests > 0 ? (hitCount / totalRequests) * 100 : 0

  return {
    size: cache.size,
    maxSize: cache.max,
    hitCount,
    missCount,
    deduplicationCount,
    hitRate: Math.round(hitRate * 100) / 100,
  }
}

/**
 * Clear cache (useful for testing or manual reset)
 */
export function clearCache(): void {
  cache.clear()
  inFlightRequests.clear()
  hitCount = 0
  missCount = 0
  deduplicationCount = 0
}

/**
 * Reset statistics without clearing cache
 */
export function resetStats(): void {
  hitCount = 0
  missCount = 0
  deduplicationCount = 0
}
