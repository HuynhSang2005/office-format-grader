import { Hono } from 'hono';
import documentAnalyzerRoutes from './api/documentAnalyzerRoutes';
import aiRoutes from './api/aiRoutes';
import { cors } from 'hono/cors';
import manualGraderRoutes from './api/manualGraderRoutes';
import powerPointRoutes from './api/powerPointRoutes';
import submissionRoutes from './api/submissionRoutes';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    message: 'Chào mừng đến với API của project Office Format Analyzer!',
    status: 'ok'
  });
});

app.use('/*', cors());

app.route('/api', documentAnalyzerRoutes);
app.route('/api', aiRoutes);
app.route('/api', manualGraderRoutes);
app.route('/api', powerPointRoutes);
app.route('/api', submissionRoutes);

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log('Server đã sẵn sàng tại http://localhost:3000');