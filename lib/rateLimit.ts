/**
 * Rate limiting utilities for API protection
 * Implements token bucket algorithm for request throttling
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

interface ClientBucket {
  tokens: number;
  lastRefillTime: number;
}

export class RateLimiter {
  private buckets: Map<string, ClientBucket> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) {
    this.config = config;
  }

  /**
   * Check if a request is allowed from a client
   */
  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(clientId);

    if (!bucket) {
      this.buckets.set(clientId, {
        tokens: this.config.maxRequests - 1,
        lastRefillTime: now,
      });
      return true;
    }

    const timePassed = now - bucket.lastRefillTime;
    const tokensToAdd =
      (timePassed / this.config.windowMs) * this.config.maxRequests;

    bucket.tokens = Math.min(
      this.config.maxRequests,
      bucket.tokens + tokensToAdd,
    );
    bucket.lastRefillTime = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get remaining tokens for a client
   */
  getRemainingTokens(clientId: string): number {
    const bucket = this.buckets.get(clientId);
    if (!bucket) {
      return this.config.maxRequests;
    }

    const now = Date.now();
    const timePassed = now - bucket.lastRefillTime;
    const tokensToAdd =
      (timePassed / this.config.windowMs) * this.config.maxRequests;

    return Math.floor(
      Math.min(this.config.maxRequests, bucket.tokens + tokensToAdd),
    );
  }

  /**
   * Get retry-after time in seconds
   */
  getRetryAfter(clientId: string): number {
    const bucket = this.buckets.get(clientId);
    if (!bucket) {
      return 0;
    }

    const now = Date.now();
    const timePassed = now - bucket.lastRefillTime;
    const timeUntilRefill = this.config.windowMs - timePassed;

    return Math.ceil(timeUntilRefill / 1000);
  }

  /**
   * Reset rate limit for a client (admin use)
   */
  reset(clientId: string): void {
    this.buckets.delete(clientId);
  }

  /**
   * Clear all rate limits (admin use)
   */
  clearAll(): void {
    this.buckets.clear();
  }

  /**
   * Get bucket statistics
   */
  getStats(): { activeBuckets: number; totalRequests: number } {
    return {
      activeBuckets: this.buckets.size,
      totalRequests: Array.from(this.buckets.values()).reduce(
        (sum, bucket) => sum + (this.config.maxRequests - bucket.tokens),
        0,
      ),
    };
  }
}

export class PerPathRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map();
  private defaultConfig: RateLimitConfig;

  constructor(defaultConfig?: RateLimitConfig) {
    this.defaultConfig = defaultConfig || { maxRequests: 100, windowMs: 60000 };
  }

  /**
   * Get or create a rate limiter for a path
   */
  private getLimiter(path: string, config?: RateLimitConfig): RateLimiter {
    if (!this.limiters.has(path)) {
      this.limiters.set(path, new RateLimiter(config || this.defaultConfig));
    }
    return this.limiters.get(path)!;
  }

  /**
   * Check if request is allowed for a specific path
   */
  isAllowed(clientId: string, path: string, config?: RateLimitConfig): boolean {
    const limiter = this.getLimiter(path, config);
    return limiter.isAllowed(clientId);
  }

  /**
   * Get remaining tokens for a client on a specific path
   */
  getRemainingTokens(clientId: string, path: string): number {
    const limiter = this.getLimiter(path);
    return limiter.getRemainingTokens(clientId);
  }

  /**
   * Get retry-after time for a client on a specific path
   */
  getRetryAfter(clientId: string, path: string): number {
    const limiter = this.getLimiter(path);
    return limiter.getRetryAfter(clientId);
  }

  /**
   * Reset all limiters
   */
  resetAll(): void {
    this.limiters.clear();
  }
}

export function extractClientId(request: Request): string {
  const headers = request.headers;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const clientIp = headers.get("x-real-ip");
  if (clientIp) {
    return clientIp;
  }

  return "unknown";
}

export const apiLimiter = new PerPathRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
});

export default RateLimiter;
