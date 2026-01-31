export const runtime = "edge";

import { getJobWithCache } from "@/lib/jobs";

// SSE endpoint for real-time job updates
// More efficient than polling - maintains single connection
export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");

  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "jobId required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // Check if client accepts SSE
  const accept = request.headers.get("accept");
  const useSSE = accept?.includes("text/event-stream");

  const { job, cacheable } = await getJobWithCache(jobId);

  if (!job) {
    return new Response(
      JSON.stringify({ error: "Job not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  // If job is complete, return immediately with caching
  if (job.status === "completed" || job.status === "failed") {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Cache completed jobs at edge for 5 minutes
    if (cacheable) {
      headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=86400";
      headers["CDN-Cache-Control"] = "public, max-age=300";
      headers["Vercel-CDN-Cache-Control"] = "public, max-age=300";
    }
    
    return new Response(
      JSON.stringify(job),
      { status: 200, headers },
    );
  }

  // For pending/processing jobs, use SSE if requested
  if (useSSE) {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(job)}\n\n`));
        
        // Poll internally and send updates
        const interval = setInterval(async () => {
          const { job: updatedJob } = await getJobWithCache(jobId);
          
          if (!updatedJob) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Job not found" })}\n\n`));
            controller.close();
            clearInterval(interval);
            return;
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(updatedJob)}\n\n`));
          
          if (updatedJob.status === "completed" || updatedJob.status === "failed") {
            controller.close();
            clearInterval(interval);
          }
        }, 1000); // Check every second internally
        
        // Cleanup on client disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // Fallback to regular JSON for non-SSE clients
  return new Response(
    JSON.stringify(job),
    { 
      status: 200, 
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      } 
    },
  );
}
