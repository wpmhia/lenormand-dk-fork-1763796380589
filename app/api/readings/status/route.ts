export const runtime = "edge";

import { getJob } from "@/lib/jobs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");

  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "jobId required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const job = await getJob(jobId);

  if (!job) {
    return new Response(
      JSON.stringify({ error: "Job not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify(job),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
