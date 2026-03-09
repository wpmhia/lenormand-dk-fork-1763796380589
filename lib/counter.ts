// Reading counter with Redis support (falls back to in-memory)
import { Redis } from "@upstash/redis";
import { getEnv } from "./env";

const redisUrl = getEnv("UPSTASH_REDIS_REST_URL");
const redisToken = getEnv("UPSTASH_REDIS_REST_TOKEN");

const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

// In-memory fallback counter - starts at 120
let memoryCounter = 120;
const COUNTER_KEY = "reading_count:total";
const INITIAL_COUNT = 120;

/**
 * Increment the total reading counter
 * Atomically increments in Redis or falls back to in-memory
 */
export async function incrementReadingCount(): Promise<number> {
  if (redis) {
    try {
      const newCount = await redis.incr(COUNTER_KEY);
      console.log("[Counter] Incremented to:", newCount);
      return newCount;
    } catch (err) {
      console.error("[Counter] Redis increment failed:", err);
      // Fall back to in-memory on Redis error
    }
  }
  
  memoryCounter++;
  console.log("[Counter] In-memory increment to:", memoryCounter);
  return memoryCounter;
}

/**
 * Get the current total reading count
 * Fetches from Redis or returns in-memory value
 */
export async function getReadingCount(): Promise<number> {
  if (redis) {
    try {
      const count = await redis.get<number>(COUNTER_KEY);
      // Use atomic INCR with initial value only if truly empty
      if (count === null || count === undefined) {
        await redis.set(COUNTER_KEY, INITIAL_COUNT);
        return INITIAL_COUNT;
      }
      return count;
    } catch {
      // Fall back to in-memory on Redis error
    }
  }
  
  return memoryCounter;
}

/**
 * Format a large number for display
 * e.g., 1234 -> "1.2k", 1234567 -> "1.2M"
 */
export function formatReadingCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  }
  return count.toString();
}
