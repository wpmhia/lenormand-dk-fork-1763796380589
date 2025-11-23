/**
 * Prometheus metrics formatter
 * Converts application metrics to Prometheus text format
 */

interface Metric {
  name: string
  help: string
  type: 'gauge' | 'counter' | 'histogram'
  value?: number
  labels?: Record<string, string>
}

export class PrometheusMetrics {
  private metrics: Map<string, Metric> = new Map()
  private startTime = Date.now()

  addMetric(name: string, value: number, help: string, type: 'gauge' | 'counter' = 'gauge'): void {
    this.metrics.set(name, {
      name,
      value,
      help,
      type,
    })
  }

  formatMetric(name: string, value: number, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return `${name} ${value}`
    }

    const labelStr = Object.entries(labels)
      .map(([key, val]) => `${key}="${val}"`)
      .join(',')

    return `${name}{${labelStr}} ${value}`
  }

  export(): string {
    const lines: string[] = []

    // Process timestamp
    const uptime = Math.floor((Date.now() - this.startTime) / 1000)

    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`)
      lines.push(`# TYPE ${metric.name} ${metric.type}`)
      if (metric.value !== undefined) {
        lines.push(this.formatMetric(metric.name, metric.value, metric.labels))
      }
      lines.push('')
    }

    lines.push(`# HELP process_uptime_seconds Application uptime in seconds`)
    lines.push(`# TYPE process_uptime_seconds gauge`)
    lines.push(`process_uptime_seconds ${uptime}`)
    lines.push('')

    lines.push(`# HELP process_timestamp Timestamp of metrics collection`)
    lines.push(`# TYPE process_timestamp counter`)
    lines.push(`process_timestamp ${Date.now()}`)

    return lines.join('\n')
  }
}

export const metrics = new PrometheusMetrics()
