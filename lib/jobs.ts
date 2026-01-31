import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory cache for job status to reduce Redis calls during polling
const jobCache = new Map<string, Job>();
const CACHE_TTL = 5000; // 5 seconds

export async function createJob(id: string): Promise<void> {
  if (!redis) return;
  
  const job: Job = {
    id,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  // Pipeline: Set job and add to processing queue
  const pipeline = redis.pipeline();
  pipeline.set(`job:${id}`, job, { ex: 300 });
  pipeline.lpush("jobs:pending", id);
  pipeline.expire("jobs:pending", 300);
  await pipeline.exec();
  
  // Update local cache
  jobCache.set(id, job);
}

export async function updateJob(id: string, updates: Partial<Job>): Promise<void> {
  if (!redis) return;
  
  const existing = await getJob(id);
  if (!existing) return;
  
  const updated: Job = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  
  // Pipeline: Update job and manage queues
  const pipeline = redis.pipeline();
  pipeline.set(`job:${id}`, updated, { ex: 300 });
  
  // Move between queues based on status
  if (updates.status === "processing") {
    pipeline.lrem("jobs:pending", 0, id);
    pipeline.lpush("jobs:processing", id);
    pipeline.expire("jobs:processing", 300);
  } else if (updates.status === "completed" || updates.status === "failed") {
    pipeline.lrem("jobs:processing", 0, id);
    pipeline.lpush("jobs:completed", id);
    pipeline.expire("jobs:completed", 300);
  }
  
  await pipeline.exec();
  
  // Update local cache
  jobCache.set(id, updated);
}

export async function getJob(id: string): Promise<Job | null> {
  // Check local cache first
  const cached = jobCache.get(id);
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL) {
    return cached;
  }
  
  if (!redis) return null;
  
  const job = await redis.get<Job>(`job:${id}`);
  
  if (job) {
    jobCache.set(id, job);
  }
  
  return job;
}

export async function deleteJob(id: string): Promise<void> {
  if (!redis) return;
  
  const pipeline = redis.pipeline();
  pipeline.del(`job:${id}`);
  pipeline.lrem("jobs:pending", 0, id);
  pipeline.lrem("jobs:processing", 0, id);
  pipeline.lrem("jobs:completed", 0, id);
  await pipeline.exec();
  
  jobCache.delete(id);
}

// Get job status with caching headers for edge caching
export async function getJobWithCache(id: string): Promise<{ job: Job | null; cacheable: boolean }> {
  const job = await getJob(id);
  
  if (!job) return { job: null, cacheable: false };
  
  // Only cache completed/failed jobs
  const cacheable = job.status === "completed" || job.status === "failed";
  
  return { job, cacheable };
}
