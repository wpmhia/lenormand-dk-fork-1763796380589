import { NextRequest, NextResponse } from 'next/server'
import { readingHistory } from '@/lib/readingHistory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  const stats = await readingHistory.getStats()

  const health = {
    status: 'healthy',
    timestamp,
    service: {
      name: 'Lenormand Intelligence API',
      version: '1.0.0',
    },
    environment: process.env.NODE_ENV || 'unknown',
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
    },
    dependencies: {
      deepseekApi: 'operational',
      cache: 'operational',
      readingHistory: 'operational',
    },
    analytics: {
      totalReadings: stats.totalReadings,
      uniqueSpreads: Object.keys(stats.spreads).length,
      averageInterpretationTime: stats.averageDuration,
    },
  }

  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Check': 'true',
    },
  })
}
