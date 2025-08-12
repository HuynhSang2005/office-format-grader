import { Hono } from 'hono';
import * as ctrl from './controller.ts';

const app = new Hono();
app.get('/', ctrl.list);
app.post('/details', ctrl.details);

export default app;
