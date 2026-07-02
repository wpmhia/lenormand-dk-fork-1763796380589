import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { getEnv } from "./env";

const redis = getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: getEnv("UPSTASH_REDIS_REST_URL")!, token: getEnv("UPSTASH_REDIS_REST_TOKEN")! })
  : null;

const upstashRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "lenormand",
    })
  : null;

const memCache = new Map<string, { count: number; resetTime: number }>();
const MAX_CACHE_SIZE = 5000;
const CLEANUP_PROBABILITY = 0.02;

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
  limit: number = 20,
  _windowMs?: number,
): Promise<RateLimitResult> {
  const key = hashIP(ip);

  if (upstashRatelimit) {
    try {
      const ratelimiter = limit !== 20
        ? new Ratelimit({
            redis: redis!,
            limiter: Ratelimit.slidingWindow(limit, "1 m"),
            analytics: true,
            prefix: "lenormand",
          })
        : upstashRatelimit;

      const { success, limit: l, remaining, reset } = await ratelimiter.limit(key);
      return { success, limit: l, remaining, reset: reset || Date.now() + 60000 };
    } catch {
      // Fall through to in-memory fallback
    }
  }

  const now = Date.now();
  const memKey = `mem:${key}:${limit}`;
  const entry = memCache.get(memKey);

  if (entry && entry.resetTime >= now) {
    if (entry.count >= limit) {
      return { success: false, limit, remaining: 0, reset: entry.resetTime };
    }
    entry.count++;
    return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime };
  }

  const resetTime = now + 60000;
  memCache.set(memKey, { count: 1, resetTime });

  if (memCache.size > MAX_CACHE_SIZE && Math.random() < CLEANUP_PROBABILITY) {
    for (const [k, v] of memCache) {
      if (v.resetTime < now) memCache.delete(k);
    }
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
