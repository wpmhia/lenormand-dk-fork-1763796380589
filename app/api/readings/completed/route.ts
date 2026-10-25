export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { markReadingCompleted } from "@/lib/counter";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

/** Maximum accepted length for a client-built completion key. */
const MAX_KEY_LENGTH = 500;

export async function OPTIONS() {
  return handleCorsPreflight();
}

/**
 * Called once per displayed new spread. Idempotency lives in the counter: the same key only
 * increments the public counter once, so refreshes or AI retries never double-count. The key
 * itself is never logged; only its hash is used as a Redis marker.
 */
export async function POST(request: Request) {
  try {
    const limited = await rateLimit(getClientIP(request), 60);
    if (!limited.success) {
      return new Response(JSON.stringify({ error: "Too many requests." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = (await request.json().catch(() => null)) as { key?: unknown } | null;
    const key = typeof body?.key === "string" ? body.key.trim() : "";
    if (!key || key.length > MAX_KEY_LENGTH) {
      return new Response(JSON.stringify({ error: "Invalid completion key." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const count = await markReadingCompleted(key);
    return new Response(JSON.stringify({ ok: true, count }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Could not record the spread." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
