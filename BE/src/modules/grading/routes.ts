import { Hono } from 'hono';
import * as ctrl from './controller.ts';

export const gradingRoutes = new Hono();

gradingRoutes.post('/ai-checker', ctrl.aiCheck);
gradingRoutes.post('/manual-checker', ctrl.manualCheck);
gradingRoutes.post('/check-criterion/:id', ctrl.checkCriterion);

export default gradingRoutes;
