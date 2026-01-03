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

  const positionLabels: Record<string, string[]> = {
    "sentence-3": ["Opening Card", "Central Card", "Closing Card"],
    "single-card": ["The Card"],
    "comprehensive": [
      "Recent Past - Inner World",
      "Recent Past - Direct Actions",
      "Recent Past - Outside World",
      "Present - Inner World",
      "Present - Direct Actions",
      "Present - Outside World",
      "Near Future - Inner World",
      "Near Future - Direct Actions",
      "Near Future - Outside World",
    ],
    "grand-tableau": Array.from({ length: 36 }, (_, i) => `Position ${i + 1}`),
  };

  const positions = positionLabels[spread.id] || cards.map((_, i) => `Position ${i + 1}`);

  const spreadGuidance: Record<string, string> = {
    "sentence-3": `This is the classic 3-card sentence reading:
- Opening Card: The situation/energy surrounding the question
- Central Card: The core of the matter, the turning point
- Closing Card: The outcome or near-future atmosphere
Write a flowing narrative that connects all three.`,
    "single-card": "One card for direct, immediate guidance. Focus on its core message.",
    "comprehensive": "9-card Petit Grand Tableau: Read in 3 groups of 3 - Past (inner/direct/outer), Present (inner/direct/outer), Future (inner/direct/outer). Each horizontal row tells a complete story.",
    "grand-tableau": "Full 36-card Grand Tableau. Focus on: central card = core energy, diagonals, 9-card rows, and how cards interact with the center.",
  };

  return `You are Marie-Anne Lenormand (1761-1840), the legendary French fortune teller who read for Napoleon and Joséphine. Your style is practical, grounded, and specific—not vague or mystical.

THE QUESTION: "${question}"

THE SPREAD: ${spread.label}
${spread.description || ""}

${spreadGuidance[spread.id] || ""}

THE CARDS:
${cardList}

YOUR TASK - Structure your response exactly as follows:

## Card-by-Card Analysis
For each card in order, write 2-3 sentences explaining:
- The card's name and its position label (e.g., "Opening Card")
- What the card means in the context of the question
- How it connects to the overall reading

## The Narrative Sentence
One concise sentence summarizing the entire reading: "[Opening card meaning] leads to [central card meaning], resulting in [closing card meaning]."

## Coherent Story
2-3 paragraphs expanding on the narrative. Explain the journey from start to outcome. Be specific about what the cards reveal—not abstract generalizations.

## Clear Guidance & Action Steps
Provide actionable advice with:
- What the querent should do (or not do)
- Key considerations or warnings
- If timing is indicated, estimate when events may unfold

Reply in plain text. Be practical, direct, and helpful like Marie-Anne would speak to a client in 1820s Paris.`;
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

    const maxTokens = 2000;
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

    const maxTokens = 2000;
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
