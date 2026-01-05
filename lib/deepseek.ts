import { Spread, AUTHENTIC_SPREADS, MODERN_SPREADS } from "@/lib/spreads";
import { Card } from "@/lib/types";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

const POSITION_LABELS: Record<string, string[]> = {
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
    "Your Past",
    "Your Present",
    "Your Future",
    "Connection",
    "Their Past",
    "Their Present",
    "Their Future",
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

const SPREAD_GUIDANCE: Record<string, string> = {
  "single-card": "One card for immediate, direct guidance. Focus on its core message and how it applies to the question.",
  "sentence-3": "Classic 3-card sentence: Opening (situation) → Central (turning point) → Closing (outcome).",
  "past-present-future": "Time-based: Past influences → Current situation → Likely outcome.",
  "yes-no-maybe": "YES or NO answer. Count positive vs negative cards. More positive = YES. More negative = NO. Equal = CONDITIONAL/TIE.",
  "situation-challenge-advice": "Diagnostic: What's happening → What's blocking you → What to do about it.",
  "mind-body-spirit": "Holistic: Mental state → Physical/reality → Spiritual/emotional guidance.",
  "sentence-5": "Extended narrative flow: 5 cards creating a complete story arc.",
  "structured-reading": "Analytical: Subject → Action → Impact → Conditions → Result.",
  "week-ahead": "Daily structure with action model for each day of the week.",
  "relationship-double-significator": "Two-person reading with central relationship dynamic.",
  "comprehensive": "9-card Petit Grand Tableau: 3 rows of 3 - Past, Present, Future (each with inner/action/external).",
  "grand-tableau": "Full 36-card Grand Tableau: Center = core energy, diagonals, 9-card rows, card interactions.",
};

function getMaxTokens(spreadCards: number): number {
  if (spreadCards <= 3) return 800;
  if (spreadCards <= 5) return 1200;
  if (spreadCards < 9) return 2000;
  return 2500;
}

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

  const positionLabels = POSITION_LABELS[spread.id] || [];
  const spreadGuidance = SPREAD_GUIDANCE[spread.id] || "";

  const isYesNo = spread.id === "yes-no-maybe";

  const structure = isYesNo
    ? `STRUCTURE:
1. VERDICT: YES | NO | CONDITIONAL (first line, bold)
2. Cards: Brief meaning of each card (1-2 sentences)
3. Reasoning: Why the verdict based on card energies`
    : `STRUCTURE:
1. Cards: 2-3 sentences per card with meaning and position
2. Summary: One sentence connecting all cards
3. Story: 2-3 paragraphs on the journey and outcome
4. Action: Clear advice—what to do, warnings, timing if relevant`;

  return `You are Marie-Anne Lenormand, a practical French fortune teller (1761-1840). Be direct and specific—never vague or mystical.

QUESTION: "${question}"

SPREAD: ${spread.label}
${spread.description || ""}
${spreadGuidance}

CARDS:
${cardList}

${structure}

Be practical and helpful.`;
}

export async function getAIReading(
  request: AIReadingRequest,
): Promise<AIReadingResponse | null> {
  if (!isDeepSeekAvailable()) {
    throw new Error("DeepSeek API key not configured");
  }

  const startTime = Date.now();

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

    const maxTokens = getMaxTokens(spread.cards);
    const isLargeSpread = spread.cards >= 9;
    const maxContinuations = isLargeSpread ? 5 : 3;

    const messages = [
      {
        role: "system",
        content: "You are Marie-Anne Lenormand. Reply in plain text only.",
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Failed to parse DeepSeek API response");
    }
    const content = data.choices?.[0]?.message?.content;
    const finishReason = data.choices?.[0]?.finish_reason;

    if (!content) {
      throw new Error("DeepSeek returned empty content");
    }

    let fullContent = content.trim();
    let wasContinued = false;
    let continuationCount = 0;

    while (finishReason === "length" && continuationCount < maxContinuations) {
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
        break;
      }

      const continueData = await continueResponse.json();
      const continueContent = continueData.choices?.[0]?.message?.content;
      const continueFinishReason = continueData.choices?.[0]?.finish_reason;

      if (continueContent) {
        fullContent += continueContent.trim();
      }

      if (continueFinishReason !== "length") {
        break;
      }
    }

    return {
      reading: fullContent,
      wasContinued,
    };
  } catch (error) {
    throw error;
  }
}

export async function streamAIReading(
  request: AIReadingRequest,
): Promise<ReadableStream<Uint8Array> | null> {
  if (!isDeepSeekAvailable()) {
    throw new Error("DeepSeek API key not configured");
  }

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

    const maxTokens = getMaxTokens(spread.cards);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        const waitTime = Math.pow(2, attempt) * 1000;
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
              content: "You are Marie-Anne Lenormand. Reply in plain text only.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: maxTokens,
          top_p: 0.9,
          stream: true,
        }),
        });

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
    throw error;
  }
}
