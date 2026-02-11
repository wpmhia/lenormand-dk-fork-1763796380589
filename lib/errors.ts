/**
 * Error Handling - Simplified
 * 
 * Custom error class for the application.
 * All error handling done inline with direct AppError creation.
 */

/**
 * Custom Error Class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.context = context;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON-serializable format for API responses
   */
  toJSON() {
    return {
      error: this.message,
      statusCode: this.statusCode,
      ...(this.context && { context: this.context }),
    };
  }
}
