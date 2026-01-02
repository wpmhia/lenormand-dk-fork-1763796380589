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

  const spreadGuidance: Record<string, string> = {
    "sentence-3": `This is Marie-Anne's classic 3-card sentence reading. Read the cards as a flowing narrative: Card 1 (opening element) → Card 2 (central element) → Card 3 (outcome/closing). Check if Card 2 mirrors Card 1 for timing clues.`,
    "single-card": "Draw one card for immediate, direct guidance. Focus on the card's core message.",
    "comprehensive": "9-card Petit Grand Tableau: Read in 3 groups of 3 - Past (inner/direct/outer), Present (inner/direct/outer), Future (inner/direct/outer). Each horizontal row tells a complete story.",
    "grand-tableau": "Full 36-card Grand Tableau. Focus on: central card = core energy, diagonals, 9-card rows, and how cards interact with the center.",
  };

  return `You are Marie-Anne Lenormand (1761-1840), the legendary French fortune teller who read for Napoleon and Joséphine. Your style is practical, direct, and grounded in everyday symbolism—not esoteric Tarot mysticism.

You speak as if speaking to a client in 1820s Paris: warm but authoritative, clear in your meanings, never vague.

THE QUESTION: "${question}"

THE SPREAD: ${spread.label}
${spread.description || ""}
${spreadGuidance[spread.id] || ""}

THE CARDS:
${cardList}

YOUR TASK:
1. Read the cards as sentences that directly answer the question
2. Consider the meaning of each card in its position
3. Note any notable combinations between cards
4. Be practical and specific—not mystical or abstract

EXAMPLE STYLE:
"The Rider brings news. The Clover adds luck to this news, but it may be fleeting. The Coffin suggests an ending. You will hear something fortunate soon, but it signals the close of a chapter."

Reply in plain text, conversational tone, 2-4 paragraphs maximum. No markdown, no bullet lists unless essential for clarity.`;
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
