export const runtime = "edge";

// Edge runtime compatible env var access
const getEnv = (key: string): string | undefined => {
  return (process.env as Record<string, string | undefined>)?.[key] ||
         ((globalThis as unknown) as Record<string, Record<string, string | undefined>>)?.env?.[key];
};

// Health check endpoint for monitoring and load balancers
// Returns system status and basic metrics
export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Date.now(),
    version: getEnv("VERCEL_GIT_COMMIT_SHA")?.slice(0, 7) || "dev",
    region: getEnv("VERCEL_REGION") || "unknown",
    environment: getEnv("NODE_ENV") || "development",
  };

  // Check critical dependencies
  const checks = {
    redis: !!getEnv("UPSTASH_REDIS_REST_URL"),
    ai: !!getEnv("DEEPSEEK_API_KEY"),
    aiKeyLength: getEnv("DEEPSEEK_API_KEY")?.length || 0,
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
