import { Hono } from 'hono';
import * as ctrl from './controller.ts';

export const filesRoutes = new Hono();

filesRoutes.get('/', ctrl.list);
filesRoutes.post('/details', ctrl.details);

export default filesRoutes;
