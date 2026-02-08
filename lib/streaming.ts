// Token budgets - reduced for minimal prompt approach and Vercel free plan optimization
// With natural output format, we need fewer tokens than rigid structured format
export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 3) return 300;   // Reduced from 400: ~150-250 words natural flow
  if (cardCount <= 5) return 500;   // Reduced from 600: ~250-400 words
  if (cardCount <= 9) return 700;   // Reduced from 800: ~350-550 words
  return 2200;                      // Reduced from 2500: Grand Tableau still comprehensive but more efficient
}

// Timeout budgets - Vercel Free plan max is 10s, Pro is 60s
// Reduced timeouts to minimize CPU usage and stay within free tier limits
export function getTimeoutMs(cardCount: number): number {
  if (cardCount <= 3) return 5000;   // Reduced from 6s: 5s for 3 cards
  if (cardCount <= 5) return 6000;   // Reduced from 7s: 6s for 5 cards
  if (cardCount <= 9) return 7000;   // Reduced from 8s: 7s for 9 cards
  return 9500;                      // Reduced from 25s: 9.5s for Grand Tableau (stay under 10s maxDuration)
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
