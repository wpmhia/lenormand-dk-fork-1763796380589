export const runtime = "nodejs";

import { setReadingCount } from "@/lib/counter";
import { getEnv } from "@/lib/env";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const ADMIN_TOKEN = getEnv("ADMIN_API_TOKEN");

/**
 * POST to set/reset the reading counter
 * Body: { count: number }
 */
export async function POST(request: Request) {
  // Secure admin authentication
  const authHeader = request.headers.get("authorization");
  if (!ADMIN_TOKEN || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body = await request.json();
    const count = parseInt(body.count, 10);
    
    if (isNaN(count) || count < 0) {
      return new Response(
        JSON.stringify({ error: "Invalid count" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await setReadingCount(count);

    return new Response(
      JSON.stringify({ success: true, count }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to set counter" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
