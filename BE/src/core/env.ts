import { env as bunEnv } from 'bun';

/**
 * Đọc biến môi trường một lần để tránh lặp.
 */
export const env = {
  PORT: Number(bunEnv.PORT ?? 3000),
  CORS_ORIGIN: bunEnv.CORS_ORIGIN ?? '*',
  GOOGLE_API_KEY: bunEnv.GOOGLE_API_KEY ?? '',
  MODEL: bunEnv.MODEL ?? '',
};
