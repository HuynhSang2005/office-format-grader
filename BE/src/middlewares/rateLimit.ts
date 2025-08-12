import type { MiddlewareHandler } from 'hono';

/** @note Middleware rate limit placeholder. */
export const rateLimit: MiddlewareHandler = async (c, next) => {
  await next();
};
