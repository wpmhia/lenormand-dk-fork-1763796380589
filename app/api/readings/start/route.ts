export const runtime = "edge";
export const maxDuration = 30;

import { buildPrompt, isDeepSeekAvailable } from "@/lib/ai-config";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { createJob, updateJob } from "@/lib/jobs";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com";

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = await rateLimit(ip, RATE_LIMIT, RATE_LIMIT_WINDOW);

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json();

    if (!isDeepSeekAvailable()) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
      return new Response(JSON.stringify({ error: "Cards required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { question, cards, spreadId, jobId } = body;
    
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(
      cards,
      spreadId || "sentence-3",
      question || "What do the cards show?",
    );

    // Start background processing
    await createJob(jobId);
    
    // Process in background (don't await)
    processAI(jobId, prompt, rateLimitResult);

    // Return immediately
    return new Response(
      JSON.stringify({ 
        jobId, 
        status: "processing",
        message: "Reading is being prepared"
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Failed to start reading",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function processAI(
  jobId: string, 
  prompt: string, 
  rateLimitResult: { limit: number; remaining: number; reset: number }
) {
  try {
    await updateJob(jobId, { status: "processing" });

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 25000);

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        stream: false, // Non-streaming for background processing
      }),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const reading = data.choices?.[0]?.message?.content || "";

    await updateJob(jobId, { 
      status: "completed", 
      result: reading,
    });
  } catch (error: any) {
    const isTimeout = error.name === "AbortError";
    await updateJob(jobId, { 
      status: "failed",
      error: isTimeout ? "AI response timed out" : error.message,
    });
  }
}
