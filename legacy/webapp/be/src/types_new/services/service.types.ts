/**
 * Service layer types for business logic components
 */

/**
 * Service response wrapper
 */
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  cacheEnabled?: boolean;
  cacheTtl?: number;
}

/**
 * AI service configuration
 */
export interface AIServiceConfig extends ServiceConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

/**
 * File processing service options
 */
export interface FileProcessingServiceOptions extends ServiceConfig {
  tempDirectory?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
  cleanupAfter?: number; // milliseconds
  parallelProcessing?: boolean;
  maxConcurrentFiles?: number;
}

/**
 * Document parsing service options
 */
export interface DocumentParsingServiceOptions extends ServiceConfig {
  extractText?: boolean;
  extractImages?: boolean;
  extractMetadata?: boolean;
  preserveFormatting?: boolean;
  includeHiddenContent?: boolean;
  maxTextLength?: number;
  imageFormat?: "base64" | "file" | "url";
}

/**
 * Grading service configuration
 */
export interface GradingServiceConfig extends ServiceConfig {
  aiEnabled?: boolean;
  aiModel?: string;
  fallbackToManual?: boolean;
  confidenceThreshold?: number;
  batchSize?: number;
  maxSubmissions?: number;
  enableReports?: boolean;
  reportFormats?: string[];
}

/**
 * Export service configuration
 */
export interface ExportServiceConfig extends ServiceConfig {
  defaultFormat?: "excel" | "pdf" | "json" | "csv";
  templateDirectory?: string;
  outputDirectory?: string;
  compression?: boolean;
  watermark?: boolean;
  includeMetadata?: boolean;
}

/**
 * Validation service result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  suggestions?: Array<{
    field: string;
    suggestion: string;
  }>;
}

/**
 * Caching service interface
 */
export interface CacheServiceInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
}

/**
 * Logging service interface
 */
export interface LoggingServiceInterface {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  fatal(message: string, meta?: any): void;
}

/**
 * Metrics service interface
 */
export interface MetricsServiceInterface {
  increment(metric: string, tags?: Record<string, string>): void;
  decrement(metric: string, tags?: Record<string, string>): void;
  gauge(metric: string, value: number, tags?: Record<string, string>): void;
  timing(metric: string, value: number, tags?: Record<string, string>): void;
  histogram(metric: string, value: number, tags?: Record<string, string>): void;
}

/**
 * Queue service interface
 */
export interface QueueServiceInterface {
  add<T>(job: string, data: T, options?: QueueJobOptions): Promise<void>;
  process<T>(job: string, handler: (data: T) => Promise<void>): void;
  getStats(): Promise<QueueStats>;
}

/**
 * Queue job options
 */
export interface QueueJobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: "fixed" | "exponential";
    delay: number;
  };
  priority?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

/**
 * Notification service interface
 */
export interface NotificationServiceInterface {
  sendEmail(to: string, subject: string, body: string, options?: EmailOptions): Promise<void>;
  sendSMS(to: string, message: string, options?: SMSOptions): Promise<void>;
  sendPush(to: string, title: string, body: string, options?: PushOptions): Promise<void>;
}

/**
 * Email options
 */
export interface EmailOptions {
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
  html?: boolean;
  priority?: "high" | "normal" | "low";
}

/**
 * SMS options
 */
export interface SMSOptions {
  from?: string;
  priority?: "high" | "normal" | "low";
}

/**
 * Push notification options
 */
export interface PushOptions {
  icon?: string;
  image?: string;
  badge?: string;
  sound?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Health check service interface
 */
export interface HealthCheckServiceInterface {
  check(): Promise<HealthCheckResult>;
  checkDependency(name: string): Promise<DependencyHealth>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: Date;
  uptime: number;
  version?: string;
  dependencies: Record<string, DependencyHealth>;
}

/**
 * Dependency health status
 */
export interface DependencyHealth {
  status: "healthy" | "unhealthy";
  responseTime?: number;
  error?: string;
  lastChecked: Date;
}

/**
 * Rate limiting service interface
 */
export interface RateLimitServiceInterface {
  isAllowed(key: string, limit: number, window: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
  getStats(key: string): Promise<RateLimitStats>;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

/**
 * Rate limit statistics
 */
export interface RateLimitStats {
  requests: number;
  remaining: number;
  resetTime: Date;
  windowStart: Date;
}