import { Hono } from 'hono';
import * as ctrl from './controller.ts';

const app = new Hono();
app.post('/ai', ctrl.aiCheck);
app.post('/manual', ctrl.manualCheck);

export default app;
