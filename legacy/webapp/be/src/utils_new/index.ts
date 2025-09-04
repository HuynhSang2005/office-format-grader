/**
 * Centralized export for all utility functions
 * This provides a single point of import for all utilities across the application
 */

// Response utilities
export * from "./response.utils";

// File utilities
export * from "./file.utils";

// Validation utilities
export * from "./validation.utils";

// Logger utilities
export * from "./logger.utils";

// Grading utilities
export * from "./grading.utils";

/**
 * Utility bundles for easy import
 */
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  rateLimitResponse,
  serverErrorResponse,
  paginatedResponse,
  fileDownloadResponse,
  redirectResponse,
  ResponseUtils 
} from "./response.utils";

import { 
  FileUtils,
  sanitizeFilename,
  validateFile,
  createTempDirectory,
  saveFileTemporarily,
  cleanupTempFiles,
  getFileInfo,
  fileExists,
  ensureDirectoryExists 
} from "./file.utils";

import { 
  ValidationUtils,
  validateEmail,
  validateUrl,
  validatePhoneNumber,
  validatePassword,
  validateNumericRange,
  validateStringLength,
  validateArray,
  validateDate,
  validateEnum,
  combineValidationResults,
  zodErrorToValidationErrors 
} from "./validation.utils";

import { 
  Logger,
  LogLevel,
  createLogger,
  logger,
  PerformanceLogger,
  performanceLogger,
  logHttpRequest,
  LoggerUtils 
} from "./logger.utils";

/**
 * Response utilities bundle
 */
export const Response = {
  success: successResponse,
  error: errorResponse,
  validationError: validationErrorResponse,
  notFound: notFoundResponse,
  unauthorized: unauthorizedResponse,
  forbidden: forbiddenResponse,
  rateLimit: rateLimitResponse,
  serverError: serverErrorResponse,
  paginated: paginatedResponse,
  fileDownload: fileDownloadResponse,
  redirect: redirectResponse,
  utils: ResponseUtils,
} as const;

/**
 * File utilities bundle
 */
export const File = {
  utils: FileUtils,
  sanitize: sanitizeFilename,
  validate: validateFile,
  createTempDir: createTempDirectory,
  saveTemp: saveFileTemporarily,
  cleanup: cleanupTempFiles,
  getInfo: getFileInfo,
  exists: fileExists,
  ensureDir: ensureDirectoryExists,
} as const;

/**
 * Validation utilities bundle
 */
export const Validation = {
  utils: ValidationUtils,
  email: validateEmail,
  url: validateUrl,
  phone: validatePhoneNumber,
  password: validatePassword,
  numericRange: validateNumericRange,
  stringLength: validateStringLength,
  array: validateArray,
  date: validateDate,
  enum: validateEnum,
  combine: combineValidationResults,
  fromZodError: zodErrorToValidationErrors,
} as const;

/**
 * Logging utilities bundle
 */
export const Logging = {
  Logger,
  LogLevel,
  createLogger,
  logger,
  PerformanceLogger,
  performanceLogger,
  logHttpRequest,
  utils: LoggerUtils,
} as const;

/**
 * All utilities organized by category
 */
export const Utils = {
  Response,
  File,
  Validation,
  Logging,
} as const;

/**
 * Common utility functions for quick access
 */
export const Common = {
  /**
   * Delay execution for specified milliseconds
   */
  delay: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate random string
   */
  randomString: (length: number = 10, charset: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"): string => {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },

  /**
   * Generate UUID v4
   */
  generateUUID: (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Deep clone object
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) return obj.map(item => Common.deepClone(item)) as unknown as T;
    if (typeof obj === "object") {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = Common.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  },

  /**
   * Debounce function
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Retry function with exponential backoff
   */
  retry: async <T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoffFactor?: number;
      maxDelay?: number;
    } = {}
  ): Promise<T> => {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoffFactor = 2,
      maxDelay = 10000,
    } = options;

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        const currentDelay = Math.min(delay * Math.pow(backoffFactor, attempt - 1), maxDelay);
        await Common.delay(currentDelay);
      }
    }
    
    throw lastError!;
  },

  /**
   * Format bytes to human readable string
   */
  formatBytes: (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  },

  /**
   * Check if value is empty (null, undefined, empty string, empty array, empty object)
   */
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  },

  /**
   * Safe JSON parse
   */
  safeJsonParse: <T = any>(str: string, defaultValue?: T): T | undefined => {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  },

  /**
   * Convert object to query string
   */
  objectToQueryString: (obj: Record<string, any>): string => {
    return Object.entries(obj)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
  },

  /**
   * Parse query string to object
   */
  queryStringToObject: (queryString: string): Record<string, string> => {
    const params = new URLSearchParams(queryString.startsWith("?") ? queryString.slice(1) : queryString);
    const result: Record<string, string> = {};
    
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    
    return result;
  },

  /**
   * Truncate string with ellipsis
   */
  truncate: (str: string, length: number, suffix: string = "..."): string => {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },

  /**
   * Capitalize first letter
   */
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Convert camelCase to snake_case
   */
  camelToSnake: (str: string): string => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  },

  /**
   * Convert snake_case to camelCase
   */
  snakeToCamel: (str: string): string => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  },
} as const;

/**
 * Export common utilities directly
 */
export const {
  delay,
  randomString,
  generateUUID,
  deepClone,
  debounce,
  throttle,
  retry,
  formatBytes,
  isEmpty,
  safeJsonParse,
  objectToQueryString,
  queryStringToObject,
  truncate,
  capitalize,
  camelToSnake,
  snakeToCamel,
} = Common;