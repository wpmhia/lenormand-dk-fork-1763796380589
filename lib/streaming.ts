// Token budgets - optimized for faster responses while maintaining quality
// Reduced from previous values to speed up API responses and reduce timeouts
export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 3) return 600;   // 3-card: ~300-400 words (reduced from 800)
  if (cardCount <= 5) return 900;   // 5-card: ~450-600 words (reduced from 1200)
  if (cardCount <= 9) return 1200;  // 9-card: ~600-800 words (reduced from 1600)
  return 2000;                      // Grand Tableau: ~1000-1300 words (reduced from 2800)
}

// Timeout budgets - Vercel Free plan max is 10s, Pro is 60s
// Allow sufficient time for complete responses without truncation
export function getTimeoutMs(cardCount: number): number {
  if (cardCount <= 3) return 8000;   // 8s for 3-card: allow full response
  if (cardCount <= 5) return 9000;   // 9s for 5-card: allow complete reading
  if (cardCount <= 9) return 9500;   // 9.5s for 9-card: stay under 10s maxDuration
  return 9500;                       // 9.5s for Grand Tableau (stay under 10s maxDuration)
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
