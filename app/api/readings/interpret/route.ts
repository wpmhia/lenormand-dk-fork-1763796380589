export const runtime = "edge";

import { buildPrompt, isDeepSeekAvailable } from "@/lib/ai-config";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com";

export async function POST(request: Request) {
  try {
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

    const { question, cards, spreadId } = body;
    const prompt = buildPrompt(
      cards,
      spreadId || "sentence-3",
      question || "What do the cards show?",
    );

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are Marie-Anne Lenormand. Reply in plain text only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    // Zero-processing passthrough
    return new Response(response.body, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Stream failed",
        reading:
          "The cards whisper their message through the mist. Reflect on the cards' traditional meanings. The answer emerges from within.",
        source: "fallback",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
}
