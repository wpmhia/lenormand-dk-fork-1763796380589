// Streaming configuration and feature flag
// Set to false to use legacy job polling (for rollback)
export const USE_STREAMING = true;

// Token budgets optimized for speed
export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 3) return 400; // Fastest for simple spreads
  if (cardCount <= 5) return 700;
  if (cardCount <= 9) return 1000;
  return 1500; // Grand Tableau
}

// Timeout budgets (slightly longer than expected AI time)
export function getTimeoutMs(cardCount: number): number {
  if (cardCount <= 3) return 15000; // 15s for 3 cards
  if (cardCount <= 5) return 20000; // 20s for 5 cards
  if (cardCount <= 9) return 25000; // 25s for 9 cards
  return 35000; // 35s for Grand Tableau
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
