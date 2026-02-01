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

// Timeout budgets - allow enough time for complete generation
export function getTimeoutMs(cardCount: number): number {
  if (cardCount <= 3) return 20000; // 20s for 3 cards
  if (cardCount <= 5) return 30000; // 30s for 5 cards
  if (cardCount <= 9) return 45000; // 45s for 9 cards
  return 60000; // 60s for Grand Tableau
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
