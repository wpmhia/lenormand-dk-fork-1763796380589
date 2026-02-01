// Token budgets - reduced for minimal prompt approach
// With natural output format, we need fewer tokens than rigid structured format
export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 3) return 400;   // ~200-300 words natural flow
  if (cardCount <= 5) return 600;   // ~300-450 words
  if (cardCount <= 9) return 800;   // ~400-600 words
  return 1500;                      // Grand Tableau: 3-paragraph synthesis
}

// Timeout budgets - Vercel Free plan max is 10s, Pro is 60s
// Reduced timeouts since minimal prompts generate faster
export function getTimeoutMs(cardCount: number): number {
  if (cardCount <= 3) return 6000;   // 6s for 3 cards (faster with minimal prompt)
  if (cardCount <= 5) return 7000;   // 7s for 5 cards
  if (cardCount <= 9) return 8000;   // 8s for 9 cards
  return 10000;                      // 10s max for Grand Tableau
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
