export const runtime = "edge";

// Health check endpoint for monitoring and load balancers
// Returns system status and basic metrics
export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Date.now(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
    region: process.env.VERCEL_REGION || "unknown",
    environment: process.env.NODE_ENV || "development",
  };

  // Check critical dependencies
  const checks = {
    redis: !!process.env.UPSTASH_REDIS_REST_URL,
    ai: !!process.env.DEEPSEEK_API_KEY,
  };

  const allHealthy = Object.values(checks).every(Boolean);

  if (!allHealthy) {
    return new Response(
      JSON.stringify({
        ...health,
        status: "degraded",
        checks,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return new Response(
    JSON.stringify({
      ...health,
      checks,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}
