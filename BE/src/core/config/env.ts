export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ?? '',
  MODEL: process.env.MODEL ?? '',
};
