import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

export const config = {
  matcher: ["/api/readings/interpret"],
};

export async function rateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return { success: true, remaining: 600 };
  }
  
  const { success, remaining } = await ratelimit.limit(ip);
  return { success, remaining };
}

export const getCacheKey = (question: string, cards: any[], spreadId: string): string => {
  const cardIds = cards.map(c => c.id).sort().join(",");
  const questionHash = question.length > 0 
    ? Buffer.from(question).toString("base64").slice(0, 16)
    : "general";
  return `reading:${spreadId}:${cardIds}:${questionHash}`;
};

export async function getCached(key: string): Promise<string | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  try {
    const data = await redis.get(key);
    return data as string | null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: string, cardCount: number): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  
  try {
    const ttl = cardCount <= 3 ? 604800 : 86400;
    await redis.setex(key, ttl, data);
  } catch (e) {
    console.error("Cache set error:", e);
  }
}

export { redis };