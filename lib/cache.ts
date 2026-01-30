import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;

const redis = redisUrl 
  ? new Redis({ url: redisUrl, token: process.env.UPSTASH_REDIS_REST_TOKEN || "" })
  : null;

const ratelimit = redis 
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m") })
  : null;

export async function rateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  if (!ratelimit) {
    return { success: true, remaining: 999 };
  }
  return await ratelimit.limit(ip);
}
