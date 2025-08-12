import { app } from './core/app.ts';
import { env } from './core/env.ts';

export default { fetch: app.fetch, port: env.PORT };
