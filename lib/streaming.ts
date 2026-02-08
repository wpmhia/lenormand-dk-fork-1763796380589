// Token budgets - allow full responses without truncation
// Most Lenormand readings need 400-800 tokens for complete sentences
// Increased buffers to prevent sentence fragment issues (was 600/800/1200)
export function getTokenBudget(cardCount: number): number {
  if (cardCount <= 3) return 800;   // 3-card: Generous buffer (~400-500 words)
  if (cardCount <= 5) return 1200;  // 5-card: Prevent truncation on longer readings
  if (cardCount <= 9) return 1600;  // 9-card: Allow detailed 2-paragraph response
  return 2800;                      // Grand Tableau: Full narrative room
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
