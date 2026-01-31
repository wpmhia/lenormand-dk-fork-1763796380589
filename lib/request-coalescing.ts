// Request coalescing - deduplicate identical concurrent AI requests
// Industry standard for reducing API costs and server load

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

// Key: hash of request params, Value: pending promise
const pendingRequests = new Map<string, PendingRequest<unknown>>();

// Generate a hash key from request parameters
function generateRequestKey(
  cards: Array<{ id: number; name: string; position: number }>,
  spreadId: string,
  question: string
): string {
  // Sort cards by position for consistent hashing
  const sortedCards = [...cards].sort((a, b) => a.position - b.position);
  const cardsHash = sortedCards.map(c => `${c.id}:${c.position}`).join(",");
  const normalizedQuestion = question.toLowerCase().trim().slice(0, 100);
  return `${cardsHash}|${spreadId}|${normalizedQuestion}`;
}

// Clean up old requests (call periodically)
function cleanupOldRequests(): void {
  const now = Date.now();
  const timeout = 60000; // 60 seconds max wait
  
  for (const [key, pending] of pendingRequests.entries()) {
    if (now - pending.timestamp > timeout) {
      pendingRequests.delete(key);
    }
  }
}

// Coalesce identical requests
export async function coalesceRequest<T>(
  cards: Array<{ id: number; name: string; position: number }>,
  spreadId: string,
  question: string,
  executeRequest: () => Promise<T>
): Promise<T> {
  // Cleanup old requests before adding new one
  cleanupOldRequests();
  
  const key = generateRequestKey(cards, spreadId, question);
  
  const existing = pendingRequests.get(key);
  if (existing) {
    // Return existing promise (deduplication)
    return existing.promise as Promise<T>;
  }
  
  // Create new request
  const promise = executeRequest().finally(() => {
    // Clean up after completion
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, {
    promise: promise as Promise<unknown>,
    timestamp: Date.now(),
  });
  
  return promise;
}

// Response caching for completed readings
interface CachedResponse {
  result: string;
  timestamp: number;
}

const responseCache = new Map<string, CachedResponse>();
const RESPONSE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedReading(
  cards: Array<{ id: number; name: string; position: number }>,
  spreadId: string,
  question: string
): string | null {
  const key = generateRequestKey(cards, spreadId, question);
  const cached = responseCache.get(key);
  
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > RESPONSE_CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  
  return cached.result;
}

export function cacheReading(
  cards: Array<{ id: number; name: string; position: number }>,
  spreadId: string,
  question: string,
  result: string
): void {
  const key = generateRequestKey(cards, spreadId, question);
  responseCache.set(key, {
    result,
    timestamp: Date.now(),
  });
}
