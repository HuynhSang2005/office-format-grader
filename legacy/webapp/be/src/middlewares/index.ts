/**
 * Centralized export for all middlewares
 * This provides a single point of import for all middleware functions
 */

// CORS middleware
export * from "./cors.middleware";

// Validation middleware
export * from "./validation.middleware";

// Security middleware
export * from "./security.middleware";

// Error handling middleware
export * from "./error.middleware";

// Logging middleware
export * from "./logging.middleware";

/**
 * Middleware stack builder
 */
import type { Context, Next } from "hono";
import { corsMiddleware } from "./cors.middleware";
import { securityHeadersMiddleware } from "./security.middleware";
import { loggingMiddleware, accessLogMiddleware } from "./logging.middleware";
import { errorHandlerMiddleware } from "./error.middleware";

/**
 * Middleware configuration interface
 */
export interface MiddlewareConfig {
  enableCors?: boolean;
  enableSecurity?: boolean;
  enableLogging?: boolean;
  enableAccessLog?: boolean;
  enableErrorHandler?: boolean;
  cors?: any;
  security?: any;
  logging?: any;
  errorHandler?: any;
}

/**
 * Default middleware configuration
 */
const DEFAULT_MIDDLEWARE_CONFIG: MiddlewareConfig = {
  enableCors: true,
  enableSecurity: true,
  enableLogging: true,
  enableAccessLog: false,
  enableErrorHandler: true,
};

/**
 * Create a middleware stack with configuration
 */
export function createMiddlewareStack(config?: Partial<MiddlewareConfig>) {
  const middlewareConfig = { ...DEFAULT_MIDDLEWARE_CONFIG, ...config };
  const middlewares: Array<(c: Context, next: Next) => Promise<void>> = [];

  // Security headers (should be first)
  if (middlewareConfig.enableSecurity) {
    middlewares.push(securityHeadersMiddleware(middlewareConfig.security));
  }

  // CORS (should be early)
  if (middlewareConfig.enableCors) {
    middlewares.push(corsMiddleware);
  }

  // Logging (should be early to capture all requests)
  if (middlewareConfig.enableLogging) {
    middlewares.push(loggingMiddleware(middlewareConfig.logging));
  }

  // Access log (optional, usually for production)
  if (middlewareConfig.enableAccessLog) {
    middlewares.push(accessLogMiddleware());
  }

  return middlewares;
}

/**
 * Development middleware stack
 */
export const developmentMiddlewares = createMiddlewareStack({
  enableCors: true,
  enableSecurity: true,
  enableLogging: true,
  enableAccessLog: false,
  enableErrorHandler: true,
  logging: {
    logLevel: "debug",
    includeRequestBody: false,
    includeResponseBody: false,
    includeHeaders: true,
  },
});

/**
 * Production middleware stack
 */
export const productionMiddlewares = createMiddlewareStack({
  enableCors: true,
  enableSecurity: true,
  enableLogging: true,
  enableAccessLog: true,
  enableErrorHandler: true,
  logging: {
    logLevel: "info",
    includeRequestBody: false,
    includeResponseBody: false,
    includeHeaders: false,
  },
  security: {
    enableHSTS: true,
    enableCSP: false, // Usually handled by reverse proxy
  },
});

/**
 * Apply middleware stack to Hono app
 */
export function applyMiddlewares(
  app: any,
  middlewares: Array<(c: Context, next: Next) => Promise<void>>
) {
  middlewares.forEach(middleware => {
    app.use("*", middleware);
  });
}

/**
 * Middleware factory functions
 */
export const MiddlewareFactory = {
  cors: corsMiddleware,
  security: securityHeadersMiddleware,
  logging: loggingMiddleware,
  accessLog: accessLogMiddleware,
  errorHandler: errorHandlerMiddleware,
} as const;

/**
 * Common middleware combinations
 */
export const MiddlewareCombinations = {
  basic: [
    securityHeadersMiddleware(),
    corsMiddleware,
  ],
  
  api: [
    securityHeadersMiddleware(),
    corsMiddleware,
    loggingMiddleware(),
  ],
  
  production: [
    securityHeadersMiddleware({
      enableHSTS: true,
      enableCSP: false,
    }),
    corsMiddleware,
    loggingMiddleware({
      logLevel: "info",
      includeRequestBody: false,
    }),
    accessLogMiddleware(),
  ],
  
  development: [
    securityHeadersMiddleware(),
    corsMiddleware,
    loggingMiddleware({
      logLevel: "debug",
      includeHeaders: true,
    }),
  ],
} as const;

/**
 * Middleware utilities
 */
export const MiddlewareUtils = {
  /**
   * Create conditional middleware
   */
  conditional: (
    condition: boolean | ((c: Context) => boolean),
    middleware: (c: Context, next: Next) => Promise<void>
  ) => {
    return async (c: Context, next: Next) => {
      const shouldApply = typeof condition === "function" ? condition(c) : condition;
      if (shouldApply) {
        await middleware(c, next);
      } else {
        await next();
      }
    };
  },

  /**
   * Create middleware that only applies to specific paths
   */
  forPaths: (
    paths: string[],
    middleware: (c: Context, next: Next) => Promise<void>
  ) => {
    return async (c: Context, next: Next) => {
      const currentPath = c.req.path;
      const shouldApply = paths.some(path => 
        currentPath === path || currentPath.startsWith(path)
      );
      
      if (shouldApply) {
        await middleware(c, next);
      } else {
        await next();
      }
    };
  },

  /**
   * Create middleware that excludes specific paths
   */
  excludePaths: (
    paths: string[],
    middleware: (c: Context, next: Next) => Promise<void>
  ) => {
    return async (c: Context, next: Next) => {
      const currentPath = c.req.path;
      const shouldExclude = paths.some(path => 
        currentPath === path || currentPath.startsWith(path)
      );
      
      if (!shouldExclude) {
        await middleware(c, next);
      } else {
        await next();
      }
    };
  },

  /**
   * Create middleware that only applies to specific HTTP methods
   */
  forMethods: (
    methods: string[],
    middleware: (c: Context, next: Next) => Promise<void>
  ) => {
    return async (c: Context, next: Next) => {
      const currentMethod = c.req.method;
      const shouldApply = methods.includes(currentMethod);
      
      if (shouldApply) {
        await middleware(c, next);
      } else {
        await next();
      }
    };
  },
};