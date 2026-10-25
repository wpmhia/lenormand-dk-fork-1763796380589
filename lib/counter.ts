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

/** Completed spreads already counted. The marker holds the random completion id, never content. */
const DONE_PREFIX = "reading_count:done:";
const DONE_TTL_SECONDS = 60 * 60 * 24 * 30;
const memoryDoneIds = new Set<string>();
const MAX_MEMORY_DONE_IDS = 10000;

/** Optional historical total used only to bootstrap a brand-new counter, never to overwrite one. */
const HISTORICAL_TOTAL_ENV = "DEFAULT_READING_COUNT";

/**
 * Atomically counts a completed spread once per random id in a single Redis call: the missing
 * historical total is bootstrapped from the historical baseline (only when it does not exist,
 * never over an existing value), the id marker is created once, and the total is incremented,
 * so no ordering or repetition across instances can produce inconsistent counts. The script
 * returns -1 when the id was already counted.
 */
const COUNT_ONCE_SCRIPT = `
local total = redis.call("GET", KEYS[1])
if total == false then
  local seed = tonumber(ARGV[3])
  if seed == nil or seed <= 0 then seed = 0 end
  redis.call("SET", KEYS[1], seed)
  if seed > 0 then
    -- Surfaced once per counted spread when it happens: this is the only moment a baseline
    -- is written to Redis, and only when the historical total is absent.
    redis.log(redis.LOG_WARNING, "counter: bootstrapped missing " .. KEYS[1] .. " from baseline")
  end
end
if redis.call("SETNX", KEYS[2], 1) == 1 then
  redis.call("EXPIRE", KEYS[2], tonumber(ARGV[2]))
  return redis.call("INCR", KEYS[1])
end
return tonumber(total)
`;

export async function markReadingCompleted(id: string): Promise<number> {
  const doneKey = DONE_PREFIX + id;
  if (redis) {
    const seed = parseInt(getEnv(HISTORICAL_TOTAL_ENV) || "0", 10);
    const result = (await redis.eval(
      COUNT_ONCE_SCRIPT,
      [KEY, doneKey],
      ["1", String(DONE_TTL_SECONDS), String(seed)],
    )) as number;
    cachedCount = null;
    return Number(result);
  }
  if (memoryDoneIds.size >= MAX_MEMORY_DONE_IDS) memoryDoneIds.clear();
  if (memoryDoneIds.has(id)) return getReadingCount();
  memoryDoneIds.add(id);
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
