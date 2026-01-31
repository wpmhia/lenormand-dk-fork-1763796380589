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

export async function createJob(id: string): Promise<void> {
  if (!redis) return;
  
  const job: Job = {
    id,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  await redis.set(`job:${id}`, job, { ex: 300 }); // 5 min expiry
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
  
  await redis.set(`job:${id}`, updated, { ex: 300 });
}

export async function getJob(id: string): Promise<Job | null> {
  if (!redis) return null;
  return await redis.get<Job>(`job:${id}`);
}

export async function deleteJob(id: string): Promise<void> {
  if (!redis) return;
  await redis.del(`job:${id}`);
}
