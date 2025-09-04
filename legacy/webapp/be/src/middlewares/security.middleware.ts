import type { Context, Next } from "hono";

/**
 * Security configuration interface
 */
export interface SecurityConfig {
  enableXPoweredBy?: boolean;
  customPoweredBy?: string;
  enableContentTypeOptions?: boolean;
  enableFrameOptions?: boolean;
  framePolicy?: "DENY" | "SAMEORIGIN" | "ALLOW-FROM";
  enableReferrerPolicy?: boolean;
  referrerPolicy?: string;
  enableCSP?: boolean;
  cspDirectives?: Record<string, string>;
  enableHSTS?: boolean;
  hstsMaxAge?: number;
  hstsIncludeSubDomains?: boolean;
  hstsPreload?: boolean;
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableXPoweredBy: true,
  customPoweredBy: "Office Format Analyzer",
  enableContentTypeOptions: true,
  enableFrameOptions: true,
  framePolicy: "DENY",
  enableReferrerPolicy: true,
  referrerPolicy: "no-referrer",
  enableCSP: false, // Disabled by default for API
  enableHSTS: false, // Should be enabled in production with HTTPS
  hstsMaxAge: 31536000, // 1 year
  hstsIncludeSubDomains: true,
  hstsPreload: false,
};

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(config?: Partial<SecurityConfig>) {
  const securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

  return async (c: Context, next: Next) => {
    await next();

    // X-Powered-By header
    if (securityConfig.enableXPoweredBy && securityConfig.customPoweredBy) {
      c.header("x-powered-by", securityConfig.customPoweredBy);
    } else if (!securityConfig.enableXPoweredBy) {
      c.header("x-powered-by", ""); // Remove default powered by
    }

    // X-Content-Type-Options
    if (securityConfig.enableContentTypeOptions) {
      c.header("x-content-type-options", "nosniff");
    }

    // X-Frame-Options
    if (securityConfig.enableFrameOptions && securityConfig.framePolicy) {
      c.header("x-frame-options", securityConfig.framePolicy);
    }

    // Referrer-Policy
    if (securityConfig.enableReferrerPolicy && securityConfig.referrerPolicy) {
      c.header("referrer-policy", securityConfig.referrerPolicy);
    }

    // Content Security Policy
    if (securityConfig.enableCSP && securityConfig.cspDirectives) {
      const cspValue = Object.entries(securityConfig.cspDirectives)
        .map(([directive, value]) => `${directive} ${value}`)
        .join("; ");
      c.header("content-security-policy", cspValue);
    }

    // HTTP Strict Transport Security
    if (securityConfig.enableHSTS) {
      let hstsValue = `max-age=${securityConfig.hstsMaxAge}`;
      if (securityConfig.hstsIncludeSubDomains) {
        hstsValue += "; includeSubDomains";
      }
      if (securityConfig.hstsPreload) {
        hstsValue += "; preload";
      }
      c.header("strict-transport-security", hstsValue);
    }

    // Additional security headers
    c.header("x-dns-prefetch-control", "off");
    c.header("x-download-options", "noopen");
    c.header("x-permitted-cross-domain-policies", "none");
  };
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (c: Context) => string;
}

/**
 * Simple in-memory rate limiter
 */
class InMemoryRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  isAllowed(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // New window or expired window
      const resetTime = now + config.windowMs;
      this.requests.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: config.maxRequests - 1, resetTime };
    }

    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    // Increment count
    record.count += 1;
    this.requests.set(key, record);
    return { allowed: true, remaining: config.maxRequests - record.count, resetTime: record.resetTime };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const globalRateLimiter = new InMemoryRateLimiter();

// Cleanup expired entries every 5 minutes
setInterval(() => globalRateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  const defaultKeyGenerator = (c: Context) => {
    const forwarded = c.req.header("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : c.req.header("x-real-ip") || "unknown";
    return ip;
  };

  const keyGenerator = config.keyGenerator || defaultKeyGenerator;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const result = globalRateLimiter.isAllowed(key, config);

    // Set rate limit headers
    c.header("x-ratelimit-limit", config.maxRequests.toString());
    c.header("x-ratelimit-remaining", result.remaining.toString());
    c.header("x-ratelimit-reset", Math.ceil(result.resetTime / 1000).toString());

    if (!result.allowed) {
      c.header("retry-after", Math.ceil((result.resetTime - Date.now()) / 1000).toString());
      return c.json(
        {
          success: false,
          error: "Rate limit exceeded",
          message: config.message || "Too many requests",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          timestamp: new Date().toISOString(),
        },
        429
      );
    }

    await next();

    // Optionally skip counting for successful/failed requests
    const statusCode = c.res.status;
    if (
      (config.skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
      (config.skipFailedRequests && statusCode >= 400)
    ) {
      // Would need to implement a way to "undo" the count increment
      // For simplicity, we don't implement this here
    }
  };
}

/**
 * Request size limitation middleware
 */
export function requestSizeLimitMiddleware(maxSizeBytes: number) {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header("content-length");

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSizeBytes) {
        return c.json(
          {
            success: false,
            error: "Request too large",
            message: `Request size ${size} bytes exceeds maximum allowed size ${maxSizeBytes} bytes`,
            maxSize: maxSizeBytes,
            receivedSize: size,
            timestamp: new Date().toISOString(),
          },
          413
        );
      }
    }

    await next();
  };
}

/**
 * IP whitelist/blacklist middleware
 */
export function ipFilterMiddleware(options: {
  whitelist?: string[];
  blacklist?: string[];
  trustProxy?: boolean;
}) {
  const { whitelist, blacklist, trustProxy = true } = options;

  return async (c: Context, next: Next) => {
    const getClientIP = () => {
      if (trustProxy) {
        const forwarded = c.req.header("x-forwarded-for");
        if (forwarded) return forwarded.split(",")[0].trim();
        
        const realIP = c.req.header("x-real-ip");
        if (realIP) return realIP;
      }
      
      return c.req.header("cf-connecting-ip") || "unknown";
    };

    const clientIP = getClientIP();

    // Check blacklist first
    if (blacklist && blacklist.includes(clientIP)) {
      return c.json(
        {
          success: false,
          error: "Access denied",
          message: "Your IP address is not allowed",
          timestamp: new Date().toISOString(),
        },
        403
      );
    }

    // Check whitelist if defined
    if (whitelist && whitelist.length > 0 && !whitelist.includes(clientIP)) {
      return c.json(
        {
          success: false,
          error: "Access denied",
          message: "Your IP address is not whitelisted",
          timestamp: new Date().toISOString(),
        },
        403
      );
    }

    await next();
  };
}

/**
 * API key authentication middleware
 */
export function apiKeyAuthMiddleware(options: {
  validApiKeys: string[];
  headerName?: string;
  queryParamName?: string;
  required?: boolean;
}) {
  const {
    validApiKeys,
    headerName = "x-api-key",
    queryParamName = "api_key",
    required = true,
  } = options;

  return async (c: Context, next: Next) => {
    const apiKeyFromHeader = c.req.header(headerName);
    const apiKeyFromQuery = c.req.query(queryParamName);
    const apiKey = apiKeyFromHeader || apiKeyFromQuery;

    if (!apiKey) {
      if (required) {
        return c.json(
          {
            success: false,
            error: "API key required",
            message: `API key must be provided in ${headerName} header or ${queryParamName} query parameter`,
            timestamp: new Date().toISOString(),
          },
          401
        );
      }
    } else if (!validApiKeys.includes(apiKey)) {
      return c.json(
        {
          success: false,
          error: "Invalid API key",
          message: "The provided API key is not valid",
          timestamp: new Date().toISOString(),
        },
        401
      );
    }

    if (apiKey) {
      c.set("apiKey", apiKey);
    }

    await next();
  };
}

/**
 * Request timeout middleware
 */
export function timeoutMiddleware(timeoutMs: number) {
  return async (c: Context, next: Next) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Store original signal
      const originalSignal = c.req.raw.signal;
      
      // Create combined signal
      const combinedSignal = AbortSignal.any?.([originalSignal, controller.signal]) || controller.signal;
      
      // Override request signal
      Object.defineProperty(c.req.raw, 'signal', {
        value: combinedSignal,
        configurable: true,
      });

      await next();
    } catch (error: any) {
      if (error.name === 'AbortError' || controller.signal.aborted) {
        return c.json(
          {
            success: false,
            error: "Request timeout",
            message: `Request timed out after ${timeoutMs}ms`,
            timeout: timeoutMs,
            timestamp: new Date().toISOString(),
          },
          408
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };
}