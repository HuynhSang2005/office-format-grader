import type { Context, Next } from "hono";

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  size?: number;
  context?: Record<string, any>;
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  fatal(message: string, context?: Record<string, any>): void;
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements ILogger {
  private formatLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
    };
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry = this.formatLogEntry(level, message, context);
    
    if (process.env.NODE_ENV === "development") {
      // Pretty print in development
      console[level === LogLevel.FATAL ? "error" : level](
        `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`,
        context ? JSON.stringify(context, null, 2) : ""
      );
    } else {
      // JSON format in production
      console[level === LogLevel.FATAL ? "error" : level](JSON.stringify(entry));
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }
}

/**
 * Global logger instance
 */
export const logger = new ConsoleLogger();

/**
 * Logging middleware configuration
 */
export interface LoggingConfig {
  logger?: ILogger;
  logLevel?: LogLevel;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  maxBodySize?: number;
  excludePaths?: string[];
  includeHeaders?: boolean;
  customLogData?: (c: Context) => Record<string, any>;
  generateRequestId?: boolean;
}

/**
 * Default logging configuration
 */
const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  logger: logger,
  logLevel: process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
  includeRequestBody: false,
  includeResponseBody: false,
  maxBodySize: 1024, // 1KB
  excludePaths: ["/healthz", "/readyz"],
  includeHeaders: false,
  generateRequestId: true,
};

/**
 * Generate request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Get client IP address
 */
function getClientIP(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  
  const realIP = c.req.header("x-real-ip");
  if (realIP) return realIP;
  
  return c.req.header("cf-connecting-ip") || "unknown";
}

/**
 * Sanitize sensitive data from objects
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== "object") return data;

  const sensitiveKeys = ["password", "token", "secret", "key", "authorization"];
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Truncate large text content
 */
function truncateContent(content: string, maxSize: number): string {
  if (content.length <= maxSize) return content;
  return content.substring(0, maxSize) + "... [TRUNCATED]";
}

/**
 * Request/Response logging middleware
 */
export function loggingMiddleware(config?: Partial<LoggingConfig>) {
  const loggingConfig = { ...DEFAULT_LOGGING_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const requestId = loggingConfig.generateRequestId ? generateRequestId() : undefined;
    
    // Store request ID in context
    if (requestId) {
      c.set("requestId", requestId);
      c.header("x-request-id", requestId);
    }

    // Skip logging for excluded paths
    const path = c.req.path;
    if (loggingConfig.excludePaths?.includes(path)) {
      await next();
      return;
    }

    const method = c.req.method;
    const userAgent = c.req.header("user-agent");
    const ip = getClientIP(c);

    // Log request
    const requestLogData: Record<string, any> = {
      requestId,
      method,
      path,
      userAgent,
      ip,
      timestamp: new Date().toISOString(),
    };

    // Include headers if enabled
    if (loggingConfig.includeHeaders) {
      const headers: Record<string, string> = {};
      c.req.raw.headers.forEach((value, key) => {
        headers[key] = key.toLowerCase().includes("authorization") ? "[REDACTED]" : value;
      });
      requestLogData.headers = headers;
    }

    // Include request body if enabled
    if (loggingConfig.includeRequestBody && (method === "POST" || method === "PUT" || method === "PATCH")) {
      try {
        const contentType = c.req.header("content-type");
        if (contentType?.includes("application/json")) {
          const body = await c.req.json();
          requestLogData.body = sanitizeData(body);
        } else if (contentType?.includes("application/x-www-form-urlencoded")) {
          const formData = await c.req.formData();
          const formObject: Record<string, any> = {};
          formData.forEach((value, key) => {
            formObject[key] = value instanceof File ? `[FILE: ${value.name}]` : value;
          });
          requestLogData.body = sanitizeData(formObject);
        }
      } catch (error) {
        requestLogData.bodyError = "Failed to parse request body";
      }
    }

    // Include custom log data
    if (loggingConfig.customLogData) {
      try {
        const customData = loggingConfig.customLogData(c);
        Object.assign(requestLogData, sanitizeData(customData));
      } catch (error) {
        requestLogData.customDataError = "Failed to generate custom log data";
      }
    }

    loggingConfig.logger?.info("Incoming request", requestLogData);

    let responseError: any = null;

    try {
      await next();
    } catch (error) {
      responseError = error;
      throw error;
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const statusCode = c.res.status;

      // Log response
      const responseLogData: Record<string, any> = {
        requestId,
        method,
        path,
        statusCode,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Include response body if enabled and successful
      if (loggingConfig.includeResponseBody && !responseError && statusCode < 400) {
        try {
          const responseText = await c.res.clone().text();
          if (responseText && responseText.length <= (loggingConfig.maxBodySize || 1024)) {
            try {
              responseLogData.body = JSON.parse(responseText);
            } catch {
              responseLogData.body = truncateContent(responseText, loggingConfig.maxBodySize || 1024);
            }
          } else if (responseText) {
            responseLogData.body = "[LARGE_RESPONSE]";
            responseLogData.responseSize = responseText.length;
          }
        } catch (error) {
          responseLogData.bodyError = "Failed to read response body";
        }
      }

      // Include error details if there was an error
      if (responseError) {
        responseLogData.error = {
          message: responseError.message,
          name: responseError.name,
          type: responseError.type || "UNKNOWN",
          ...(process.env.NODE_ENV === "development" && { stack: responseError.stack }),
        };
      }

      // Determine log level based on status code
      let logLevel = LogLevel.INFO;
      if (statusCode >= 500) {
        logLevel = LogLevel.ERROR;
      } else if (statusCode >= 400) {
        logLevel = LogLevel.WARN;
      } else if (duration > 5000) {
        logLevel = LogLevel.WARN; // Slow requests
      }

      const logMessage = responseError 
        ? `Request failed - ${method} ${path}`
        : `Request completed - ${method} ${path}`;

      loggingConfig.logger?.[logLevel](logMessage, responseLogData);

      // Log performance metrics for slow requests
      if (duration > 1000) {
        loggingConfig.logger?.warn("Slow request detected", {
          requestId,
          method,
          path,
          duration,
          threshold: "1000ms",
        });
      }
    }
  };
}

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware(config?: {
  logger?: ILogger;
  slowRequestThreshold?: number;
  includeMemoryUsage?: boolean;
}) {
  const perfConfig = {
    logger: logger,
    slowRequestThreshold: 1000, // 1 second
    includeMemoryUsage: false,
    ...config,
  };

  return async (c: Context, next: Next) => {
    const startTime = process.hrtime.bigint();
    const startMemory = perfConfig.includeMemoryUsage ? process.memoryUsage() : null;

    await next();

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    if (duration > perfConfig.slowRequestThreshold) {
      const perfData: Record<string, any> = {
        method: c.req.method,
        path: c.req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: c.res.status,
        threshold: `${perfConfig.slowRequestThreshold}ms`,
      };

      if (startMemory && perfConfig.includeMemoryUsage) {
        const endMemory = process.memoryUsage();
        perfData.memoryUsage = {
          heapUsedDiff: `${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(endMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          rss: `${(endMemory.rss / 1024 / 1024).toFixed(2)}MB`,
        };
      }

      perfConfig.logger.warn("Performance: Slow request detected", perfData);
    }
  };
}

/**
 * Access log middleware (simplified logging for access logs)
 */
export function accessLogMiddleware(config?: {
  format?: "common" | "combined" | "json";
  logger?: ILogger;
}) {
  const accessConfig = {
    format: "combined" as const,
    logger: logger,
    ...config,
  };

  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    
    await next();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const ip = getClientIP(c);
    const method = c.req.method;
    const path = c.req.path;
    const statusCode = c.res.status;
    const userAgent = c.req.header("user-agent") || "-";
    const referer = c.req.header("referer") || "-";
    const timestamp = new Date().toISOString();

    if (accessConfig.format === "json") {
      accessConfig.logger.info("Access log", {
        ip,
        timestamp,
        method,
        path,
        statusCode,
        duration,
        userAgent,
        referer,
      });
    } else if (accessConfig.format === "combined") {
      // Combined Log Format: IP - - [timestamp] "method path protocol" status size "referer" "user-agent"
      const logLine = `${ip} - - [${timestamp}] "${method} ${path} HTTP/1.1" ${statusCode} - "${referer}" "${userAgent}" ${duration}ms`;
      accessConfig.logger.info(logLine);
    } else {
      // Common Log Format: IP - - [timestamp] "method path protocol" status size
      const logLine = `${ip} - - [${timestamp}] "${method} ${path} HTTP/1.1" ${statusCode} -`;
      accessConfig.logger.info(logLine);
    }
  };
}