import type { Context, Next } from "hono";
import type { HTTPException } from "hono/http-exception";

/**
 * Error types for classification
 */
export enum ErrorType {
  VALIDATION = "VALIDATION_ERROR",
  AUTHENTICATION = "AUTHENTICATION_ERROR",
  AUTHORIZATION = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND_ERROR",
  CONFLICT = "CONFLICT_ERROR",
  RATE_LIMIT = "RATE_LIMIT_ERROR",
  FILE_PROCESSING = "FILE_PROCESSING_ERROR",
  EXTERNAL_API = "EXTERNAL_API_ERROR",
  DATABASE = "DATABASE_ERROR",
  NETWORK = "NETWORK_ERROR",
  INTERNAL = "INTERNAL_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
}

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  public type: ErrorType;
  public statusCode: number;
  public isOperational: boolean;
  public context?: Record<string, any>;
  public timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response format
 */
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  type?: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  includeStack?: boolean;
  includeContext?: boolean;
  logErrors?: boolean;
  logLevel?: "error" | "warn" | "info";
  generateRequestId?: boolean;
  customErrorMap?: Map<string, { statusCode: number; message: string }>;
}

/**
 * Default error handler configuration
 */
const DEFAULT_ERROR_CONFIG: ErrorHandlerConfig = {
  includeStack: process.env.NODE_ENV === "development",
  includeContext: true,
  logErrors: true,
  logLevel: "error",
  generateRequestId: true,
};

/**
 * Generate request ID for tracking
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Log error with appropriate level
 */
function logError(error: any, context: any, level: string = "error") {
  const logData = {
    message: error.message,
    type: error.type || "UNKNOWN",
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    context,
    ...(error.stack && { stack: error.stack }),
  };

  console[level as keyof Console]("Error occurred:", JSON.stringify(logData, null, 2));
}

/**
 * Error handler middleware
 */
export function errorHandlerMiddleware(config?: Partial<ErrorHandlerConfig>) {
  const errorConfig = { ...DEFAULT_ERROR_CONFIG, ...config };

  return async (err: Error, c: Context) => {
    const requestId = errorConfig.generateRequestId ? generateRequestId() : undefined;

    // Log error if enabled
    if (errorConfig.logErrors) {
      const logContext = {
        requestId,
        method: c.req.method,
        path: c.req.path,
        userAgent: c.req.header("user-agent"),
        ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      };
      logError(err, logContext, errorConfig.logLevel);
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };

    // Handle different error types
    if (err instanceof AppError) {
      errorResponse.error = err.type;
      errorResponse.message = err.message;
      errorResponse.statusCode = err.statusCode;
      errorResponse.type = err.type;
      if (errorConfig.includeContext && err.context) {
        errorResponse.context = err.context;
      }
    } else if (err.name === "HTTPException" || (err as any).status) {
      // Hono HTTPException
      const httpErr = err as HTTPException;
      errorResponse.statusCode = httpErr.status || 500;
      errorResponse.message = httpErr.message || "HTTP Error";
      errorResponse.error = "HTTP_ERROR";
    } else if (err.name === "ValidationError") {
      errorResponse.error = ErrorType.VALIDATION;
      errorResponse.message = err.message;
      errorResponse.statusCode = 400;
    } else if (err.name === "SyntaxError" && err.message.includes("JSON")) {
      errorResponse.error = ErrorType.VALIDATION;
      errorResponse.message = "Invalid JSON format";
      errorResponse.statusCode = 400;
    } else if (err.name === "TimeoutError" || err.message.includes("timeout")) {
      errorResponse.error = ErrorType.TIMEOUT;
      errorResponse.message = "Request timeout";
      errorResponse.statusCode = 408;
    } else {
      // Generic error handling
      errorResponse.error = ErrorType.INTERNAL;
      errorResponse.message = process.env.NODE_ENV === "development" 
        ? err.message 
        : "An unexpected error occurred";
    }

    // Include stack trace in development
    if (errorConfig.includeStack && process.env.NODE_ENV === "development") {
      errorResponse.stack = err.stack;
    }

    return c.json(errorResponse, errorResponse.statusCode);
  };
}

/**
 * Global error handler for unhandled errors
 */
export function globalErrorHandler(config?: Partial<ErrorHandlerConfig>) {
  const errorConfig = { ...DEFAULT_ERROR_CONFIG, ...config };

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("Unhandled Promise Rejection:", reason);
    if (errorConfig.logErrors) {
      logError(
        { message: "Unhandled Promise Rejection", stack: reason?.stack },
        { promise: promise.toString() },
        "error"
      );
    }
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught Exception:", error);
    if (errorConfig.logErrors) {
      logError(error, { type: "uncaughtException" }, "error");
    }
    
    // Gracefully shutdown
    process.exit(1);
  });
}

/**
 * Async error wrapper for controllers
 */
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      throw error instanceof AppError ? error : new AppError(
        error.message || "Async operation failed",
        ErrorType.INTERNAL,
        500,
        true,
        { originalError: error.name }
      );
    });
  };
}

/**
 * Try-catch wrapper for synchronous operations
 */
export function safeExecute<T>(
  fn: () => T,
  errorMessage: string = "Operation failed",
  errorType: ErrorType = ErrorType.INTERNAL
): T {
  try {
    return fn();
  } catch (error: any) {
    throw new AppError(
      errorMessage,
      errorType,
      500,
      true,
      { originalError: error.message }
    );
  }
}

/**
 * Custom error factory functions
 */
export const ErrorFactory = {
  validation: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.VALIDATION, 400, true, context),

  notFound: (resource: string = "Resource") =>
    new AppError(`${resource} not found`, ErrorType.NOT_FOUND, 404, true),

  unauthorized: (message: string = "Unauthorized access") =>
    new AppError(message, ErrorType.AUTHENTICATION, 401, true),

  forbidden: (message: string = "Access forbidden") =>
    new AppError(message, ErrorType.AUTHORIZATION, 403, true),

  conflict: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.CONFLICT, 409, true, context),

  rateLimit: (message: string = "Rate limit exceeded") =>
    new AppError(message, ErrorType.RATE_LIMIT, 429, true),

  fileProcessing: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.FILE_PROCESSING, 422, true, context),

  externalApi: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.EXTERNAL_API, 502, true, context),

  timeout: (message: string = "Request timeout") =>
    new AppError(message, ErrorType.TIMEOUT, 408, true),

  internal: (message: string = "Internal server error", context?: Record<string, any>) =>
    new AppError(message, ErrorType.INTERNAL, 500, false, context),
};

/**
 * Error boundary middleware for specific routes
 */
export function errorBoundary(handler: (c: Context, next: Next) => Promise<Response | void>) {
  return async (c: Context, next: Next) => {
    try {
      const result = await handler(c, next);
      return result;
    } catch (error: any) {
      // Transform non-AppError errors to AppError
      if (!(error instanceof AppError)) {
        const appError = new AppError(
          error.message || "Handler error",
          ErrorType.INTERNAL,
          500,
          true,
          { handlerName: handler.name || "anonymous" }
        );
        throw appError;
      }
      throw error;
    }
  };
}

/**
 * File processing error handler
 */
export function fileProcessingErrorHandler(c: Context, error: any) {
  if (error.code === "ENOENT") {
    throw ErrorFactory.notFound("File not found");
  } else if (error.code === "EACCES") {
    throw ErrorFactory.fileProcessing("File access denied");
  } else if (error.code === "EMFILE" || error.code === "ENFILE") {
    throw ErrorFactory.fileProcessing("Too many open files");
  } else if (error.message?.includes("Invalid file format")) {
    throw ErrorFactory.validation("Invalid file format", { originalError: error.message });
  } else {
    throw ErrorFactory.fileProcessing("File processing failed", { originalError: error.message });
  }
}