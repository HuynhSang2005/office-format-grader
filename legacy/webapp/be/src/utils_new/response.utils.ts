import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | { message: string; code?: string; details?: any };
  timestamp?: string;
  requestId?: string;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error response structure
 */
export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string | { message: string; code?: string; details?: any };
}

/**
 * Response options for customization
 */
export interface ResponseOptions {
  timestamp?: boolean;
  requestId?: boolean;
  headers?: Record<string, string>;
}

/**
 * Default response options
 */
const DEFAULT_OPTIONS: ResponseOptions = {
  timestamp: true,
  requestId: true,
};

/**
 * Create a success response
 */
export function successResponse<T = any>(
  c: Context,
  data: T,
  message: string = "Success",
  statusCode: ContentfulStatusCode = 200,
  options: ResponseOptions = {}
): Response {
  const responseOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const response: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };

  // Add timestamp if enabled
  if (responseOptions.timestamp) {
    response.timestamp = new Date().toISOString();
  }

  // Add request ID if enabled and available
  if (responseOptions.requestId) {
    const requestId = c.get("requestId");
    if (requestId) {
      response.requestId = requestId;
    }
  }

  // Set custom headers if provided
  if (responseOptions.headers) {
    Object.entries(responseOptions.headers).forEach(([key, value]) => {
      c.header(key, value);
    });
  }

  return c.json(response, statusCode);
}

/**
 * Create an error response
 */
export function errorResponse(
  c: Context,
  error: string | { message: string; code?: string; details?: any },
  statusCode: ContentfulStatusCode = 500,
  options: ResponseOptions = {}
): Response {
  const responseOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const response: ErrorResponse = {
    success: false,
    error,
  };

  // Add timestamp if enabled
  if (responseOptions.timestamp) {
    response.timestamp = new Date().toISOString();
  }

  // Add request ID if enabled and available
  if (responseOptions.requestId) {
    const requestId = c.get("requestId");
    if (requestId) {
      response.requestId = requestId;
    }
  }

  // Set custom headers if provided
  if (responseOptions.headers) {
    Object.entries(responseOptions.headers).forEach(([key, value]) => {
      c.header(key, value);
    });
  }

  return c.json(response, statusCode);
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  c: Context,
  errors: Array<{ field: string; message: string; code?: string }>,
  message: string = "Validation failed",
  options: ResponseOptions = {}
): Response {
  return errorResponse(
    c,
    {
      message,
      code: "VALIDATION_ERROR",
      details: errors,
    },
    400,
    options
  );
}

/**
 * Create a not found response
 */
export function notFoundResponse(
  c: Context,
  resource: string = "Resource",
  options: ResponseOptions = {}
): Response {
  return errorResponse(
    c,
    {
      message: `${resource} not found`,
      code: "NOT_FOUND",
    },
    404,
    options
  );
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(
  c: Context,
  message: string = "Unauthorized access",
  options: ResponseOptions = {}
): Response {
  return errorResponse(
    c,
    {
      message,
      code: "UNAUTHORIZED",
    },
    401,
    options
  );
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(
  c: Context,
  message: string = "Access forbidden",
  options: ResponseOptions = {}
): Response {
  return errorResponse(
    c,
    {
      message,
      code: "FORBIDDEN",
    },
    403,
    options
  );
}

/**
 * Create a rate limit response
 */
export function rateLimitResponse(
  c: Context,
  retryAfter?: number,
  message: string = "Rate limit exceeded",
  options: ResponseOptions = {}
): Response {
  const headers = options.headers || {};
  
  if (retryAfter) {
    headers["Retry-After"] = retryAfter.toString();
  }

  return errorResponse(
    c,
    {
      message,
      code: "RATE_LIMIT_EXCEEDED",
      details: retryAfter ? { retryAfter } : undefined,
    },
    429,
    { ...options, headers }
  );
}

/**
 * Create a server error response
 */
export function serverErrorResponse(
  c: Context,
  message: string = "Internal server error",
  details?: any,
  options: ResponseOptions = {}
): Response {
  return errorResponse(
    c,
    {
      message,
      code: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === "development" ? details : undefined,
    },
    500,
    options
  );
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T = any>(
  c: Context,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  },
  message: string = "Data retrieved successfully",
  options: ResponseOptions = {}
): Response {
  return successResponse(
    c,
    {
      items: data,
      pagination,
    },
    message,
    200,
    options
  );
}

/**
 * Create a file download response
 */
export function fileDownloadResponse(
  c: Context,
  buffer: Buffer,
  filename: string,
  contentType: string = "application/octet-stream"
): Response {
  c.header("Content-Type", contentType);
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  c.header("Content-Length", buffer.length.toString());
  
  return c.body(buffer);
}

/**
 * Create a redirect response
 */
export function redirectResponse(
  c: Context,
  url: string,
  permanent: boolean = false
): Response {
  const statusCode = permanent ? 301 : 302;
  c.header("Location", url);
  return c.text("", statusCode);
}

/**
 * Response utility functions
 */
export const ResponseUtils = {
  /**
   * Extract error message from various error types
   */
  extractErrorMessage: (error: any): string => {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    return "Unknown error occurred";
  },

  /**
   * Sanitize response data for security
   */
  sanitizeResponseData: (data: any): any => {
    if (!data || typeof data !== "object") return data;

    const sensitiveKeys = ["password", "token", "secret", "key", "apiKey"];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === "object") {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
            result[key] = "[REDACTED]";
          } else if (typeof value === "object") {
            result[key] = sanitizeObject(value);
          } else {
            result[key] = value;
          }
        }
        return result;
      }
      
      return obj;
    };

    return sanitizeObject(sanitized);
  },

  /**
   * Format validation errors for response
   */
  formatValidationErrors: (errors: any[]): Array<{ field: string; message: string; code?: string }> => {
    return errors.map(error => ({
      field: error.field || error.path?.join(".") || "unknown",
      message: error.message || "Validation failed",
      code: error.code || "VALIDATION_ERROR",
    }));
  },
};