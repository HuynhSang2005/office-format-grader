import { Hono } from 'hono';
import filesRoutes from '../modules/files/routes.ts';
import submissionRoutes from '../modules/submission/routes.ts';
import gradingRoutes from '../modules/grading/routes.ts';
import pptRoutes from '../modules/powerpoint/routes.ts';

/** Router gốc gom các module. */
const app = new Hono();

app.route('/files', filesRoutes);
app.route('/submission', submissionRoutes);
app.route('/grading', gradingRoutes);
app.route('/powerpoint', pptRoutes);

export default app;
