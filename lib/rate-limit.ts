import { getEnv } from "./env";
import { DEFAULT_RATE_LIMIT, DEFAULT_RATE_WINDOW_MS } from "./constants";

const cache = new Map<string, { count: number; resetTime: number }>();
const MAX_CACHE_SIZE = 5000;
const CLEANUP_PROBABILITY = 0.02;

function shouldCleanup(): boolean {
  return Math.random() < CLEANUP_PROBABILITY;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash + ip.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export async function rateLimit(
  ip: string,
  limit: number = DEFAULT_RATE_LIMIT,
  windowMs: number = DEFAULT_RATE_WINDOW_MS,
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `rl:${hashIP(ip)}`;

  // Check in-memory cache first
  const entry = cache.get(key);
  
  if (entry && entry.resetTime >= now) {
    if (entry.count >= limit) {
      return { success: false, limit, remaining: 0, reset: entry.resetTime };
    }
    entry.count++;
    return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime };
  }

  // Rate limit window expired or new IP - reset
  const resetTime = now + windowMs;
  cache.set(key, { count: 1, resetTime });
  
  // Periodic cleanup to prevent memory leaks
  if (cache.size > MAX_CACHE_SIZE && shouldCleanup()) {
    const keysToDelete: string[] = [];
    for (const [k, v] of cache) {
      if (v.resetTime < now) {
        keysToDelete.push(k);
      }
    }
    for (const k of keysToDelete) {
      cache.delete(k);
    }
  }

  return { success: true, limit, remaining: limit - 1, reset: resetTime };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(ip => ip.trim());
    return ips[ips.length - 1] || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
