import { Redis } from "@upstash/redis";
import { getEnv } from "./env";

const redis = getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: getEnv("UPSTASH_REDIS_REST_URL")!, token: getEnv("UPSTASH_REDIS_REST_TOKEN")! })
  : null;

let memoryCounter = 120;
const KEY = "reading_count:total";

let cachedCount: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

async function fetchFromRedis(): Promise<number | null> {
  if (!redis) return null;
  try {
    const count = await redis.get<number>(KEY);
    if (count === null) {
      await redis.set(KEY, 120);
      return 120;
    }
    return count;
  } catch {
    return null;
  }
}

export async function incrementReadingCount(): Promise<number> {
  cachedCount = null;
  if (redis) {
    try {
      return await redis.incr(KEY);
    } catch { /* fallthrough */ }
  }
  return ++memoryCounter;
}

export async function setReadingCount(count: number): Promise<void> {
  cachedCount = null;
  if (redis) {
    try {
      await redis.set(KEY, count);
      return;
    } catch { /* fallthrough */ }
  }
  memoryCounter = count;
}

export async function getReadingCount(): Promise<number> {
  const now = Date.now();
  if (cachedCount !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCount;
  }
  
  const count = await fetchFromRedis();
  if (count !== null) {
    cachedCount = count;
    cacheTimestamp = now;
    return count;
  }
  
  return memoryCounter;
}

export function formatReadingCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "k";
  return count.toString();
}
