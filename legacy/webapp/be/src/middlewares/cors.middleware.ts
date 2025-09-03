import type { Context, Next } from "hono";
import { cors } from "hono/cors";

/**
 * CORS configuration interface
 */
export interface CorsConfig {
  origins?: string | string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
  exposeHeaders?: string[];
}

/**
 * Default CORS configuration
 */
const DEFAULT_CORS_CONFIG: CorsConfig = {
  origins: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  headers: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // 24 hours
  exposeHeaders: ["Content-Disposition"],
};

/**
 * Parse allowed origins from environment variable
 */
function parseAllowedOrigins(envValue?: string): string | string[] {
  if (!envValue || envValue.trim() === "*") return "*";
  
  const list = envValue
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  
  return list.length <= 1 ? (list[0] ?? "*") : list;
}

/**
 * Create CORS middleware with configuration
 */
export function createCorsMiddleware(config?: Partial<CorsConfig>) {
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);
  
  const corsConfig = {
    ...DEFAULT_CORS_CONFIG,
    ...config,
    origin: config?.origins ?? allowedOrigins,
  };

  return cors({
    origin: corsConfig.origin,
    credentials: corsConfig.credentials,
    allowMethods: corsConfig.methods,
    allowHeaders: corsConfig.headers,
    maxAge: corsConfig.maxAge,
    exposeHeaders: corsConfig.exposeHeaders,
  });
}

/**
 * CORS middleware for development environment
 */
export const developmentCorsMiddleware = createCorsMiddleware({
  origins: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
  credentials: true,
});

/**
 * CORS middleware for production environment
 */
export const productionCorsMiddleware = createCorsMiddleware({
  origins: process.env.ALLOWED_ORIGINS?.split(",") || ["https://yourdomain.com"],
  credentials: true,
});

/**
 * Environment-aware CORS middleware
 */
export const corsMiddleware = process.env.NODE_ENV === "production" 
  ? productionCorsMiddleware 
  : developmentCorsMiddleware;

/**
 * Custom CORS preflight handler
 */
export async function corsPreflightHandler(c: Context, next: Next) {
  // Handle preflight requests
  if (c.req.method === "OPTIONS") {
    const origin = c.req.header("Origin");
    const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);
    
    // Check if origin is allowed
    const isOriginAllowed = allowedOrigins === "*" || 
      (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin || "")) ||
      (typeof allowedOrigins === "string" && allowedOrigins === origin);

    if (isOriginAllowed) {
      c.header("Access-Control-Allow-Origin", origin || "*");
      c.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      c.header("Access-Control-Allow-Credentials", "true");
      c.header("Access-Control-Max-Age", "86400");
      
      return c.text("", 204);
    } else {
      return c.text("CORS policy violation", 403);
    }
  }
  
  await next();
}

/**
 * CORS validation middleware
 */
export async function corsValidationMiddleware(c: Context, next: Next) {
  const origin = c.req.header("Origin");
  
  if (origin) {
    const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);
    
    const isOriginAllowed = allowedOrigins === "*" || 
      (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) ||
      (typeof allowedOrigins === "string" && allowedOrigins === origin);

    if (!isOriginAllowed) {
      return c.json(
        { 
          error: "CORS policy violation", 
          message: `Origin ${origin} is not allowed` 
        }, 
        403
      );
    }
  }
  
  await next();
}