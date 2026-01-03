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
    "single-card": ["The Card"],
    "sentence-3": ["Opening Card", "Central Card", "Closing Card"],
    "past-present-future": ["Past", "Present", "Future"],
    "yes-no-maybe": ["First Card", "Center Card", "Third Card"],
    "situation-challenge-advice": ["Situation", "Challenge", "Advice"],
    "mind-body-spirit": ["Mind", "Body", "Spirit"],
    "sentence-5": ["Element 1", "Element 2", "Element 3", "Element 4", "Element 5"],
    "structured-reading": ["Subject", "Verb", "Object", "Modifier", "Outcome"],
    "week-ahead": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
    "relationship-double-significator": [
      "Partner 1 - Past",
      "Partner 1 - Present",
      "Relationship Core",
      "Partner 2 - Present",
      "Partner 2 - Future",
    ],
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

  const spreadGuidance: Record<string, string> = {
    "single-card": "One card for immediate, direct guidance. Focus on its core message and how it applies to the question.",
    "sentence-3": "Classic 3-card sentence: Opening (situation) → Central (turning point) → Closing (outcome).",
    "past-present-future": "Time-based: Past influences → Current situation → Likely outcome.",
    "yes-no-maybe": "Count positive vs negative cards. Equal = tie-breaker decides. Be direct.",
    "situation-challenge-advice": "Diagnostic: What's happening → What's blocking you → What to do about it.",
    "mind-body-spirit": "Holistic: Mental state → Physical/reality → Spiritual/emotional guidance.",
    "sentence-5": "Extended narrative flow: 5 cards creating a complete story arc.",
    "structured-reading": "Analytical: Subject → Action → Impact → Conditions → Result.",
    "week-ahead": "Daily structure with action model for each day of the week.",
    "relationship-double-significator": "Two-person reading with central relationship dynamic.",
    "comprehensive": "9-card Petit Grand Tableau: 3 rows of 3 - Past, Present, Future (each with inner/action/external).",
    "grand-tableau": "Full 36-card Grand Tableau: Center = core energy, diagonals, 9-card rows, card interactions.",
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

    const isLargeSpread = spread.cards >= 9;
    const maxTokens = isLargeSpread ? 4000 : 2000;
    const maxContinuations = isLargeSpread ? 5 : 3;
    console.log(`Sending request to DeepSeek API... (${maxTokens} tokens, max ${maxContinuations} continuations)`);

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

    const isLargeSpread = spread.cards >= 9;
    const maxTokens = isLargeSpread ? 4000 : 2000;

    // Retry logic for rate limiting
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limit hit, waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

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

      // Retry on 429 (rate limit) or 503 (service unavailable)
      if (response.status === 429 || response.status === 503) {
        lastError = new Error(`Rate limited: ${response.status}`);
        continue;
      }

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
    }

    throw lastError || new Error("Max retries exceeded");
  } catch (error) {
    console.error("AI reading setup error:", error);
    throw error;
  }
}
