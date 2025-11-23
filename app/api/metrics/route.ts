import { NextRequest, NextResponse } from 'next/server'
import { readingHistory } from '@/lib/readingHistory'
import { PrometheusMetrics } from '@/lib/metrics'

export async function GET(request: NextRequest) {
  const prometheusMetrics = new PrometheusMetrics()

  const stats = readingHistory.getStats()
  const memoryUsage = process.memoryUsage()

  prometheusMetrics.addMetric(
    'lenormand_api_readings_total',
    stats.totalReadings,
    'Total number of readings generated'
  )

  prometheusMetrics.addMetric(
    'lenormand_api_spreads_unique',
    Object.keys(stats.spreads).length,
    'Number of unique spreads used'
  )

  prometheusMetrics.addMetric(
    'lenormand_api_interpretation_duration_ms',
    stats.averageDuration,
    'Average interpretation duration in milliseconds',
    'gauge'
  )

  prometheusMetrics.addMetric(
    'lenormand_api_interpretation_min_ms',
    stats.minDuration,
    'Minimum interpretation duration in milliseconds',
    'gauge'
  )

  prometheusMetrics.addMetric(
    'lenormand_api_interpretation_max_ms',
    stats.maxDuration,
    'Maximum interpretation duration in milliseconds',
    'gauge'
  )

  prometheusMetrics.addMetric(
    'process_memory_heap_used_bytes',
    memoryUsage.heapUsed,
    'Process heap memory used in bytes',
    'gauge'
  )

  prometheusMetrics.addMetric(
    'process_memory_heap_total_bytes',
    memoryUsage.heapTotal,
    'Process heap memory total in bytes',
    'gauge'
  )

  prometheusMetrics.addMetric(
    'process_memory_external_bytes',
    memoryUsage.external,
    'Process external memory in bytes',
    'gauge'
  )

  prometheusMetrics.addMetric(
    'process_memory_rss_bytes',
    memoryUsage.rss,
    'Process resident set size in bytes',
    'gauge'
  )

  prometheusMetrics.addMetric(
    'process_uptime_seconds',
    Math.floor(process.uptime()),
    'Application uptime in seconds',
    'gauge'
  )

  for (const [spreadId, count] of Object.entries(stats.spreads)) {
    const metricName = `lenormand_api_spread_usage_total`
    const labels = { spread: spreadId }
    prometheusMetrics.addMetric(
      metricName,
      count,
      'Number of times a spread was used',
      'counter'
    )
  }

  const prometheusText = prometheusMetrics.export()

  return new NextResponse(prometheusText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
