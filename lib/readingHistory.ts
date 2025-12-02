import prisma from './prisma'
import { AIReadingRequest, AIReadingResponse } from './deepseek'

export const readingHistory = {
  async addReading(request: AIReadingRequest, response: AIReadingResponse, duration: number) {
    try {
      await prisma.reading.create({
        data: {
          request: request as any,
          response: response as any,
          duration,
        }
      })
    } catch (error) {
      console.error('Failed to save reading to database:', error)
    }
  },

  async getStats() {
    try {
      const totalReadings = await prisma.reading.count()
      
      if (totalReadings === 0) {
        return {
          totalReadings: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          spreads: {}
        }
      }

      const aggregations = await prisma.reading.aggregate({
        _avg: { duration: true },
        _min: { duration: true },
        _max: { duration: true }
      })

      // Grouping by JSON field is database-specific and complex with Prisma type safety
      // Returning empty spreads for now to ensure stability
      const spreads: Record<string, number> = {}

      return {
        totalReadings,
        averageDuration: Math.round(aggregations._avg.duration || 0),
        minDuration: aggregations._min.duration || 0,
        maxDuration: aggregations._max.duration || 0,
        spreads
      }
    } catch (error) {
      console.error('Error fetching reading stats:', error)
      return {
        totalReadings: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        spreads: {}
      }
    }
  }
}

export default readingHistory
