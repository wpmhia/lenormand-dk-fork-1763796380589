export const runtime = "edge";

import { buildPrompt, isDeepSeekAvailable } from "@/lib/ai-config";
import { getCached, setCached, getCacheKey, rateLimit } from "@/lib/cache";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com";

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
    return { valid: false, error: "Cards must be provided as an array" };
  }

  if (!body.question || typeof body.question !== "string") {
    return { valid: false, error: "Question is required" };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!isDeepSeekAvailable()) {
      return new Response(
        JSON.stringify({ error: "AI interpretation is not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { success } = await rateLimit(ip);
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, cards, spreadId } = body;
    const cacheKey = getCacheKey(question, cards, spreadId || "sentence-3");

    const cached = await getCached(cacheKey);
    if (cached) {
      // Return cached result as SSE stream for consistent frontend handling
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ reading: cached, source: "cache" })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    const prompt = buildPrompt(cards, spreadId || "sentence-3", question);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Deepseek] API Error:", response.status, errorText);
      throw new Error(`API call failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    // Create SSE stream that forwards DeepSeek chunks to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullReading = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6);
                
                if (dataStr === '[DONE]') {
                  // Store in cache before finishing
                  if (fullReading) {
                    await setCached(cacheKey, fullReading, cards.length);
                  }
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }
                
                try {
                  const data = JSON.parse(dataStr);
                  const content = data.choices?.[0]?.delta?.content;
                  if (content) {
                    fullReading += content;
                    // Forward chunk to client
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {
                  // Ignore malformed chunks
                }
              }
            }
          }
          
          // Handle any remaining buffer
          if (fullReading) {
            await setCached(cacheKey, fullReading, cards.length);
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("[Deepseek] Stream error:", error);
          controller.error(error);
        } finally {
          clearTimeout(timeoutId);
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
  } catch (error: any) {
    console.error("[Deepseek] Request error:", error.message);
    
    return new Response(
      JSON.stringify({
        error: "Stream failed",
        reading: "The cards whisper their message through the mist.\n\nReflect on the cards' traditional meanings and how they speak to your question.\n\nThe answer emerges from within your own intuition.",
        source: "fallback",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
