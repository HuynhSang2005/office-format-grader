import type { MiddlewareHandler } from 'hono';

/**
 * Middleware thêm security headers.
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next();
  c.header('x-powered-by', 'Office Format Analyzer');
  c.header('x-content-type-options', 'nosniff');
  c.header('x-frame-options', 'DENY');
  c.header('referrer-policy', 'no-referrer');
};
