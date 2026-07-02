import { Redis } from "@upstash/redis";
import { getEnv } from "./env";
import { DEFAULT_RATE_LIMIT, DEFAULT_RATE_WINDOW_MS } from "./constants";

const redis = getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: getEnv("UPSTASH_REDIS_REST_URL")!, token: getEnv("UPSTASH_REDIS_REST_TOKEN")! })
  : null;

const memCache = new Map<string, { count: number; resetTime: number }>();
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
  const key = `rl:${hashIP(ip)}:${limit}:${windowMs}`;

  if (redis) {
    try {
      const windowKey = `rl:${key}:${Math.floor(now / windowMs)}`;
      const count = await redis.incr(windowKey);
      if (count === 1) {
        await redis.expire(windowKey, Math.ceil(windowMs / 1000));
      }
      const remaining = Math.max(0, limit - count);
      const reset = now + windowMs;
      if (count > limit) {
        return { success: false, limit, remaining: 0, reset };
      }
      return { success: true, limit, remaining, reset };
    } catch {
      // Fall through to in-memory fallback
    }
  }

  const entry = memCache.get(key);
  if (entry && entry.resetTime >= now) {
    if (entry.count >= limit) {
      return { success: false, limit, remaining: 0, reset: entry.resetTime };
    }
    entry.count++;
    return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime };
  }

  const resetTime = now + windowMs;
  memCache.set(key, { count: 1, resetTime });

  if (memCache.size > MAX_CACHE_SIZE && shouldCleanup()) {
    const keysToDelete: string[] = [];
    for (const [k, v] of memCache) {
      if (v.resetTime < now) keysToDelete.push(k);
    }
    for (const k of keysToDelete) memCache.delete(k);
  }

  return { success: true, limit, remaining: limit - 1, reset: resetTime };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim());
    return ips[0] || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  const ua = request.headers.get("user-agent") || "";
  const lang = request.headers.get("accept-language") || "";
  return `ua:${ua.length}:${lang.length}`;
}

export function checkBodySize(request: Request, maxBytes = 25000): number | null {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > maxBytes) {
      return size;
    }
  }
  return null;
}
