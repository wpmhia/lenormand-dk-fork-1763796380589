/**
 * SSE (Server-Sent Events) Parser
 * 
 * Shared utility for parsing SSE streams with proper line buffering.
 * Handles edge cases where network packets split mid-JSON or mid-UTF8.
 */

export interface SSEChunk {
  type: "chunk" | "done" | "error";
  content?: string;
  error?: string;
  message?: string;
}

/**
 * Parse a single SSE line into structured data
 * @param line - Line starting with "data: "
 * @returns Parsed object or null if invalid
 */
export function parseSSELine(line: string): SSEChunk | null {
  if (!line.startsWith("data: ")) return null;
  
  const data = line.slice(6);
  if (data === "[DONE]") return { type: "done" };
  
  try {
    return JSON.parse(data) as SSEChunk;
  } catch {
    // Incomplete JSON - will be retried when more data arrives
    return null;
  }
}

/**
 * Process SSE stream chunk with proper line buffering
 * Handles packets that split mid-JSON by keeping incomplete lines in buffer
 * 
 * @param chunk - Raw data from stream
 * @param buffer - Previously buffered incomplete line
 * @returns Object with parsed events and new buffer state
 */
export function processSSEChunk(
  chunk: string,
  buffer: string
): { events: SSEChunk[]; buffer: string } {
  // Add new chunk to existing buffer
  buffer += chunk;
  
  // Split into lines, keeping track of incomplete final line
  const lines = buffer.split("\n");
  buffer = lines[lines.length - 1]; // Keep last (possibly incomplete) line
  
  // Parse all complete lines
  const events: SSEChunk[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const parsed = parseSSELine(lines[i]);
    if (parsed) {
      events.push(parsed);
    }
  }
  
  return { events, buffer };
}

/**
 * Finalize stream parsing and process any remaining buffered data
 * Call this after the stream ends to ensure no data is lost
 * 
 * @param buffer - Final buffered line
 * @returns Any remaining events
 */
export function finalizeSSEStream(buffer: string): SSEChunk[] {
  if (!buffer.trim()) return [];
  
  const parsed = parseSSELine(buffer);
  return parsed ? [parsed] : [];
}
