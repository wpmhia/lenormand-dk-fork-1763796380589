export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getReadingCount, formatReadingCount } from "@/lib/counter";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET() {
  try {
    const count = await getReadingCount();
    
    return new Response(
      JSON.stringify({
        count,
        formatted: formatReadingCount(count),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-cache, no-store",
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    console.error("Reading count unavailable, returning 0:", err);
    return new Response(
      JSON.stringify({ count: 0, formatted: "0" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-cache, no-store",
          ...corsHeaders,
        },
      }
    );
  }
}
