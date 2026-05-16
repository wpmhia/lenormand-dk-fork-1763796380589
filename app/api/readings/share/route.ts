export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

import { getEnv } from "@/lib/env";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";
import { API_REQUEST_TIMEOUT_MS, ERROR_MESSAGES } from "@/lib/constants";

export async function OPTIONS() {
  return handleCorsPreflight();
}

const READING_HMAC_SECRET = getEnv("READING_HMAC_SECRET");

async function generateHMAC(data: string): Promise<string> {
  // Use Web Crypto API for Edge runtime compatibility
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(READING_HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.slice(0, 16);
}

/**
 * POST /api/readings/share
 * Encode reading data with HMAC signature (server-side only)
 */
export async function POST(request: Request) {
  try {
    if (!READING_HMAC_SECRET) {
      return new Response(
        JSON.stringify({ error: "Sharing not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await request.json();
    
    const json = JSON.stringify(body);
    const base64 = Buffer.from(json, "utf-8").toString("base64").replace(
      /[+/=]/g,
      (c) =>
        ({
          "+": "-",
          "/": "_",
          "=": "",
        })[c] ?? c,
    );

    // Server-side HMAC only - secret never exposed to client
    const hmac = await generateHMAC(base64);
    const encoded = `${base64}.${hmac}`;

    return new Response(
      JSON.stringify({ encoded }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          ...corsHeaders,
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to encode reading" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}

/**
 * GET /api/readings/share?encoded=...
 * Decode and validate reading data with HMAC verification
 */
export async function GET(request: Request) {
  try {
    if (!READING_HMAC_SECRET) {
      return new Response(
        JSON.stringify({ error: "Sharing not configured" }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { searchParams } = new URL(request.url);
    const encoded = searchParams.get("encoded");

    if (!encoded) {
      return new Response(
        JSON.stringify({ error: "Missing encoded data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const [base64WithPad, providedHmac] = encoded.split(".");

    if (!base64WithPad || !providedHmac) {
      return new Response(
        JSON.stringify({ error: "Invalid format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify HMAC signature server-side
    const computedHmac = await generateHMAC(base64WithPad);
    if (computedHmac !== providedHmac) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const base64 = base64WithPad.replace(
      /[-_]/g,
      (c) => ({ "-": "+", _: "/" })[c] || c,
    );
    const padLength = (4 - (base64.length % 4)) % 4;
    const paddedBase64 = base64 + "=".repeat(padLength);
    const json = Buffer.from(paddedBase64, "base64").toString("utf-8");
    const data = JSON.parse(json);

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          ...corsHeaders,
        },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to decode reading" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
}
