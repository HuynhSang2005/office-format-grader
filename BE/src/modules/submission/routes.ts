import { Hono } from 'hono';
import * as ctrl from './controller.ts';

export const submissionRoutes = new Hono();

submissionRoutes.post('/analyze', ctrl.analyze);

export default submissionRoutes;
