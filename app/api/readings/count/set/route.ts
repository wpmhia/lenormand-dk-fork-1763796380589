export const runtime = "edge";

import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";

const redisUrl = getEnv("UPSTASH_REDIS_REST_URL");
const redisToken = getEnv("UPSTASH_REDIS_REST_TOKEN");

const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

const COUNTER_KEY = "reading_count:total";

/**
 * POST to set/reset the reading counter
 * Body: { count: number }
 */
export async function POST(request: Request) {
  // Simple auth check - you should use a proper secret in production
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const count = parseInt(body.count, 10);
    
    if (isNaN(count) || count < 0) {
      return new Response(
        JSON.stringify({ error: "Invalid count" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (redis) {
      await redis.set(COUNTER_KEY, count);
    }

    return new Response(
      JSON.stringify({ success: true, count }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to set counter" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
