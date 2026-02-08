/**
 * API Response Helper
 * 
 * Standardized response format for all API routes.
 * Ensures consistent error handling and response structure across endpoints.
 */

import { AppError, normalizeError } from "./errors";

/**
 * Standard API response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    context?: Record<string, unknown>;
  };
  timestamp: string;
}

/**
 * Create a successful JSON response
 */
export function createSuccessResponse<T>(data: T): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return Response.json(response, { status: 200 });
}

/**
 * Create an error JSON response
 */
export function createErrorResponse(error: unknown, statusCode?: number): Response {
  const appError = normalizeError(error);
  const status = statusCode || appError.statusCode;

  const response: ApiResponse = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.context && { context: appError.context }),
    },
    timestamp: new Date().toISOString(),
  };

  return Response.json(response, { status });
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number = 1,
  pageSize: number = 10,
): Response {
  const totalPages = Math.ceil(total / pageSize);

  const response: ApiResponse<{
    items: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> = {
    success: true,
    data: {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    },
    timestamp: new Date().toISOString(),
  };

  return Response.json(response, { status: 200 });
}

/**
 * Safe handler wrapper for async API routes
 * Automatically catches errors and returns appropriate response
 */
export async function apiHandler<T>(
  handler: () => Promise<T>,
): Promise<Response> {
  try {
    const data = await handler();
    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Validate request method
 */
export function validateMethod(request: Request, allowed: string[]): void {
  if (!allowed.includes(request.method)) {
    const error = new AppError(
      `Method ${request.method} not allowed`,
      "METHOD_NOT_ALLOWED",
      405,
    );
    throw error;
  }
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T = unknown>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    const error = new AppError(
      "Invalid JSON in request body",
      "INVALID_JSON",
      400,
    );
    throw error;
  }
}

/**
 * Get query parameter with default value
 */
export function getQueryParam(
  request: Request,
  param: string,
  defaultValue?: string,
): string | undefined {
  const url = new URL(request.url);
  return url.searchParams.get(param) || defaultValue;
}

/**
 * Get multiple query parameters at once
 */
export function getQueryParams(
  request: Request,
  params: string[],
): Record<string, string | null> {
  const url = new URL(request.url);
  const result: Record<string, string | null> = {};

  for (const param of params) {
    result[param] = url.searchParams.get(param);
  }

  return result;
}

/**
 * Type for route handler with automatic error handling
 */
export type ApiRouteHandler = (request: Request) => Promise<Response>;

/**
 * Wrap async route handler with error boundary
 */
export function withErrorBoundary(handler: ApiRouteHandler): ApiRouteHandler {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error("Route handler error:", error);
      return createErrorResponse(error);
    }
  };
}
