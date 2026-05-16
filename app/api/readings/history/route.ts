export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

const redis = getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: getEnv("UPSTASH_REDIS_REST_URL")!, token: getEnv("UPSTASH_REDIS_REST_TOKEN")! })
  : null;

const READINGS_KEY = "user_readings";
const MAX_READINGS = 30;

function getSessionId(request: Request): string | null {
  const sessionId = request.headers.get("X-Session-Id");
  if (sessionId && /^[a-f0-9-]{8,64}$/i.test(sessionId)) {
    return sessionId;
  }
  return null;
}

function readingsKey(sessionId: string): string {
  return `user_readings:${sessionId}`;
}

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(request: Request) {
  try {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID required via X-Session-Id header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!redis) {
      return new Response(
        JSON.stringify({ readings: [], warning: "Redis not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const raw = await redis.get(readingsKey(sessionId));
    const readings = Array.isArray(raw) ? raw : [];
    const sorted = (readings).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

    return new Response(
      JSON.stringify({ readings: sorted }),
      { status: 200, headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "private, no-cache",
        ...corsHeaders 
      } }
    );
  } catch {
    return new Response(
      JSON.stringify({ readings: [], error: "Failed to fetch readings" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID required via X-Session-Id header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await request.json();
    const { id, timestamp, question, spreadType, cards, interpretationPreview, interpretationFull } = body;

    if (!id || !timestamp || !cards) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!redis) {
      return new Response(
        JSON.stringify({ error: "Redis not configured", success: false }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const newReading = {
      id,
      timestamp,
      question: question || "",
      spreadType: spreadType || "Unknown",
      cards,
      interpretationPreview: interpretationPreview || "",
      interpretationFull: interpretationFull || "",
    };

    const key = readingsKey(sessionId);
    const raw = await redis.get(key);
    let readings = Array.isArray(raw) ? raw : [];
    readings.push(newReading);

    if (readings.length > MAX_READINGS) {
      readings.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      readings.splice(MAX_READINGS);
    }

    await redis.set(key, readings);

    return new Response(
      JSON.stringify({ success: true, reading: newReading }),
      { status: 201, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to save reading" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID required via X-Session-Id header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Reading ID required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!redis) {
      return new Response(
        JSON.stringify({ error: "Redis not configured", success: false }),
        { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const key = readingsKey(sessionId);
    const raw = await redis.get(key);
    const readings = Array.isArray(raw) ? raw : [];
    const filtered = readings.filter((r: any) => r.id !== id);

    await redis.set(key, filtered);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to delete reading" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
