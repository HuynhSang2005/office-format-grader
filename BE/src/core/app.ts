import { Hono } from 'hono';
import { cors } from 'hono/cors';
import routes from '../routes/index.ts';
import { env } from './env.ts';
import { onError } from './errors.ts';
import { securityHeaders } from './security.ts';

/**
 * Khởi tạo Hono app với middleware cơ bản.
 */
export const app = new Hono({ onError });

app.use('/*', cors({ origin: env.CORS_ORIGIN }));
app.use('*', securityHeaders);

// Mount routes
app.route('/', routes);

export default app;
