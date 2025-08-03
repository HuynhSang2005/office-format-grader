import { Hono } from 'hono';
import fileRoutes from './api/fileRoutes';
import aiRoutes from './api/aiRoutes';
import { cors } from 'hono/cors';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    message: 'Chào mừng đến với API của project Office Format Analyzer!',
    status: 'ok'
  });
});

app.use('/*', cors());

app.route('/api', fileRoutes);
app.route('/api', aiRoutes);

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log('Server đã sẵn sàng tại http://localhost:3000');