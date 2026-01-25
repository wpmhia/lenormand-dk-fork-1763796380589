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
import { getInterpretationWithCache } from "@/lib/response-cache";

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
   let body: any;
   try {
     body = await request.json();

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

    // Create AbortController for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

    try {
      // Use caching layer to get interpretation (handles deduplication + cache)
      const responseText = await getInterpretationWithCache(
        {
          question,
          cardIds: cards.map((c: any) => c.id),
          spreadId: spreadId || 'sentence-3'
        },
        async () => {
          // This function only runs on cache miss
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

          return await result.text;
        }
      );

      // If fallback is requested, return JSON
      if (_fallback) {
        clearTimeout(timeoutId);
        return new Response(
          JSON.stringify({ reading: responseText, source: 'ai', cached: true }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Stream response in OpenAI-compatible SSE format for frontend compatibility
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            // Stream the cached/fresh response
            const data = JSON.stringify({
              choices: [{ delta: { content: responseText } }]
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (error) {
             // Handle errors gracefully
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
     // Handle timeout or API errors with graceful fallback to static interpretation
     const questionCategory = categorizeQuestion(body?.question || '');
     const uniqueInterpretation = generateUniqueInterpretation(
       body?.cards || [], 
       body?.spreadId || "sentence-3", 
       questionCategory,
       body?.question || ''
     );
     
     if (uniqueInterpretation) {
       console.warn('DeepSeek API failed, using static interpretation:', error instanceof Error ? error.message : String(error));
       const interpretationText = formatUniqueInterpretation(uniqueInterpretation, body?.cards || [], body?.spreadId || "sentence-3", body?.question || '');
       
       return new Response(
         JSON.stringify({
           reading: interpretationText,
           source: 'static-fallback',
           apiError: error instanceof Error ? error.message : String(error),
         }),
         {
           status: 200,
           headers: {
             "Content-Type": "application/json",
           },
         }
       );
     }
     
     // Final fallback if everything fails
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