interface ErrorLog {
  timestamp: string
  message: string
  error: any
  source: string
  isDev: boolean
}

const ERROR_LOGS: ErrorLog[] = []
const MAX_LOGS = 50

export function logError(message: string, error: any, source: string = 'unknown') {
  const isDev = process.env.NODE_ENV === 'development'
  
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    message,
    error: error instanceof Error ? error.message : String(error),
    source,
    isDev,
  }

  ERROR_LOGS.push(log)
  if (ERROR_LOGS.length > MAX_LOGS) {
    ERROR_LOGS.shift()
  }

  if (isDev) {
    console.error(`[${source}] ${message}:`, error)
  }

  return log
}

export function getErrorLogs(): ErrorLog[] {
  return ERROR_LOGS
}

export function clearErrorLogs() {
  ERROR_LOGS.length = 0
}
