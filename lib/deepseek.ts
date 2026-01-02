import { Spread, AUTHENTIC_SPREADS, MODERN_SPREADS } from "@/lib/spreads";
import { Card } from "@/lib/types";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

export interface AIReadingRequest {
  question: string;
  cards: Array<{
    id: number;
    name: string;
    position: number;
  }>;
  spreadId?: string;
  includeProphecy?: boolean;
}

export interface AIReadingResponse {
  reading: string;
  aiInterpretationId?: string;
  wasContinued?: boolean;
}

export function isDeepSeekAvailable(): boolean {
  return !!DEEPSEEK_API_KEY;
}

function getAllSpreads(): Spread[] {
  return [...AUTHENTIC_SPREADS, ...MODERN_SPREADS];
}

function getSpreadById(spreadId: string): Spread | undefined {
  return getAllSpreads().find((s) => s.id === spreadId);
}

function buildPrompt(
  cards: Array<{ id: number; name: string }>,
  spread: Spread,
  question: string,
): string {
  const cardList = cards
    .map((c, i) => `Card ${i + 1}: ${c.name}`)
    .join("\n");

  return `You are Marie-Anne Lenormand, the famous French fortune teller known for your practical, accurate readings.

You are reading a ${spread.cards}-card "${spread.label}" spread for the question: "${question}"

${spread.description ? `About this spread: ${spread.description}` : ""}

Cards in the spread:
${cardList}

Provide a clear, concise interpretation that:
- Addresses the specific question asked
- Creates a coherent narrative from the cards
- Offers practical guidance

Reply in plain text only, no markdown formatting.`;
}

export async function getAIReading(
  request: AIReadingRequest,
): Promise<AIReadingResponse | null> {
  if (!isDeepSeekAvailable()) {
    throw new Error("DeepSeek API key not configured");
  }

  const startTime = Date.now();
  console.log("getAIReading: Starting AI reading generation...");

  try {
    const spreadId = request.spreadId || "sentence-3";
    const spread = getSpreadById(spreadId);

    if (!spread) {
      throw new Error("Invalid spread ID: " + spreadId);
    }

    const cards: Array<{ id: number; name: string }> = request.cards.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    const prompt = buildPrompt(
      cards,
      spread,
      request.question || "What guidance do these cards have for me?",
    );

    const maxTokens = 1200;
    console.log("Sending request to DeepSeek API...");

    const messages = [
      {
        role: "system",
        content:
          "You are Marie-Anne Lenormand. Follow all instructions. Reply in plain text only.",
      },
      { role: "user", content: prompt },
    ];

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.4,
        max_tokens: maxTokens,
        top_p: 0.9,
      }),
    });

    console.log("DeepSeek API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log("DeepSeek API response data received");
    const content = data.choices?.[0]?.message?.content;
    const finishReason = data.choices?.[0]?.finish_reason;

    if (!content) {
      throw new Error("DeepSeek returned empty content");
    }

    let fullContent = content.trim();
    let wasContinued = false;
    let continuationCount = 0;
    const maxContinuations = 3;

    while (finishReason === "length" && continuationCount < maxContinuations) {
      console.log(
        `Response truncated, continuing (${continuationCount + 1}/${maxContinuations})...`,
      );
      wasContinued = true;
      continuationCount++;

      messages.push({ role: "assistant", content: fullContent });
      messages.push({
        role: "user",
        content: "Continue from where you left off. Do not repeat what you already said.",
      });

      const continueResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          temperature: 0.4,
          max_tokens: maxTokens,
          top_p: 0.9,
        }),
      });

      if (!continueResponse.ok) {
        console.warn("Continuation request failed, using partial response");
        break;
      }

      const continueData = await continueResponse.json();
      const continueContent = continueData.choices?.[0]?.message?.content;
      const continueFinishReason = continueData.choices?.[0]?.finish_reason;

      if (continueContent) {
        fullContent += continueContent.trim();
        console.log(`Continuation received, total length: ${fullContent.length}`);
      }

      if (continueFinishReason !== "length") {
        break;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`AI reading generated in ${duration}ms`);

    return {
      reading: fullContent,
      wasContinued,
    };
  } catch (error) {
    console.error("AI reading error:", error);
    throw error;
  }
}

export async function streamAIReading(
  request: AIReadingRequest,
): Promise<ReadableStream<Uint8Array> | null> {
  console.log("streamAIReading: Checking availability...");
  if (!isDeepSeekAvailable()) {
    console.log("DeepSeek not available");
    throw new Error("DeepSeek API key not configured");
  }

  console.log("DeepSeek is available. Preparing streaming request...");

  try {
    const spreadId = request.spreadId || "sentence-3";
    const spread = getSpreadById(spreadId);

    if (!spread) {
      throw new Error("Invalid spread ID: " + spreadId);
    }

    const cards: Array<{ id: number; name: string }> = request.cards.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    const prompt = buildPrompt(
      cards,
      spread,
      request.question || "What guidance do these cards have for me?",
    );

    const maxTokens = 1200;
    console.log("Sending streaming request to DeepSeek API...");

    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
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
            content:
              "You are Marie-Anne Lenormand. Follow all instructions. Reply in plain text only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: maxTokens,
        top_p: 0.9,
        stream: true,
      }),
    });

    console.log("DeepSeek streaming API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    return response.body;
  } catch (error) {
    console.error("AI reading setup error:", error);
    throw error;
  }
}
