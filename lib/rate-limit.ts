// Rate limiter with Redis support (falls back to in-memory)
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAccess: number; // For LRU eviction
}

const ipCache = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
const MAX_CACHE_SIZE = 10000; // Maximum entries to prevent memory exhaustion

// Note: In serverless/Edge environments, setInterval persists across requests
// and can cause memory issues. The LRU eviction in evictOldestEntries() handles
// cleanup when the cache gets too large, so we don't need periodic cleanup.

// LRU eviction: remove oldest entries when cache exceeds max size
function evictOldestEntries(): void {
  if (ipCache.size <= MAX_CACHE_SIZE) return;
  
  const entries = Array.from(ipCache.entries());
  entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
  
  // Remove oldest 20% of entries
  const entriesToRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
  for (let i = 0; i < entriesToRemove && i < entries.length; i++) {
    ipCache.delete(entries[i][0]);
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  ip: string,
  limit: number = 5,
  windowMs: number = 60 * 1000,
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `rate_limit:${ip}`;

  // Use Redis if available
  if (redis) {
    try {
      const data = await redis.get<{ count: number; resetTime: number }>(key);
      
      if (!data || data.resetTime < now) {
        // New window
        const resetTime = now + windowMs;
        await redis.set(key, { count: 1, resetTime }, { ex: Math.ceil(windowMs / 1000) });
        return {
          success: true,
          limit,
          remaining: limit - 1,
          reset: resetTime,
        };
      }

      if (data.count >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: data.resetTime,
        };
      }

      await redis.set(key, { count: data.count + 1, resetTime: data.resetTime }, { ex: Math.ceil((data.resetTime - now) / 1000) });
      return {
        success: true,
        limit,
        remaining: limit - data.count - 1,
        reset: data.resetTime,
      };
    } catch {
      // Fall back to in-memory on Redis error
    }
  }

  // In-memory fallback
  const entry = ipCache.get(ip);

  if (!entry || entry.resetTime < now) {
    // Evict old entries if cache is too large
    evictOldestEntries();
    
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
      lastAccess: now,
    };
    ipCache.set(ip, newEntry);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: newEntry.resetTime,
    };
  }

  if (entry.count >= limit) {
    entry.lastAccess = now; // Update access time even for blocked requests
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  entry.count++;
  entry.lastAccess = now;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}
