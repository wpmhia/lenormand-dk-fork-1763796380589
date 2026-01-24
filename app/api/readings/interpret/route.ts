export const dynamic = "force-dynamic";

import { buildPrompt, getMaxTokens, isDeepSeekAvailable } from "@/lib/ai-config";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body) {
    return { valid: false, error: "Request body is empty" };
  }

  if (!body.cards || !Array.isArray(body.cards)) {
    return { valid: false, error: "Cards must be provided as an array" };
  }

  if (body.cards.length === 0) {
    return { valid: false, error: "At least one card is required" };
  }

  if (body.cards.length > 36) {
    return { valid: false, error: "Maximum 36 cards allowed" };
  }

  for (let i = 0; i < body.cards.length; i++) {
    const card = body.cards[i];
    if (!card.id || !card.name) {
      return { valid: false, error: `Card ${i + 1} is missing id or name` };
    }
  }

  if (!body.question || typeof body.question !== "string") {
    return { valid: false, error: "Question is required" };
  }

  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isDeepSeekAvailable()) {
      return new Response(
        JSON.stringify({ error: "AI interpretation is not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error || "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, cards, spreadId, _fallback } = body;
    const prompt = buildPrompt(cards, spreadId || "sentence-3", question);
    const maxTokens = getMaxTokens(cards.length);

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
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
        temperature: 0.4,
        max_tokens: maxTokens,
        stream: !_fallback,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body from DeepSeek");
    }

    if (_fallback) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(
        JSON.stringify({ reading: content }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Transform DeepSeek SSE to match expected client format
    const encoder = new TextEncoder();
    const reader = response.body.getReader();
    
    const transformedStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  break;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    // Re-emit in the exact format the client expects
                    const transformedData = JSON.stringify({
                      choices: [{ delta: { content } }]
                    });
                    controller.enqueue(encoder.encode(`data: ${transformedData}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(transformedStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while generating the reading",
        details: errorMsg,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}