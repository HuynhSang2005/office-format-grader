import type { Context } from 'hono';

/** AppError dùng cho lỗi dự kiến. */
export class AppError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status = 400, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Handler chung cho Hono `onError`.
 */
export function onError(c: Context, err: unknown) {
  const e = err as Partial<AppError>;
  const status = typeof e.status === 'number' ? e.status : 500;
  return c.json(
    {
      ok: false,
      message: e.message ?? 'Internal Server Error',
      code: e.code,
    },
    status,
  );
}
