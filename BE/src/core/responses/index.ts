import type { Context } from 'hono';

export function successResponse<T>(c: Context, data: T, message = 'OK', status = 200) {
  return c.json({ ok: true, message, data }, status);
}
