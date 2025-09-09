import { env, EnvUtils } from "./environment";

/**
 * Application configuration interface
 */
export interface AppConfig {
  server: ServerConfig;
  cors: CorsConfig;
  security: SecurityConfig;
  ai: AIConfig;
  fileProcessing: FileProcessingConfig;
  logging: LoggingConfig;
  features: FeatureConfig;
  monitoring: MonitoringConfig;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  port: number;
  host: string;
  environment: string;
  platform: string;
  url: string;
  timeout: number;
  maxConnections?: number;
  keepAliveTimeout: number;
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
  methods: string[];
  headers: string[];
  maxAge: number;
  exposedHeaders: string[];
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  apiKeys: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    message: string;
  };
  headers: {
    poweredBy: string;
    frameOptions: string;
    contentTypeOptions: boolean;
    referrerPolicy: string;
    hsts: {
      enabled: boolean;
      maxAge: number;
      includeSubDomains: boolean;
    };
  };
}

/**
 * AI configuration
 */
export interface AIConfig {
  enabled: boolean;
  provider: "google";
  google: {
    apiKey: string;
    model: string;
    temperature: number;
    maxRetries: number;
    retryDelayMs: number;
    timeoutMs: number;
    safetySettings?: Array<{
      category: string;
      threshold: string;
    }>;
  };
}

/**
 * File processing configuration
 */
export interface FileProcessingConfig {
  maxFileSizeMB: number;
  maxFileSizeBytes: number;
  allowedTypes: string[];
  tempDir: string;
  cleanupAfterMs: number;
  parallelProcessing: {
    enabled: boolean;
    maxConcurrent: number;
  };
  validation: {
    strictMode: boolean;
    checkFileContent: boolean;
    allowEmptyFiles: boolean;
  };
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: string;
  format: "json" | "text";
  enableAccessLog: boolean;
  enablePerformanceLog: boolean;
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  excludePaths: string[];
  maxBodySize: number;
}

/**
 * Feature configuration
 */
export interface FeatureConfig {
  aiGrading: boolean;
  manualGrading: boolean;
  batchProcessing: boolean;
  excelExport: boolean;
  documentAnalysis: boolean;
  submissionTracking: boolean;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  healthCheck: {
    enabled: boolean;
    path: string;
    token?: string;
  };
  metrics: {
    enabled: boolean;
    endpoint?: string;
  };
  sentry: {
    enabled: boolean;
    dsn?: string;
  };
  performance: {
    slowRequestThreshold: number;
    memoryUsageTracking: boolean;
  };
}

/**
 * Create application configuration
 */
function createAppConfig(): AppConfig {
  return {
    server: {
      port: env.PORT,
      host: env.HOST,
      environment: env.NODE_ENV,
      platform: EnvUtils.getPlatform(),
      url: EnvUtils.getServerUrl(),
      timeout: 30000, // 30 seconds
      keepAliveTimeout: 65000, // 65 seconds
    },

    cors: {
      origin: EnvUtils.getAllowedOrigins().length > 0 
        ? EnvUtils.getAllowedOrigins() 
        : (env.NODE_ENV === "development" ? "*" : []),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      headers: ["Content-Type", "Authorization", "X-Requested-With", "X-API-Key"],
      maxAge: 86400, // 24 hours
      exposedHeaders: ["Content-Disposition", "X-Request-ID"],
    },

    security: {
      apiKeys: EnvUtils.getApiKeys(),
      rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
        message: "Too many requests, please try again later",
      },
      headers: {
        poweredBy: "Office Format Analyzer",
        frameOptions: "DENY",
        contentTypeOptions: true,
        referrerPolicy: "no-referrer",
        hsts: {
          enabled: env.NODE_ENV === "production",
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
        },
      },
    },

    ai: {
      enabled: env.ENABLE_AI_GRADING,
      provider: "google",
      google: {
        apiKey: env.GOOGLE_API_KEY,
        model: env.GOOGLE_AI_MODEL,
        temperature: env.GOOGLE_AI_TEMPERATURE,
        maxRetries: env.GOOGLE_AI_MAX_RETRIES,
        retryDelayMs: env.GOOGLE_AI_RETRY_DELAY_MS,
        timeoutMs: env.GOOGLE_AI_TIMEOUT_MS,
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      },
    },

    fileProcessing: {
      maxFileSizeMB: env.MAX_FILE_SIZE_MB,
      maxFileSizeBytes: EnvUtils.getMaxFileSizeBytes(),
      allowedTypes: [".docx", ".pptx"],
      tempDir: EnvUtils.getTempDir(),
      cleanupAfterMs: env.CLEANUP_TEMP_FILES_AFTER_MS,
      parallelProcessing: {
        enabled: true,
        maxConcurrent: 3,
      },
      validation: {
        strictMode: env.NODE_ENV === "production",
        checkFileContent: true,
        allowEmptyFiles: false,
      },
    },

    logging: {
      level: env.LOG_LEVEL,
      format: env.NODE_ENV === "production" ? "json" : "text",
      enableAccessLog: env.ENABLE_ACCESS_LOG,
      enablePerformanceLog: env.ENABLE_PERFORMANCE_LOG,
      includeRequestBody: env.NODE_ENV === "development",
      includeResponseBody: false,
      excludePaths: ["/healthz", "/readyz", "/metrics"],
      maxBodySize: 1024, // 1KB
    },

    features: {
      aiGrading: env.ENABLE_AI_GRADING,
      manualGrading: env.ENABLE_MANUAL_GRADING,
      batchProcessing: env.ENABLE_BATCH_PROCESSING,
      excelExport: env.ENABLE_EXCEL_EXPORT,
      documentAnalysis: true,
      submissionTracking: true,
    },

    monitoring: {
      healthCheck: {
        enabled: true,
        path: "/healthz",
        token: env.HEALTH_CHECK_TOKEN,
      },
      metrics: {
        enabled: !!env.METRICS_ENDPOINT,
        endpoint: env.METRICS_ENDPOINT,
      },
      sentry: {
        enabled: !!env.SENTRY_DSN,
        dsn: env.SENTRY_DSN,
      },
      performance: {
        slowRequestThreshold: 1000, // 1 second
        memoryUsageTracking: env.NODE_ENV === "development",
      },
    },
  };
}

/**
 * Application configuration instance
 */
export const appConfig = createAppConfig();

/**
 * Configuration utilities
 */
export const ConfigUtils = {
  /**
   * Get configuration for specific environment
   */
  getEnvConfig: (environment: string) => {
    const config = { ...appConfig };
    
    if (environment === "test") {
      config.logging.level = "error";
      config.fileProcessing.tempDir = "./test-temp";
      config.ai.enabled = false;
    }
    
    return config;
  },

  /**
   * Validate configuration
   */
  validate: (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate AI configuration
    if (appConfig.ai.enabled && !appConfig.ai.google.apiKey) {
      errors.push("AI grading is enabled but Google API key is missing");
    }

    // Validate file processing
    if (appConfig.fileProcessing.maxFileSizeMB <= 0) {
      errors.push("Max file size must be greater than 0");
    }

    // Validate security
    if (appConfig.security.rateLimit.maxRequests <= 0) {
      errors.push("Rate limit max requests must be greater than 0");
    }

    // Validate server
    if (appConfig.server.port <= 0 || appConfig.server.port > 65535) {
      errors.push("Server port must be between 1 and 65535");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get feature flags
   */
  getFeatureFlags: () => ({
    AI_GRADING: appConfig.features.aiGrading,
    MANUAL_GRADING: appConfig.features.manualGrading,
    BATCH_PROCESSING: appConfig.features.batchProcessing,
    EXCEL_EXPORT: appConfig.features.excelExport,
    DOCUMENT_ANALYSIS: appConfig.features.documentAnalysis,
    SUBMISSION_TRACKING: appConfig.features.submissionTracking,
  }),

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled: (feature: keyof FeatureConfig): boolean => {
    return appConfig.features[feature];
  },

  /**
   * Get AI provider configuration
   */
  getAIConfig: () => {
    if (!appConfig.ai.enabled) {
      throw new Error("AI is not enabled");
    }
    return appConfig.ai.google;
  },

  /**
   * Get security configuration
   */
  getSecurityConfig: () => appConfig.security,

  /**
   * Get CORS configuration
   */
  getCorsConfig: () => appConfig.cors,

  /**
   * Update configuration at runtime (for testing)
   */
  updateConfig: <K extends keyof AppConfig>(
    section: K,
    updates: Partial<AppConfig[K]>
  ) => {
    Object.assign(appConfig[section], updates);
  },
};

/**
 * Print configuration summary
 */
export function printAppConfigSummary(): void {
  console.log("🏗️  Application Configuration:");
  console.log(`  Server: ${appConfig.server.host}:${appConfig.server.port}`);
  console.log(`  Environment: ${appConfig.server.environment}`);
  console.log(`  Platform: ${appConfig.server.platform}`);
  console.log("");
  
  console.log("🤖 AI Configuration:");
  console.log(`  Enabled: ${appConfig.ai.enabled}`);
  console.log(`  Model: ${appConfig.ai.google.model}`);
  console.log(`  Temperature: ${appConfig.ai.google.temperature}`);
  console.log("");
  
  console.log("📁 File Processing:");
  console.log(`  Max Size: ${appConfig.fileProcessing.maxFileSizeMB}MB`);
  console.log(`  Allowed Types: ${appConfig.fileProcessing.allowedTypes.join(", ")}`);
  console.log(`  Temp Dir: ${appConfig.fileProcessing.tempDir}`);
  console.log("");
  
  console.log("🛡️  Security:");
  console.log(`  Rate Limit: ${appConfig.security.rateLimit.maxRequests} requests per ${appConfig.security.rateLimit.windowMs / 60000} minutes`);
  console.log(`  API Keys: ${appConfig.security.apiKeys.length > 0 ? "configured" : "none"}`);
  console.log("");
  
  console.log("🚀 Features:");
  Object.entries(appConfig.features).forEach(([feature, enabled]) => {
    console.log(`  ${feature}: ${enabled ? "enabled" : "disabled"}`);
  });
  
  const validation = ConfigUtils.validate();
  if (!validation.valid) {
    console.warn("");
    console.warn("⚠️  Configuration Issues:");
    validation.errors.forEach(error => console.warn(`  - ${error}`));
  }
}