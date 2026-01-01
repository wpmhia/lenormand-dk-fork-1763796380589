/**
 * Reading response caching utilities
 * Caches identical readings based on cards and spread configuration
 */

import { readingCache } from "./cache";
import { AIReadingRequest, AIReadingResponse } from "./deepseek";

/**
 * Generate cache key from request parameters
 * Creates a unique key based on cards (sorted), spread, and question
 */
export function generateReadingCacheKey(request: AIReadingRequest): string {
  // Sort cards by ID to ensure consistent cache hits
  const sortedCards = [...request.cards]
    .sort((a, b) => a.id - b.id)
    .map((c) => `${c.id}:${c.name}`)
    .join(",");

  const spreadId = request.spreadId || "sentence-3";
  const question = (request.question || "").trim().toLowerCase();

  return `reading_${spreadId}_${sortedCards}_${question}`;
}

/**
 * Get cached reading or null if not found/expired
 */
export function getCachedReading(
  request: AIReadingRequest,
): AIReadingResponse | null {
  const key = generateReadingCacheKey(request);
  return readingCache.get(key);
}

/**
 * Cache a reading response
 * @param request Original request
 * @param response Response to cache
 * @param ttlSeconds Time to live in seconds (default: 10 minutes)
 */
export function cacheReading(
  request: AIReadingRequest,
  response: AIReadingResponse,
  ttlSeconds: number = 600,
): void {
  const key = generateReadingCacheKey(request);
  readingCache.set(key, response, ttlSeconds);
}

/**
 * Check if reading is cached
 */
export function isReadingCached(request: AIReadingRequest): boolean {
  const key = generateReadingCacheKey(request);
  return readingCache.has(key);
}

/**
 * Clear all reading cache
 */
export function clearReadingCache(): void {
  readingCache.clear();
}

/**
 * Get cache statistics
 */
export function getReadingCacheStats() {
  return readingCache.stats();
}
