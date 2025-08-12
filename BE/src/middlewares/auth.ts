import type { MiddlewareHandler } from 'hono';

/**
 * @note Middleware xác thực đơn giản.
 */
export const auth: MiddlewareHandler = async (c, next) => {
  // @note Thêm logic auth
  await next();
};
