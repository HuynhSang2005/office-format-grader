import { config } from "../config";

/**
 * Log levels enum
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

/**
 * Log level numeric values for comparison
 */
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  module?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  format: "json" | "text";
  includeStack: boolean;
  includeTimestamp: boolean;
  colorize: boolean;
  module?: string;
  sanitizeContext: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  format: "json",
  includeStack: true,
  includeTimestamp: true,
  colorize: false,
  sanitizeContext: true,
};

/**
 * Console colors for text format
 */
const COLORS = {
  debug: "\x1b[36m", // Cyan
  info: "\x1b[32m",  // Green
  warn: "\x1b[33m",  // Yellow
  error: "\x1b[31m", // Red
  fatal: "\x1b[35m", // Magenta
  reset: "\x1b[0m",  // Reset
} as const;

/**
 * Logger class
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Override with app config if available
    try {
      this.config.level = config?.level || (config.app.logging.level as LogLevel) || LogLevel.INFO;
      this.config.format = config?.format || (config.app.logging.format as "json" | "text") || "json";
    } catch {
      // Fallback to defaults if config is not available
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_VALUES[level] >= LOG_LEVEL_VALUES[this.config.level];
  }

  /**
   * Sanitize context data to remove sensitive information
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    if (!this.config.sanitizeContext) return context;

    const sensitiveKeys = [
      "password", "token", "secret", "key", "apikey", "authorization",
      "cookie", "session", "auth", "credentials", "private"
    ];

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(context)) {
      const keyLower = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeContext(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === "json") {
      return JSON.stringify(entry);
    }

    // Text format
    const timestamp = this.config.includeTimestamp ? `[${entry.timestamp}] ` : "";
    const level = this.config.colorize 
      ? `${COLORS[entry.level]}${entry.level.toUpperCase()}${COLORS.reset}`
      : entry.level.toUpperCase();
    const module = entry.module ? ` [${entry.module}]` : "";
    const requestId = entry.requestId ? ` (${entry.requestId})` : "";
    
    let message = `${timestamp}${level}${module}${requestId}: ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (this.config.includeStack && entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (this.config.module) {
      entry.module = this.config.module;
    }

    if (context) {
      entry.context = this.sanitizeContext(context);
      
      // Extract request ID if present
      if (context.requestId) {
        entry.requestId = context.requestId;
      }
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.config.includeStack ? error.stack : undefined,
      };
    }

    return entry;
  }

  /**
   * Write log entry to console
   */
  private writeLog(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.writeLog(entry);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.writeLog(entry);
  }

  /**
   * Log fatal message
   */
  fatal(message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(LogLevel.FATAL)) return;
    
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, error);
    this.writeLog(entry);
  }

  /**
   * Update logger configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, any>): Logger {
    const childConfig = { ...this.config };
    const childLogger = new Logger(childConfig);
    
    // Override log methods to include context
    const originalCreateLogEntry = childLogger["createLogEntry"];
    childLogger["createLogEntry"] = function(level, message, logContext, error) {
      const mergedContext = { ...context, ...logContext };
      return originalCreateLogEntry.call(this, level, message, mergedContext, error);
    };
    
    return childLogger;
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

/**
 * Create logger with module name
 */
export function createLogger(module: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({ ...config, module });
}

/**
 * Default logger instance
 */
export const logger = new Logger({
  level: (config?.app?.logging?.level as LogLevel) || LogLevel.INFO,
  format: (config?.app?.logging?.format as "json" | "text") || 
    (process.env.NODE_ENV === "development" ? "text" : "json"),
  colorize: process.env.NODE_ENV === "development",
});

/**
 * Performance logging utility
 */
export class PerformanceLogger {
  private logger: Logger;
  private startTimes: Map<string, number> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Start timing operation
   */
  start(operationId: string, context?: Record<string, any>): void {
    this.startTimes.set(operationId, performance.now());
    this.logger.debug(`Started operation: ${operationId}`, context);
  }

  /**
   * End timing operation and log result
   */
  end(operationId: string, context?: Record<string, any>): number {
    const startTime = this.startTimes.get(operationId);
    if (!startTime) {
      this.logger.warn(`No start time found for operation: ${operationId}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operationId);

    const logContext = {
      ...context,
      operationId,
      duration: `${duration.toFixed(2)}ms`,
    };

    if (duration > 1000) {
      this.logger.warn(`Slow operation detected: ${operationId}`, logContext);
    } else {
      this.logger.debug(`Completed operation: ${operationId}`, logContext);
    }

    return duration;
  }

  /**
   * Time a function execution
   */
  async time<T>(
    operationId: string,
    fn: () => Promise<T> | T,
    context?: Record<string, any>
  ): Promise<T> {
    this.start(operationId, context);
    try {
      const result = await fn();
      this.end(operationId, { ...context, success: true });
      return result;
    } catch (error) {
      this.end(operationId, { ...context, success: false, error: (error as Error).message });
      throw error;
    }
  }
}

/**
 * Global performance logger
 */
export const performanceLogger = new PerformanceLogger(logger);

/**
 * HTTP request logger
 */
export function logHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: Record<string, any>
): void {
  const logLevel = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN :
                  LogLevel.INFO;

  const logContext = {
    ...context,
    method,
    path,
    statusCode,
    duration: `${duration.toFixed(2)}ms`,
  };

  const message = `${method} ${path} ${statusCode} - ${duration.toFixed(2)}ms`;

  switch (logLevel) {
    case LogLevel.ERROR:
      logger.error(message, logContext);
      break;
    case LogLevel.WARN:
      logger.warn(message, logContext);
      break;
    default:
      logger.info(message, logContext);
  }
}

/**
 * Logger utilities
 */
export const LoggerUtils = {
  /**
   * Create structured error log
   */
  logError: (error: Error, context?: Record<string, any>): void => {
    logger.error(error.message, context, error);
  },

  /**
   * Log function execution with timing
   */
  logExecution: async <T>(
    functionName: string,
    fn: () => Promise<T> | T,
    context?: Record<string, any>
  ): Promise<T> => {
    return performanceLogger.time(functionName, fn, context);
  },

  /**
   * Create request-scoped logger
   */
  createRequestLogger: (requestId: string): Logger => {
    return logger.child({ requestId });
  },

  /**
   * Log memory usage
   */
  logMemoryUsage: (context?: Record<string, any>): void => {
    const memoryUsage = process.memoryUsage();
    const formattedMemory = {
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`,
    };

    logger.info("Memory usage", { ...context, memory: formattedMemory });
  },

  /**
   * Log with correlation ID
   */
  logWithCorrelation: (
    level: LogLevel,
    message: string,
    correlationId: string,
    context?: Record<string, any>
  ): void => {
    const logContext = { ...context, correlationId };
    logger[level](message, logContext);
  },
};