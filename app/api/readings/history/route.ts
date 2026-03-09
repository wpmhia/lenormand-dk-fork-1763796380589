export const runtime = "edge";

import { Redis } from "@upstash/redis";
import { getEnv } from "@/lib/env";
import { corsHeaders, handleCorsPreflight } from "@/lib/cors";

const redis = getEnv("UPSTASH_REDIS_REST_URL") && getEnv("UPSTASH_REDIS_REST_TOKEN")
  ? new Redis({ url: getEnv("UPSTASH_REDIS_REST_URL")!, token: getEnv("UPSTASH_REDIS_REST_TOKEN")! })
  : null;

const READINGS_KEY = "user_readings";
const MAX_READINGS = 30;

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET() {
  try {
    if (!redis) {
      return new Response(
        JSON.stringify({ readings: [], warning: "Redis not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const readings = await redis.get<any[]>(READINGS_KEY);
    const sorted = (readings || []).sort((a, b) => b.timestamp - a.timestamp);

    return new Response(
      JSON.stringify({ readings: sorted }),
      { status: 200, headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
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

    const readings = await redis.get<any[]>(READINGS_KEY) || [];
    readings.push(newReading);

    if (readings.length > MAX_READINGS) {
      readings.sort((a, b) => b.timestamp - a.timestamp);
      readings.splice(MAX_READINGS);
    }

    await redis.set(READINGS_KEY, readings);

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

    const readings = await redis.get<any[]>(READINGS_KEY) || [];
    const filtered = readings.filter((r) => r.id !== id);

    await redis.set(READINGS_KEY, filtered);

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
