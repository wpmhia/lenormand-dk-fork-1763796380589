// Simple in-memory rate limiter for Edge runtime
// In production, use Upstash Redis for distributed rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const ipCache = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

// Cleanup old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipCache.entries()) {
      if (entry.resetTime < now) {
        ipCache.delete(ip);
      }
    }
  }, CLEANUP_INTERVAL);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function rateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60 * 1000, // 1 minute
): RateLimitResult {
  const now = Date.now();
  const entry = ipCache.get(ip);

  if (!entry || entry.resetTime < now) {
    // New window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs,
    };
    ipCache.set(ip, newEntry);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: newEntry.resetTime,
    };
  }

  // Existing window
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  entry.count++;
  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

export function getClientIP(request: Request): string {
  // Try to get IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default (for local development)
  return "unknown";
}
