export const dynamic = "force-dynamic";

import { buildPrompt, getMaxTokens, isDeepSeekAvailable } from "@/lib/ai-config";
import { deepseek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';

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

    if (_fallback) {
      // Non-streaming fallback for compatibility
      const result = await streamText({
        model: deepseek('deepseek-chat'),
        messages: [
          { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      });

      const text = await result.text;
      return new Response(
        JSON.stringify({ reading: text }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Streaming response using AI SDK
    const result = await streamText({
      model: deepseek('deepseek-chat'),
      messages: [
        { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    return result.toTextStreamResponse();

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