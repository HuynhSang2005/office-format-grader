import { Hono } from 'hono';
import { cors } from 'hono/cors';
import documentAnalyzerRoutes from './api/documentAnalyzerRoutes';
import aiRoutes from './api/aiRoutes';
import manualGraderRoutes from './api/manualGraderRoutes';
import powerPointRoutes from './api/powerPointRoutes';
import submissionRoutes from './api/submissionRoutes';

// Helpers
function parseAllowedOrigins(envValue?: string): string | string[] {
  if (!envValue || envValue.trim() === '*') return '*';
  const list = envValue
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length <= 1 ? (list[0] ?? '*') : list;
}

const app = new Hono();

// Basic security headers and x-powered-by
app.use('*', async (c, next) => {
  await next();
  c.header('x-powered-by', 'Office Format Analyzer');
  c.header('x-content-type-options', 'nosniff');
  c.header('x-frame-options', 'DENY');
  c.header('referrer-policy', 'no-referrer');
});

// CORS
const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);
app.use(
  '/*',
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400,
  })
);

// Health checks
app.get('/healthz', (c) =>
  c.json({
    status: 'ok',
    service: 'office-format-analyzer',
    env: process.env.NODE_ENV ?? 'development',
    time: new Date().toISOString(),
  })
);

app.get('/readyz', (c) =>
  c.json({
    status: 'ready',
    service: 'office-format-analyzer',
    time: new Date().toISOString(),
  })
);

// Root
app.get('/', (c) =>
  c.json({
    message: 'Chào mừng đến với API của project Office Format Analyzer!',
    status: 'ok',
  })
);

// API routes
app.route('/api', documentAnalyzerRoutes);
app.route('/api', aiRoutes);
app.route('/api', manualGraderRoutes);
app.route('/api', powerPointRoutes);
app.route('/api', submissionRoutes);

// Not Found
app.notFound((c) =>
  c.json(
    {
      error: 'Not Found',
      path: c.req.path,
    },
    404
  )
);

// Global error handler
app.onError((err, c) => {
  console.error('[SERVER] Unhandled error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : String(err),
    },
    500
  );
});

// Railway/Bun export
const port = Number(process.env.PORT) || 3000;

console.log(
  JSON.stringify(
    {
      msg: 'Server starting',
      port,
      env: process.env.NODE_ENV ?? 'development',
      allowedOrigins,
      runtime: 'bun',
      platform: process.env.RAILWAY_ENVIRONMENT ? 'railway' : 'local',
    },
    null,
    0
  )
);

export default {
  port,
  fetch: app.fetch,
};