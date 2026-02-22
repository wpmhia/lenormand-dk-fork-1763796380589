export const runtime = "edge";
export const dynamic = "force-dynamic";

// Simple, fast health check for warm-up pings
// Optimized for Vercel free plan - minimal compute
export async function GET() {
  // Return immediately - just need to wake up the function
  // SECURITY: No timestamp to prevent timing attacks
  return new Response(
    JSON.stringify({ 
      status: "ok",
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
