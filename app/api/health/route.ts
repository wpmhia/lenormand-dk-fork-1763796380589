export const runtime = "nodejs";

// Simple, fast health check for warm-up pings
// Optimized for Vercel free plan - minimal compute
export async function GET() {
  // Return immediately - just need to wake up the function
  return new Response(
    JSON.stringify({ 
      status: "ok",
      ts: Date.now(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Health-Check": "true",
      },
    }
  );
}
