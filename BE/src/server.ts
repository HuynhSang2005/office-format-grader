import app from './core/http/app.ts';
import { env } from './core/config/env.ts';

export default {
  port: env.PORT,
  fetch: app.fetch,
};
