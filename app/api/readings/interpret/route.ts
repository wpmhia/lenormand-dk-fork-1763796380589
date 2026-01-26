export const runtime = "edge";

import { headers } from "next/headers";
import { buildPrompt, isDeepSeekAvailable } from "@/lib/ai-config";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const ALLOWED_ORIGINS = [
  "https://lenormand.dk",
  "https://www.lenormand.dk",
  "https://lenormand-intelligence.vercel.app",
  process.env.NEXT_PUBLIC_APP_URL || "",
].filter(Boolean);

const deepseek = createOpenAI({
  baseURL: DEEPSEEK_BASE_URL,
  apiKey: DEEPSEEK_API_KEY,
});

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
    const headersList = headers();
    
    // Security: Validate origin
    const origin = headersList.get("origin") || headersList.get("referer");
    const isValidOrigin = ALLOWED_ORIGINS.some(allowed => 
      origin?.includes(allowed.replace(/https?:\/\//, ""))
    );
    
    if (!isValidOrigin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized origin" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

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
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { question, cards, spreadId } = body;
    const prompt = buildPrompt(cards, spreadId || "sentence-3", question);

    const result = streamText({
      model: deepseek.chat("deepseek-chat"),
      messages: [
        { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      maxOutputTokens: 2000,
    });

    // Stream response chunks as SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.textStream) {
            const data = JSON.stringify({
              choices: [{ delta: { content: chunk } }]
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          // Don't expose error details in stream
          controller.error(error);
        } finally {
          controller.close();
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
  } catch (error) {
    // Don't expose error details - use fallback
    const fallbackMessage = "The cards whisper their message through the mist.\n\nReflect on the cards' traditional meanings and how they speak to your question.\n\nThe answer emerges from within your own intuition.";

    return new Response(
      JSON.stringify({
        reading: fallbackMessage,
        source: "fallback",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
