import type { Context } from 'hono';

/**
 * Trả JSON chuẩn "ok".
 */
export function success<T>(c: Context, data: T, message = 'OK', status = 200) {
  return c.json({ ok: true, message, data }, status);
}
