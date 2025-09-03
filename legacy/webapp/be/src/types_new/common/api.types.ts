/**
 * Common API and utility types used across the application
 */

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

/**
 * Success API response
 */
export interface SuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Error API response
 */
export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
}

/**
 * File upload information
 */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

/**
 * File processing result
 */
export interface FileProcessingResult<T = any> {
  filename: string;
  fileType: string;
  success: boolean;
  data?: T;
  error?: string;
  processingTime?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Query parameters for APIs
 */
export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * HTTP methods
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";

/**
 * Request context
 */
export interface RequestContext {
  ip?: string;
  userAgent?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: "ok" | "error";
  service: string;
  env?: string;
  time: string;
  uptime?: number;
  version?: string;
}

/**
 * Error details for debugging
 */
export interface ErrorDetails {
  code?: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * Configuration options
 */
export interface ConfigOptions {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Temporary file information
 */
export interface TempFileInfo {
  path: string;
  originalName: string;
  size: number;
  createdAt: Date;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Processing status
 */
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Processing progress
 */
export interface ProcessingProgress {
  status: ProcessingStatus;
  progress: number; // 0-100
  message?: string;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

/**
 * Supported file types
 */
export type SupportedFileType = "docx" | "pptx" | "xlsx" | "pdf";

/**
 * Output format options
 */
export type OutputFormat = "json" | "excel" | "pdf" | "csv";

/**
 * Language options
 */
export type Language = "en" | "vi" | "fr" | "es" | "de" | "zh";

/**
 * Log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Environment types
 */
export type Environment = "development" | "staging" | "production" | "test";