import { Hono } from 'hono';
import { cors } from 'hono/cors';

export const app = new Hono();

app.use('/*', cors({ origin: process.env.CORS_ORIGIN ?? '*' }));

// Security headers
app.use('*', async (c, next) => {
  await next();
  c.header('x-powered-by', 'Office Format Analyzer');
  c.header('x-content-type-options', 'nosniff');
  c.header('x-frame-options', 'DENY');
  c.header('referrer-policy', 'no-referrer');
});

// MOUNT ROUTES: (Codex sẽ import & mount sau khi tạo routes)

export default app;
