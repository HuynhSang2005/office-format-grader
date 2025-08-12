import { Hono } from 'hono';
import * as ctrl from './controller.ts';

const app = new Hono();
app.post('/analyze', ctrl.analyze);

export default app;
