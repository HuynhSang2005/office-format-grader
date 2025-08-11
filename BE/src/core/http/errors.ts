import type { Context } from 'hono';

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

export function errorResponse(c: Context, err: unknown) {
  const e = err as Partial<AppError>;
  const status = typeof e.status === 'number' ? e.status : 500;
  return c.json({
    ok: false,
    error: {
      message: e.message ?? 'Internal Server Error',
      code: e.code ?? 'INTERNAL_ERROR',
      details: e.details ?? null
    }
  }, status);
}
