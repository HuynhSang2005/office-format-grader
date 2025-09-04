/**
 * Centralized export for all configuration modules
 * This provides a single point of import for all configuration settings
 */

// Environment configuration
export * from "./environment";

// Application configuration
export * from "./app";

// Database configuration
export * from "./database";

/**
 * Configuration bundle for easy import
 */
import { env, EnvUtils, validateConfiguration, printConfigSummary } from "./environment";
import { appConfig, ConfigUtils, printAppConfigSummary } from "./app";
import { 
  databaseConfig, 
  redisConfig, 
  storageConfig,
  DatabaseUtils, 
  RedisUtils,
  printDatabaseConfigSummary 
} from "./database";

/**
 * Complete configuration object
 */
export const config = {
  env,
  app: appConfig,
  database: databaseConfig,
  redis: redisConfig,
  storage: storageConfig,
} as const;

/**
 * Configuration utilities bundle
 */
export const Config = {
  // Environment utilities
  env: EnvUtils,
  
  // Application utilities
  app: ConfigUtils,
  
  // Database utilities
  database: DatabaseUtils,
  
  // Redis utilities
  redis: RedisUtils,
  
  /**
   * Validate all configurations
   */
  validateAll: () => {
    const envValidation = validateConfiguration();
    const appValidation = ConfigUtils.validate();
    const dbValidation = DatabaseUtils.validate();
    const redisValidation = RedisUtils.validate();
    
    const allErrors = [
      ...envValidation.errors,
      ...appValidation.errors,
      ...dbValidation.errors,
      ...redisValidation.errors,
    ];
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      details: {
        environment: envValidation,
        application: appValidation,
        database: dbValidation,
        redis: redisValidation,
      },
    };
  },
  
  /**
   * Print complete configuration summary
   */
  printSummary: () => {
    console.log("🚀 Office Format Grader AI - Configuration");
    console.log("=" .repeat(50));
    
    printConfigSummary();
    console.log("");
    
    printAppConfigSummary();
    console.log("");
    
    printDatabaseConfigSummary();
    
    console.log("=" .repeat(50));
    
    const validation = Config.validateAll();
    if (validation.valid) {
      console.log("✅ All configurations are valid");
    } else {
      console.log("❌ Configuration validation failed:");
      validation.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log("");
  },
  
  /**
   * Get configuration for specific service
   */
  getServiceConfig: (service: "ai" | "fileProcessing" | "security" | "cors") => {
    switch (service) {
      case "ai":
        return ConfigUtils.getAIConfig();
      case "fileProcessing":
        return appConfig.fileProcessing;
      case "security":
        return ConfigUtils.getSecurityConfig();
      case "cors":
        return ConfigUtils.getCorsConfig();
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  },
  
  /**
   * Check if service is enabled
   */
  isServiceEnabled: (service: string): boolean => {
    switch (service) {
      case "ai":
      case "aiGrading":
        return appConfig.features.aiGrading && appConfig.ai.enabled;
      case "manual":
      case "manualGrading":
        return appConfig.features.manualGrading;
      case "batch":
      case "batchProcessing":
        return appConfig.features.batchProcessing;
      case "excel":
      case "excelExport":
        return appConfig.features.excelExport;
      case "database":
        return DatabaseUtils.isConfigured();
      case "redis":
        return RedisUtils.isEnabled();
      default:
        return false;
    }
  },
  
  /**
   * Get runtime information
   */
  getRuntimeInfo: () => ({
    platform: EnvUtils.getPlatform(),
    environment: env.NODE_ENV,
    nodeVersion: process.version,
    runtime: "bun",
    startTime: new Date().toISOString(),
    serverUrl: EnvUtils.getServerUrl(),
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  }),
  
  /**
   * Get feature flags as object
   */
  getFeatureFlags: () => ConfigUtils.getFeatureFlags(),
  
  /**
   * Initialize configuration (run validations and setup)
   */
  initialize: () => {
    console.log("🔧 Initializing configuration...");
    
    const validation = Config.validateAll();
    if (!validation.valid) {
      console.error("❌ Configuration validation failed:");
      validation.errors.forEach(error => console.error(`  - ${error}`));
      
      if (env.NODE_ENV === "production") {
        console.error("Exiting due to configuration errors in production");
        process.exit(1);
      } else {
        console.warn("Continuing with configuration errors in development");
      }
    }
    
    // Set up environment-specific configurations
    if (env.NODE_ENV === "development") {
      console.log("🛠️  Development mode configuration applied");
    } else if (env.NODE_ENV === "production") {
      console.log("🚀 Production mode configuration applied");
    }
    
    console.log("✅ Configuration initialized successfully");
    return validation.valid;
  },
} as const;

/**
 * Configuration constants
 */
export const CONFIG_CONSTANTS = {
  // File processing
  SUPPORTED_FILE_TYPES: [".docx", ".pptx"],
  MAX_FILE_SIZE_DEFAULT: 50 * 1024 * 1024, // 50MB
  TEMP_DIR_DEFAULT: "./temp",
  
  // AI settings
  AI_MODEL_DEFAULT: "models/gemini-2.5-flash-lite",
  AI_TEMPERATURE_DEFAULT: 0,
  AI_MAX_RETRIES_DEFAULT: 3,
  
  // Security
  RATE_LIMIT_WINDOW_DEFAULT: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS_DEFAULT: 100,
  
  // Server
  PORT_DEFAULT: 3000,
  HOST_DEFAULT: "localhost",
  
  // Timeouts
  REQUEST_TIMEOUT_DEFAULT: 30000, // 30 seconds
  AI_TIMEOUT_DEFAULT: 30000,
  
  // Cache
  CACHE_TTL_DEFAULT: 3600, // 1 hour
  
  // Paths
  HEALTH_CHECK_PATH: "/healthz",
  READY_CHECK_PATH: "/readyz",
  METRICS_PATH: "/metrics",
} as const;

/**
 * Export default configuration
 */
export default config;