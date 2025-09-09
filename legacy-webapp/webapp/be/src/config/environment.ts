import { z } from "zod";

/**
 * Environment validation schema
 */
const EnvironmentSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  PORT: z.string().default("3000").transform(Number),
  HOST: z.string().default("localhost"),

  // CORS configuration
  CORS_ORIGIN: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),

  // Database configuration (if needed in future)
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // AI configuration
  GOOGLE_API_KEY: z.string().min(1, "Google API key is required"),
  GOOGLE_AI_MODEL: z.string().default("models/gemini-2.5-flash-lite"),
  GOOGLE_AI_TEMPERATURE: z.string().default("0").transform(Number),
  GOOGLE_AI_MAX_RETRIES: z.string().default("3").transform(Number),
  GOOGLE_AI_RETRY_DELAY_MS: z.string().default("1000").transform(Number),
  GOOGLE_AI_TIMEOUT_MS: z.string().default("30000").transform(Number),

  // File processing configuration
  MAX_FILE_SIZE_MB: z.string().default("50").transform(Number),
  TEMP_DIR: z.string().optional(),
  CLEANUP_TEMP_FILES_AFTER_MS: z.string().default("3600000").transform(Number), // 1 hour

  // Security configuration
  API_KEYS: z.string().optional(), // Comma-separated list
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),

  // Logging configuration
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal"]).default("info"),
  ENABLE_ACCESS_LOG: z.string().default("false").transform(val => val === "true"),
  ENABLE_PERFORMANCE_LOG: z.string().default("false").transform(val => val === "true"),

  // External services (future use)
  WEBHOOK_URL: z.string().optional(),
  NOTIFICATION_SERVICE_URL: z.string().optional(),
  
  // Monitoring and observability
  SENTRY_DSN: z.string().optional(),
  METRICS_ENDPOINT: z.string().optional(),
  HEALTH_CHECK_TOKEN: z.string().optional(),

  // Feature flags
  ENABLE_AI_GRADING: z.string().default("true").transform(val => val !== "false"),
  ENABLE_MANUAL_GRADING: z.string().default("true").transform(val => val !== "false"),
  ENABLE_BATCH_PROCESSING: z.string().default("true").transform(val => val !== "false"),
  ENABLE_EXCEL_EXPORT: z.string().default("true").transform(val => val !== "false"),

  // Railway/Platform specific
  RAILWAY_ENVIRONMENT: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
  RENDER_SERVICE_ID: z.string().optional(),
});

/**
 * Environment variables type
 */
export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * Load and validate environment variables
 */
function loadEnvironment(): Environment {
  try {
    // Parse and validate environment variables
    const env = EnvironmentSchema.parse(process.env);
    
    // Additional validation
    if (env.NODE_ENV === "production" && !env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is required in production");
    }

    if (env.MAX_FILE_SIZE_MB > 100) {
      console.warn("Warning: MAX_FILE_SIZE_MB is set to a very high value:", env.MAX_FILE_SIZE_MB);
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Environment validation failed:");
      error.issues.forEach(issue => {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Environment configuration
 */
export const env = loadEnvironment();

/**
 * Environment utilities
 */
export const EnvUtils = {
  /**
   * Check if running in development
   */
  isDevelopment: () => env.NODE_ENV === "development",

  /**
   * Check if running in production
   */
  isProduction: () => env.NODE_ENV === "production",

  /**
   * Check if running in test
   */
  isTest: () => env.NODE_ENV === "test",

  /**
   * Get allowed origins as array
   */
  getAllowedOrigins: (): string[] => {
    if (env.ALLOWED_ORIGINS) {
      return env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim());
    }
    if (env.CORS_ORIGIN) {
      return env.CORS_ORIGIN.split(",").map(origin => origin.trim());
    }
    return [];
  },

  /**
   * Get API keys as array
   */
  getApiKeys: (): string[] => {
    if (env.API_KEYS) {
      return env.API_KEYS.split(",").map(key => key.trim());
    }
    return [];
  },

  /**
   * Get max file size in bytes
   */
  getMaxFileSizeBytes: () => env.MAX_FILE_SIZE_MB * 1024 * 1024,

  /**
   * Get platform information
   */
  getPlatform: (): "railway" | "vercel" | "render" | "local" => {
    if (env.RAILWAY_ENVIRONMENT) return "railway";
    if (env.VERCEL_ENV) return "vercel";
    if (env.RENDER_SERVICE_ID) return "render";
    return "local";
  },

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled: (feature: keyof Pick<Environment, "ENABLE_AI_GRADING" | "ENABLE_MANUAL_GRADING" | "ENABLE_BATCH_PROCESSING" | "ENABLE_EXCEL_EXPORT">): boolean => {
    return env[feature];
  },

  /**
   * Get temporary directory
   */
  getTempDir: (): string => {
    return env.TEMP_DIR || (EnvUtils.isProduction() ? "/tmp" : "./temp");
  },

  /**
   * Get server URL
   */
  getServerUrl: (): string => {
    if (env.NODE_ENV === "production") {
      // In production, try to determine from platform
      if (env.VERCEL_ENV) {
        return `https://${process.env.VERCEL_URL}`;
      }
      if (env.RAILWAY_ENVIRONMENT) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      }
      if (env.RENDER_SERVICE_ID) {
        return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
      }
    }
    
    // Development or fallback
    const protocol = env.NODE_ENV === "production" ? "https" : "http";
    return `${protocol}://${env.HOST}:${env.PORT}`;
  },
};

/**
 * Configuration validation
 */
export function validateConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables for production
  if (env.NODE_ENV === "production") {
    if (!env.GOOGLE_API_KEY) {
      errors.push("GOOGLE_API_KEY is required in production");
    }
  }

  // Check AI configuration
  if (env.ENABLE_AI_GRADING && !env.GOOGLE_API_KEY) {
    errors.push("GOOGLE_API_KEY is required when AI grading is enabled");
  }

  // Check file size limits
  if (env.MAX_FILE_SIZE_MB <= 0) {
    errors.push("MAX_FILE_SIZE_MB must be greater than 0");
  }

  // Check rate limiting configuration
  if (env.RATE_LIMIT_MAX_REQUESTS <= 0) {
    errors.push("RATE_LIMIT_MAX_REQUESTS must be greater than 0");
  }

  if (env.RATE_LIMIT_WINDOW_MS <= 0) {
    errors.push("RATE_LIMIT_WINDOW_MS must be greater than 0");
  }

  // Check AI model settings
  if (env.GOOGLE_AI_TEMPERATURE < 0 || env.GOOGLE_AI_TEMPERATURE > 2) {
    errors.push("GOOGLE_AI_TEMPERATURE must be between 0 and 2");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Print configuration summary
 */
export function printConfigSummary(): void {
  console.log("🔧 Configuration Summary:");
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Platform: ${EnvUtils.getPlatform()}`);
  console.log(`  Server: ${env.HOST}:${env.PORT}`);
  console.log(`  AI Grading: ${env.ENABLE_AI_GRADING ? "enabled" : "disabled"}`);
  console.log(`  Manual Grading: ${env.ENABLE_MANUAL_GRADING ? "enabled" : "disabled"}`);
  console.log(`  Max File Size: ${env.MAX_FILE_SIZE_MB}MB`);
  console.log(`  Log Level: ${env.LOG_LEVEL}`);
  
  const validation = validateConfiguration();
  if (!validation.valid) {
    console.warn("⚠️  Configuration Issues:");
    validation.errors.forEach(error => console.warn(`  - ${error}`));
  } else {
    console.log("✅ Configuration is valid");
  }
}