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

// Check if Redis is available
export function isRedisAvailable(): boolean {
  return !!redis;
}

export interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
  chunkIndex?: number;
  totalChunks?: number;
}

// In-memory fallback for when Redis is unavailable
const memoryJobs = new Map<string, Job>();

// In-memory cache for job status to reduce Redis calls during polling
const jobCache = new Map<string, Job>();
const CACHE_TTL = 5000; // 5 seconds

export async function createJob(id: string): Promise<boolean> {
  const job: Job = {
    id,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  if (redis) {
    try {
      await redis.set(`job:${id}`, job, { ex: 300 });
      await redis.lpush("jobs:pending", id);
      await redis.expire("jobs:pending", 300);
      jobCache.set(id, job);
      return true;
    } catch (err) {
      console.warn("Redis createJob failed, using memory fallback:", err);
    }
  }
  
  // Fallback to memory
  memoryJobs.set(id, job);
  return false; // Returns false to indicate fallback mode
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<void> {
  const existing = await getJob(id);
  if (!existing) return;
  
  const updated: Job = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  
  if (redis) {
    try {
      await redis.set(`job:${id}`, updated, { ex: 300 });
      
      // Move between queues based on status
      if (updates.status === "processing") {
        await redis.lrem("jobs:pending", 0, id);
        await redis.lpush("jobs:processing", id);
        await redis.expire("jobs:processing", 300);
      } else if (updates.status === "completed" || updates.status === "failed") {
        await redis.lrem("jobs:processing", 0, id);
        await redis.lpush("jobs:completed", id);
        await redis.expire("jobs:completed", 300);
      }
      
      jobCache.set(id, updated);
      return;
    } catch (err) {
      console.warn("Redis updateJob failed, using memory fallback:", err);
    }
  }
  
  // Fallback to memory
  memoryJobs.set(id, updated);
}

export async function getJob(id: string): Promise<Job | null> {
  // Check local cache first
  const cached = jobCache.get(id);
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL) {
    return cached;
  }
  
  if (redis) {
    try {
      const job = await redis.get<Job>(`job:${id}`);
      if (job) {
        jobCache.set(id, job);
        return job;
      }
    } catch (err) {
      console.warn("Redis getJob failed, using memory fallback:", err);
    }
  }
  
  // Fallback to memory
  return memoryJobs.get(id) || null;
}

// Get job status with caching headers for edge caching
export async function getJobWithCache(id: string): Promise<{ job: Job | null; cacheable: boolean }> {
  const job = await getJob(id);
  
  if (!job) return { job: null, cacheable: false };
  
  // Only cache completed/failed jobs
  const cacheable = job.status === "completed" || job.status === "failed";
  
  return { job, cacheable };
}


