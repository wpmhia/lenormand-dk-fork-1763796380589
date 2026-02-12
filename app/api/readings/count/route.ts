export const runtime = "edge";

import { getReadingCount, formatReadingCount } from "@/lib/counter";

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
          // Cache for 1 minute to reduce Redis calls
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({
        count: 0,
        formatted: "0",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
