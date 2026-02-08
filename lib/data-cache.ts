/**
 * Data Caching Layer
 * 
 * Provides in-memory caching for frequently accessed data (cards, spreads, etc.)
 * with automatic invalidation and TTL support. Dramatically improves performance
 * by reducing repeated file I/O and parsing operations.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // milliseconds, undefined = no expiration
}

export class DataCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(private enableAutoCleanup = true) {
    if (enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Get a value from cache
   * Returns undefined if key not found or entry has expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (useful for monitoring)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Remove expired entries (called periodically if auto-cleanup enabled)
   */
  private removeExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.debug(`[Cache] Removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Start automatic cleanup timer (runs every 60 seconds)
   */
  private startAutoCleanup(): void {
    // Only run in server-side environment
    if (typeof window !== "undefined") {
      return;
    }

    // Cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.removeExpiredEntries();
    }, 60 * 1000);

    // Allow process to exit even with timer running
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get or set pattern - tries cache first, falls back to loader function
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    // Return cached value if exists
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      console.debug(`[Cache] HIT: ${key}`);
      return cached;
    }

    // Load and cache
    console.debug(`[Cache] MISS: ${key}`);
    const data = await loader();
    this.set(key, data, ttlMs);
    return data;
  }

  /**
   * Synchronous version for non-async data
   */
  getOrSetSync<T>(
    key: string,
    loader: () => T,
    ttlMs?: number,
  ): T {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      console.debug(`[Cache] HIT: ${key}`);
      return cached;
    }

    console.debug(`[Cache] MISS: ${key}`);
    const data = loader();
    this.set(key, data, ttlMs);
    return data;
  }
}

// ============================================================================
// Global Cache Instance
// ============================================================================

export const dataCache = new DataCache();

// ============================================================================
// Predefined Cache Keys
// ============================================================================

export const CACHE_KEYS = {
  // Card data
  CARDS_ALL: "cards:all",
  CARD_BY_ID: (id: number) => `card:${id}`,

  // Spread data
  SPREADS_ALL: "spreads:all",
  SPREAD_BY_ID: (id: string) => `spread:${id}`,

  // Learning modules
  LEARNING_MODULES: "learning:modules",
  LEARNING_MODULE: (id: string) => `learning:module:${id}`,

  // Grand tableau houses
  GRAND_TABLEAU_HOUSES: "gt:houses",

  // Configuration
  AI_CONFIG: "config:ai",
  RATE_LIMITS: "config:rate-limits",
} as const;

// ============================================================================
// Cache Statistics (for monitoring)
// ============================================================================

export function getCacheStats() {
  return {
    size: dataCache.size(),
    keys: dataCache.keys(),
    timestamp: new Date().toISOString(),
  };
}

export function logCacheStats() {
  const stats = getCacheStats();
  console.info("[Cache Stats]", {
    entries: stats.size,
    keys: stats.keys,
  });
}
