import { env } from "./environment";

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  url?: string;
  type: "none" | "sqlite" | "postgresql" | "mysql";
  connection: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
  };
  pool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  options: {
    synchronize: boolean;
    logging: boolean;
    migrations: {
      enabled: boolean;
      directory: string;
    };
    cache: {
      enabled: boolean;
      duration: number;
    };
  };
}

/**
 * Redis configuration interface
 */
export interface RedisConfig {
  enabled: boolean;
  url?: string;
  connection: {
    host: string;
    port: number;
    password?: string;
    database: number;
  };
  options: {
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
    keepAlive: boolean;
  };
  cache: {
    ttl: number; // Time to live in seconds
    prefix: string;
  };
}

/**
 * Parse database URL
 */
function parseDatabaseUrl(url: string): Partial<DatabaseConfig["connection"]> {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : undefined,
      database: parsed.pathname.substring(1), // Remove leading slash
      username: parsed.username,
      password: parsed.password,
      ssl: parsed.searchParams.get("ssl") === "true" || parsed.protocol === "postgresql:",
    };
  } catch (error) {
    console.warn("Failed to parse database URL:", error);
    return {};
  }
}

/**
 * Parse Redis URL
 */
function parseRedisUrl(url: string): Partial<RedisConfig["connection"]> {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : 6379,
      password: parsed.password,
      database: parsed.pathname ? parseInt(parsed.pathname.substring(1)) : 0,
    };
  } catch (error) {
    console.warn("Failed to parse Redis URL:", error);
    return {};
  }
}

/**
 * Create database configuration
 */
function createDatabaseConfig(): DatabaseConfig {
  const config: DatabaseConfig = {
    type: "none", // Default to no database
    connection: {},
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    options: {
      synchronize: env.NODE_ENV === "development",
      logging: env.NODE_ENV === "development",
      migrations: {
        enabled: env.NODE_ENV === "production",
        directory: "./migrations",
      },
      cache: {
        enabled: true,
        duration: 30000, // 30 seconds
      },
    },
  };

  // Configure based on DATABASE_URL if provided
  if (env.DATABASE_URL) {
    config.url = env.DATABASE_URL;
    
    // Determine database type from URL
    if (env.DATABASE_URL.startsWith("postgresql://") || env.DATABASE_URL.startsWith("postgres://")) {
      config.type = "postgresql";
    } else if (env.DATABASE_URL.startsWith("mysql://")) {
      config.type = "mysql";
    } else if (env.DATABASE_URL.startsWith("sqlite://") || env.DATABASE_URL.includes(".sqlite")) {
      config.type = "sqlite";
    }

    // Parse connection details
    config.connection = parseDatabaseUrl(env.DATABASE_URL);
  }

  // Production optimizations
  if (env.NODE_ENV === "production") {
    config.pool.max = 20;
    config.pool.idleTimeoutMillis = 60000;
    config.options.logging = false;
    config.options.cache.duration = 300000; // 5 minutes
  }

  return config;
}

/**
 * Create Redis configuration
 */
function createRedisConfig(): RedisConfig {
  const config: RedisConfig = {
    enabled: !!env.REDIS_URL,
    connection: {
      host: "localhost",
      port: 6379,
      database: 0,
    },
    options: {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: true,
    },
    cache: {
      ttl: 3600, // 1 hour
      prefix: "office-grader:",
    },
  };

  // Configure from REDIS_URL if provided
  if (env.REDIS_URL) {
    config.url = env.REDIS_URL;
    config.connection = {
      ...config.connection,
      ...parseRedisUrl(env.REDIS_URL),
    };
  }

  // Environment-specific settings
  if (env.NODE_ENV === "production") {
    config.cache.ttl = 7200; // 2 hours in production
    config.options.maxRetriesPerRequest = 5;
  } else if (env.NODE_ENV === "test") {
    config.enabled = false; // Disable Redis in tests
    config.cache.ttl = 60; // 1 minute for tests
  }

  return config;
}

/**
 * Database configuration instance
 */
export const databaseConfig = createDatabaseConfig();

/**
 * Redis configuration instance
 */
export const redisConfig = createRedisConfig();

/**
 * Database utilities
 */
export const DatabaseUtils = {
  /**
   * Check if database is configured
   */
  isConfigured: (): boolean => {
    return databaseConfig.type !== "none" && !!databaseConfig.url;
  },

  /**
   * Get connection string for database type
   */
  getConnectionString: (): string | undefined => {
    return databaseConfig.url;
  },

  /**
   * Validate database configuration
   */
  validate: (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (databaseConfig.type !== "none") {
      if (!databaseConfig.url && !databaseConfig.connection.host) {
        errors.push("Database URL or connection details required");
      }

      if (databaseConfig.pool.max <= databaseConfig.pool.min) {
        errors.push("Database pool max must be greater than min");
      }

      if (env.NODE_ENV === "production" && databaseConfig.options.synchronize) {
        errors.push("Database synchronize should be disabled in production");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get database type
   */
  getType: () => databaseConfig.type,

  /**
   * Check if migrations are enabled
   */
  areMigrationsEnabled: (): boolean => {
    return databaseConfig.options.migrations.enabled;
  },
};

/**
 * Redis utilities
 */
export const RedisUtils = {
  /**
   * Check if Redis is enabled
   */
  isEnabled: (): boolean => {
    return redisConfig.enabled;
  },

  /**
   * Get Redis connection details
   */
  getConnectionDetails: () => ({
    host: redisConfig.connection.host,
    port: redisConfig.connection.port,
    database: redisConfig.connection.database,
    password: redisConfig.connection.password,
  }),

  /**
   * Get cache configuration
   */
  getCacheConfig: () => redisConfig.cache,

  /**
   * Validate Redis configuration
   */
  validate: (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (redisConfig.enabled) {
      if (!redisConfig.connection.host) {
        errors.push("Redis host is required when Redis is enabled");
      }

      if (redisConfig.connection.port <= 0 || redisConfig.connection.port > 65535) {
        errors.push("Redis port must be between 1 and 65535");
      }

      if (redisConfig.cache.ttl <= 0) {
        errors.push("Redis cache TTL must be greater than 0");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Generate cache key
   */
  generateCacheKey: (prefix: string, ...parts: string[]): string => {
    return `${redisConfig.cache.prefix}${prefix}:${parts.join(":")}`;
  },
};

/**
 * Storage configuration for future file storage needs
 */
export interface StorageConfig {
  type: "local" | "s3" | "gcs" | "azure";
  local: {
    directory: string;
    maxSize: number;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  gcs?: {
    bucket: string;
    projectId: string;
    keyFilename: string;
  };
  azure?: {
    containerName: string;
    accountName: string;
    accountKey: string;
  };
}

/**
 * Create storage configuration
 */
function createStorageConfig(): StorageConfig {
  return {
    type: "local", // Default to local storage
    local: {
      directory: "./uploads",
      maxSize: 100 * 1024 * 1024, // 100MB
    },
  };
}

/**
 * Storage configuration instance
 */
export const storageConfig = createStorageConfig();

/**
 * Print database configuration summary
 */
export function printDatabaseConfigSummary(): void {
  console.log("🗄️  Database Configuration:");
  console.log(`  Type: ${databaseConfig.type}`);
  
  if (DatabaseUtils.isConfigured()) {
    console.log(`  Host: ${databaseConfig.connection.host || "from URL"}`);
    console.log(`  Database: ${databaseConfig.connection.database || "from URL"}`);
    console.log(`  Pool: ${databaseConfig.pool.min}-${databaseConfig.pool.max} connections`);
    console.log(`  Migrations: ${databaseConfig.options.migrations.enabled ? "enabled" : "disabled"}`);
  } else {
    console.log("  Status: Not configured (using in-memory storage)");
  }
  
  console.log("");
  console.log("📦 Redis Configuration:");
  console.log(`  Enabled: ${redisConfig.enabled}`);
  
  if (redisConfig.enabled) {
    console.log(`  Host: ${redisConfig.connection.host}:${redisConfig.connection.port}`);
    console.log(`  Database: ${redisConfig.connection.database}`);
    console.log(`  Cache TTL: ${redisConfig.cache.ttl}s`);
  }
  
  const dbValidation = DatabaseUtils.validate();
  const redisValidation = RedisUtils.validate();
  
  if (!dbValidation.valid || !redisValidation.valid) {
    console.warn("");
    console.warn("⚠️  Database/Redis Issues:");
    [...dbValidation.errors, ...redisValidation.errors].forEach(error => {
      console.warn(`  - ${error}`);
    });
  }
}