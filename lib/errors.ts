/**
 * Error Handling Framework
 * 
 * Centralized error definitions, logging, and handling for the application.
 * Provides type-safe error codes, custom error class, and standardized logging.
 */

// ============================================================================
// Error Code Enum
// ============================================================================

export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_CARD_ID = "INVALID_CARD_ID",
  INVALID_SPREAD_ID = "INVALID_SPREAD_ID",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",

  // Server Errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",

  // Application Specific
  INVALID_READING_STATE = "INVALID_READING_STATE",
  CACHE_ERROR = "CACHE_ERROR",
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date();

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON-serializable format for API responses
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.context && { context: this.context }),
      timestamp: this.timestamp.toISOString(),
    };
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500 && this.statusCode < 600;
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Factory function to create validation errors
 */
export function createValidationError(
  message: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError(
    message,
    ErrorCode.INVALID_INPUT,
    400,
    context,
  );
}

/**
 * Factory function to create rate limit errors
 */
export function createRateLimitError(): AppError {
  return new AppError(
    "Too many requests. Please try again later.",
    ErrorCode.RATE_LIMIT_EXCEEDED,
    429,
  );
}

/**
 * Factory function to create not found errors
 */
export function createNotFoundError(
  resource: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError(
    `${resource} not found`,
    ErrorCode.NOT_FOUND,
    404,
    context,
  );
}

/**
 * Factory function to create unauthorized errors
 */
export function createUnauthorizedError(
  message: string = "Unauthorized",
): AppError {
  return new AppError(
    message,
    ErrorCode.UNAUTHORIZED,
    401,
  );
}

/**
 * Factory function to create external API errors
 */
export function createExternalAPIError(
  service: string,
  message: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError(
    `External API error from ${service}: ${message}`,
    ErrorCode.EXTERNAL_API_ERROR,
    503,
    context,
  );
}

// ============================================================================
// Logger Utility
// ============================================================================

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Format log entry for output
   */
  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    let output = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }

    if (error) {
      output += `\nError: ${error.name} - ${error.message}`;
      if (error.code) output += ` (${error.code})`;
      if (this.isDevelopment && error.stack) {
        output += `\nStack: ${error.stack}`;
      }
    }

    return output;
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.isDevelopment) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
    };

    console.log(this.formatEntry(entry));
  }

  /**
   * Log at INFO level
   */
  info(message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
    };

    console.log(this.formatEntry(entry));
  }

  /**
   * Log at WARN level
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
    };

    console.warn(this.formatEntry(entry));
  }

  /**
   * Log at ERROR level
   */
  error(
    message: string,
    error?: Error | AppError,
    context?: Record<string, unknown>,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof AppError && { code: error.code }),
      };
    }

    console.error(this.formatEntry(entry));
  }
}

export const logger = new Logger();

// ============================================================================
// Error Handler Utility
// ============================================================================

/**
 * Normalize any error into an AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500,
      { originalError: error.name },
    );
  }

  return new AppError(
    String(error) || "Unknown error occurred",
    ErrorCode.INTERNAL_ERROR,
    500,
  );
}

/**
 * Safe async wrapper that catches and normalizes errors
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const appError = normalizeError(error);
    logger.error("Async operation failed", appError);
    return fallback;
  }
}
