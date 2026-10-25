export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { markReadingCompleted } from "@/lib/counter";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

/**
 * Called once per displayed new spread. The body carries only the random completion id created in
 * the browser; the question, cards and every other spread detail never reach this route. The id
 * must be opaque: the counter would break if content were encoded inside it.
 */
const ID_PATTERN = /^[0-9a-z-]{20,64}$/i;

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function POST(request: Request) {
  try {
    const limited = await rateLimit(getClientIP(request), 60);
    if (!limited.success) {
      return new Response(JSON.stringify({ error: "Too many requests." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
    const id = typeof body?.id === "string" ? body.id.trim().toLowerCase() : "";
    if (!id || !ID_PATTERN.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid completion id." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const count = await markReadingCompleted(id);
    return new Response(JSON.stringify({ ok: true, count }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch {
    // Redis is configured but failing: report a temporary failure so the client retries later
    // instead of writing a per-instance fallback that could diverge between servers.
    return new Response(JSON.stringify({ error: "Could not record the spread." }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
