import { Redis } from "@upstash/redis";
import { getEnv } from "./env";

const redis = getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: getEnv("UPSTASH_REDIS_REST_URL")!, token: getEnv("UPSTASH_REDIS_REST_TOKEN")! })
  : null;

let memoryCounter = parseInt(getEnv("DEFAULT_READING_COUNT") || "12900", 10);
const KEY = "reading_count:total";

let cachedCount: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

async function fetchFromRedis(): Promise<number | null> {
  if (!redis) return null;
  try {
    const count = await redis.get<number>(KEY);
    return count;
  } catch {
    return null;
  }
}

/** Completed spreads already counted. The marker TTL covers revisits long enough to matter. */
const DONE_PREFIX = "reading_count:done:";
const DONE_TTL_SECONDS = 60 * 60 * 24 * 30;
const memoryDoneKeys = new Set<string>();
const MAX_MEMORY_DONE_KEYS = 10000;

function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Counts one completed spread exactly once per reading key. The marker uses SET NX, so a repeat
 * such as a page refresh only reaches the increment when this key was never counted before.
 * The plain incr stays for other callers that do not need idempotency.
 */
export async function markReadingCompleted(key: string): Promise<number> {
  const doneKey = DONE_PREFIX + hashKey(key);
  if (redis) {
    try {
      // A fresh Redis deployment holds no counter yet: start from the historical baseline
      // instead of counting from zero, so the public value never drops or restarts.
      if ((await redis.get(KEY)) === null) {
        await redis.set(KEY, String(memoryCounter));
      }
      const first = await (redis as unknown as {
        set: (k: string, v: string, opts?: { nx?: boolean; ex?: number }) => Promise<unknown>;
      }).set(doneKey, "1", { nx: true, ex: DONE_TTL_SECONDS });
      // Upstash returns the value on success and null when the key already existed.
      if (first === null) return (await getReadingCount());
      cachedCount = null;
      return await redis.incr(KEY);
    } catch { /* fall through to memory */ }
  }
  if (memoryDoneKeys.size >= MAX_MEMORY_DONE_KEYS) memoryDoneKeys.clear();
  if (memoryDoneKeys.has(doneKey)) return getReadingCount();
  memoryDoneKeys.add(doneKey);
  cachedCount = null;
  return incrementReadingCount();
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
  
  cachedCount = memoryCounter;
  cacheTimestamp = now;
  return memoryCounter;
}

export function formatReadingCount(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
  if (count >= 1000) return (count / 1000).toFixed(1) + "k";
  return count.toString();
}
