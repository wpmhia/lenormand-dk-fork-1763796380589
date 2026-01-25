export const runtime = "edge";
export const dynamic = "force-dynamic";

import { buildPrompt, getMaxTokens, isDeepSeekAvailable } from "@/lib/ai-config";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  categorizeQuestion,
  generateUniqueInterpretation,
  getCachedReading,
  setCachedReading
} from "@/lib/interpretation-cache";

// Timeout configuration (milliseconds)
const TIMEOUT_MS = 14000; // 14 seconds timeout
const TIMEOUT_MESSAGE = "AI interpretation timed out. Here's a guided reflection on your reading:\n\n";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

const deepseek = createOpenAI({
  baseURL: DEEPSEEK_BASE_URL,
  apiKey: DEEPSEEK_API_KEY,
});

function formatUniqueInterpretation(
  uniqueInterpretation: any,
  cards: Array<{ id: number; name: string }>,
  spreadId: string,
  question: string
): string {
  const cardNames = cards.map(c => c.name).join(', ');
  
  let interpretation = `🔮 Fortune Telling Reading 🔮\n\n`;
  interpretation += `Question: "${question}"\n\n`;
  interpretation += `Cards: ${cardNames}\n\n`;
  
  if (uniqueInterpretation.meaning) {
    interpretation += `🌟 Divine Message: ${uniqueInterpretation.meaning}\n\n`;
  }
  
  if (uniqueInterpretation.context) {
    interpretation += `🎭 Cards' Dance: ${uniqueInterpretation.context}\n\n`;
  }
  
  if (uniqueInterpretation.examples && uniqueInterpretation.examples.length > 0) {
    interpretation += `💫 Whispers: ${uniqueInterpretation.examples.slice(0, 2).join('; ')}\n\n`;
  }
  
  // Add mystical guidance
  interpretation += `🌙 Energy: ${uniqueInterpretation.strength} | Fate: ${uniqueInterpretation.category}\n\n`;
  
  interpretation += '✨ Unique moment captured ✨';
  
  return interpretation;
}

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
    const questionCategory = categorizeQuestion(question);
    
    // Generate UNIQUE reading for true fortune telling
    const uniqueInterpretation = generateUniqueInterpretation(
      cards, 
      spreadId || "sentence-3", 
      questionCategory,
      question
    );
    
    if (uniqueInterpretation) {
      const interpretationText = formatUniqueInterpretation(uniqueInterpretation, cards, spreadId || "sentence-3", question);
      
      if (_fallback) {
        return new Response(
          JSON.stringify({ 
            reading: interpretationText, 
            source: 'unique-static',
            fortuneTelling: 'true',
            randomGeneration: 'millisecond-precision'
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Return unique interpretation as stream
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const data = JSON.stringify({
            choices: [{ delta: { content: interpretationText } }]
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Cache-Source": "unique-static",
          "X-Fortune-Telling": "true",
          "X-Randomness": "millisecond-precision",
        },
      });
    }

    // Create AbortController for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

    try {
      const result = await streamText({
        model: deepseek.chat("deepseek-chat"),
        messages: [
          { role: "system", content: "You are Marie-Anne Lenormand. Reply in plain text only." },
          { role: "user", content: buildPrompt(cards, spreadId || "sentence-3", question) },
        ],
        temperature: 0.4,
        maxOutputTokens: getMaxTokens(cards.length),
        abortSignal: abortController.signal,
      });

      // If fallback is requested, await the full text and return JSON
      if (_fallback) {
        clearTimeout(timeoutId);
        const text = await result.text;
        // Cache the AI response
        setCachedReading('ai-response', text, 'ai');
        return new Response(
          JSON.stringify({ reading: text, source: 'ai' }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Stream response in OpenAI-compatible SSE format for frontend compatibility
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
             // Handle timeout gracefully - return partial response or fallback message
             // Note: result.textStream throws on abort
             if (error instanceof Error && error.name === 'AbortError') {
               console.warn('DeepSeek request timeout after 14s');
               const fallbackMessage = `\n\n${TIMEOUT_MESSAGE}Consider the key themes, energy, and message of each card in relation to your question.`;
               const data = JSON.stringify({
                 choices: [{ delta: { content: fallbackMessage } }]
               });
               controller.enqueue(encoder.encode(`data: ${data}\n\n`));
               controller.enqueue(encoder.encode("data: [DONE]\n\n"));
             } else {
               controller.error(error);
             }
          } finally {
            clearTimeout(timeoutId);
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Cache-Source": "ai",
        },
      });

    } catch (error) {
       clearTimeout(timeoutId);
       throw error;
    }

  } catch (error) {
    // Handle timeout with graceful fallback (top-level catch)
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('API timeout: returning fallback response');
      const fallbackReading = `${TIMEOUT_MESSAGE}Consider the key themes, energy, and message of each card in relation to your question.`;
      return new Response(
        JSON.stringify({
          reading: fallbackReading,
          wasContinued: true,
          timedOut: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
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