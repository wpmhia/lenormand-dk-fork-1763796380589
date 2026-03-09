import { Redis } from "@upstash/redis";
import { getEnv } from "./env";
import { DEFAULT_RATE_LIMIT, DEFAULT_RATE_WINDOW_MS } from "./constants";

const redis = getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: getEnv("UPSTASH_REDIS_REST_URL")!, token: getEnv("UPSTASH_REDIS_REST_TOKEN")! })
  : null;

const cache = new Map<string, { count: number; resetTime: number }>();
const MAX_CACHE_SIZE = 1000;

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

  if (redis) {
    try {
      const data = await redis.get<{ count: number; resetTime: number }>(key);
      if (!data || data.resetTime < now) {
        const resetTime = now + windowMs;
        await redis.set(key, { count: 1, resetTime }, { ex: Math.ceil(windowMs / 1000) });
        return { success: true, limit, remaining: limit - 1, reset: resetTime };
      }
      if (data.count >= limit) {
        return { success: false, limit, remaining: 0, reset: data.resetTime };
      }
      await redis.set(key, { count: data.count + 1, resetTime: data.resetTime }, { ex: Math.ceil((data.resetTime - now) / 1000) });
      return { success: true, limit, remaining: limit - data.count - 1, reset: data.resetTime };
    } catch { /* fallthrough */ }
  }

  // In-memory fallback
  if (cache.size > MAX_CACHE_SIZE) {
    for (const [k, v] of cache) {
      if (v.resetTime < now) cache.delete(k);
    }
  }

  const entry = cache.get(key);
  if (!entry || entry.resetTime < now) {
    const resetTime = now + windowMs;
    cache.set(key, { count: 1, resetTime });
    return { success: true, limit, remaining: limit - 1, reset: resetTime };
  }
  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetTime };
  }
  entry.count++;
  return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map(ip => ip.trim());
    return ips[ips.length - 1] || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}
