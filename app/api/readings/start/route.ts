export const runtime = "edge";
export const maxDuration = 30;

import { buildPrompt, isDeepSeekAvailable } from "@/lib/ai-config";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { createJob, updateJob, getJob } from "@/lib/jobs";
import { coalesceRequest, getCachedReading, cacheReading } from "@/lib/request-coalescing";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com";

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 1000;

// Circuit breaker pattern for DeepSeek API
let consecutiveFailures = 0;
let circuitOpen = false;
let circuitResetTime = 0;
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_TIMEOUT = 60000; // 1 minute

function isCircuitOpen(): boolean {
  if (!circuitOpen) return false;
  
  // Check if we should try resetting
  if (Date.now() > circuitResetTime) {
    circuitOpen = false;
    consecutiveFailures = 0;
    return false;
  }
  
  return true;
}

function recordSuccess(): void {
  consecutiveFailures = 0;
  circuitOpen = false;
}

function recordFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_THRESHOLD) {
    circuitOpen = true;
    circuitResetTime = Date.now() + CIRCUIT_TIMEOUT;
  }
}

export async function POST(request: Request) {
  try {
    // Circuit breaker check
    if (isCircuitOpen()) {
      return new Response(
        JSON.stringify({ 
          error: "Service temporarily unavailable",
          message: "AI service is experiencing issues. Please try again in a minute.",
          retryAfter: Math.ceil((circuitResetTime - Date.now()) / 1000),
        }),
        { 
          status: 503, 
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((circuitResetTime - Date.now()) / 1000)),
          } 
        },
      );
    }

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
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
            "Retry-After": String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
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

    // Check cache first
    const cached = getCachedReading(cards, spreadId || "sentence-3", question || "");
    if (cached) {
      // Return cached result immediately
      await createJob(jobId);
      await updateJob(jobId, { status: "completed", result: cached });
      
      return new Response(
        JSON.stringify({ 
          jobId, 
          status: "completed",
          message: "Reading retrieved from cache",
          cached: true,
        }),
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "X-Cache": "HIT",
          },
        },
      );
    }

    const prompt = buildPrompt(
      cards,
      spreadId || "sentence-3",
      question || "What do the cards show?",
    );

    // Start background processing
    await createJob(jobId);
    
    // Process with coalescing (deduplication)
    processAIWithCoalescing(jobId, prompt, cards, spreadId || "sentence-3", question || "");

    // Return immediately
    return new Response(
      JSON.stringify({ 
        jobId, 
        status: "processing",
        message: "Reading is being prepared"
      }),
      {
        status: 202,
        headers: { 
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.reset),
        },
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

async function processAIWithCoalescing(
  jobId: string, 
  prompt: string,
  cards: Array<{ id: number; name: string; position: number }>,
  spreadId: string,
  question: string
) {
  try {
    await updateJob(jobId, { status: "processing" });

    // Use coalescing to deduplicate identical requests
    const result = await coalesceRequest(
      cards,
      spreadId,
      question,
      async () => {
        // Actual API call
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 25000);

        try {
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
              max_tokens: 800, // Reduced for faster response
              stream: false,
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();
          const reading = data.choices?.[0]?.message?.content || "";
          
          recordSuccess();
          return reading;
        } catch (error) {
          clearTimeout(timeoutId);
          recordFailure();
          throw error;
        }
      }
    );

    // Cache the result
    cacheReading(cards, spreadId, question, result);

    await updateJob(jobId, { 
      status: "completed", 
      result,
    });
  } catch (error: any) {
    const isTimeout = error.name === "AbortError";
    await updateJob(jobId, { 
      status: "failed",
      error: isTimeout ? "AI response timed out" : error.message,
    });
  }
}
