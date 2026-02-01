// Streaming configuration and feature flag
// Set to false to use legacy job polling (for rollback)
export const USE_STREAMING = true;

// Token budgets - complete readings without truncation
export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 3) return 800; // Complete 3-card reading (~400-500 words)
  if (cardCount <= 5) return 1400; // Complete 5-card reading
  if (cardCount <= 9) return 2000; // Complete 9-card reading
  return 3000; // Grand Tableau (36 cards)
}

// Timeout budgets - Vercel Free plan max is 10s, Pro is 60s
// Adjust these based on your plan. For Free plan, use 8000ms (8s) to be safe
export function getTimeoutMs(cardCount: number): number {
  // Use 8s for Free plan compatibility (leaves 2s buffer for Vercel's 10s limit)
  // For Pro plan, you can increase these values
  if (cardCount <= 3) return 8000;  // 8s for 3 cards (Free plan safe)
  if (cardCount <= 5) return 8000;  // 8s for 5 cards (Free plan safe)
  if (cardCount <= 9) return 8000;  // 8s for 9 cards (Free plan safe)
  return 10000; // 10s max for Grand Tableau (Free plan limit)
}

// Parse SSE stream data
export function parseSSEChunk(chunk: string): string {
  const lines = chunk.split('\n');
  let content = '';
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          content += delta;
        }
      } catch {
        // Ignore parse errors for incomplete chunks
      }
    }
  }
  
  return content;
}

// Check if markdown is complete (no unclosed tags)
export function isCompleteMarkdown(text: string): boolean {
  // Check for unclosed bold/italic
  const boldCount = (text.match(/\*\*/g) || []).length;
  const italicCount = (text.match(/(?<!\*)\*(?!\*)/g) || []).length;
  
  // Check for unclosed headers
  const headerLines = text.split('\n').filter(l => l.startsWith('#'));
  
  // Simple heuristic: even number of ** and *
  return boldCount % 2 === 0 && italicCount % 2 === 0;
}
