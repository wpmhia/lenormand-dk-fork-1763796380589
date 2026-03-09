import { Redis } from "@upstash/redis";
import { getEnv } from "./env";

const redis = getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: getEnv("UPSTASH_REDIS_REST_URL")!, token: getEnv("UPSTASH_REDIS_REST_TOKEN")! })
  : null;

let memoryCounter = 120;
const KEY = "reading_count:total";

export async function incrementReadingCount(): Promise<number> {
  if (redis) {
    try {
      return await redis.incr(KEY);
    } catch { /* fallthrough */ }
  }
  return ++memoryCounter;
}

export async function getReadingCount(): Promise<number> {
  if (redis) {
    try {
      const count = await redis.get<number>(KEY);
      if (count === null) {
        await redis.set(KEY, 120);
        return 120;
      }
      return count;
    } catch { /* fallthrough */ }
  }
  return memoryCounter;
}

export function formatReadingCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "k";
  return count.toString();
}
