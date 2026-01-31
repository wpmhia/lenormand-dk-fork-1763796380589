export const runtime = "edge";

import { getJobWithCache } from "@/lib/jobs";

// Job status endpoint - returns current status
// Client should poll every 1-2 seconds for updates
export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");

  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "jobId required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { job, cacheable } = await getJobWithCache(jobId);

  if (!job) {
    return new Response(
      JSON.stringify({ error: "Job not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Cache completed/failed jobs at edge
  if (cacheable) {
    headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=86400";
    headers["CDN-Cache-Control"] = "public, max-age=300";
    headers["Vercel-CDN-Cache-Control"] = "public, max-age=300";
  } else {
    // Don't cache pending/processing jobs
    headers["Cache-Control"] = "no-cache";
  }
  
  return new Response(
    JSON.stringify(job),
    { status: 200, headers },
  );
}
