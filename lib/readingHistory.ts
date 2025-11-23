/**
 * Reading history tracker
 * Keeps track of recent readings for analytics and user experience
 */

import { AIReadingRequest, AIReadingResponse } from './deepseek'

interface ReadingEntry {
  request: AIReadingRequest
  response: AIReadingResponse
  timestamp: number
  duration: number // milliseconds
}

class ReadingHistory {
  private entries: ReadingEntry[] = []
  private maxEntries: number = 1000

  /**
   * Add a reading to history
   */
  addReading(request: AIReadingRequest, response: AIReadingResponse, duration: number): void {
    this.entries.push({
      request,
      response,
      timestamp: Date.now(),
      duration
    })

    // Keep only the most recent entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries)
    }
  }

  /**
   * Get all readings
   */
  getAll(): ReadingEntry[] {
    return [...this.entries]
  }

  /**
   * Get recent readings (limit)
   */
  getRecent(limit: number = 10): ReadingEntry[] {
    return this.entries.slice(-limit)
  }

  /**
   * Get readings by spread
   */
  getBySpread(spreadId: string): ReadingEntry[] {
    return this.entries.filter(e => (e.request.spreadId || 'sentence-3') === spreadId)
  }

  /**
   * Get statistics
   */
  getStats() {
    if (this.entries.length === 0) {
      return {
        totalReadings: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        spreads: {}
      }
    }

    const durations = this.entries.map(e => e.duration)
    const spreadCounts: Record<string, number> = {}

    this.entries.forEach(e => {
      const spreadId = e.request.spreadId || 'sentence-3'
      spreadCounts[spreadId] = (spreadCounts[spreadId] || 0) + 1
    })

    return {
      totalReadings: this.entries.length,
      averageDuration: Math.round(durations.reduce((a, b) => a + b) / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      spreads: spreadCounts
    }
  }

  /**
   * Clear history
   */
  clear(): void {
    this.entries = []
  }

  /**
   * Get total number of readings
   */
  getCount(): number {
    return this.entries.length
  }

  /**
   * Get average response duration
   */
  getAverageDuration(): number {
    if (this.entries.length === 0) return 0
    const total = this.entries.reduce((sum, e) => sum + e.duration, 0)
    return Math.round(total / this.entries.length)
  }

  /**
   * Export history for analytics
   */
  export() {
    return {
      entries: this.entries,
      exportedAt: new Date().toISOString(),
      stats: this.getStats()
    }
  }
}

// Create singleton instance
export const readingHistory = new ReadingHistory()

export default ReadingHistory
