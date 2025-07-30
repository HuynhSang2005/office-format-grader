import { Hono } from 'hono';
import fileRoutes from './api/fileRoutes';

const app = new Hono();

app.get('/', (c) => {
  return c.json({
    message: 'Chào mừng đến với API của dự án Office Format Analyzer!',
    status: 'ok'
  });
});

app.route('/api', fileRoutes);


export default {
  port: 3000,
  fetch: app.fetch,
};

console.log('Server đã sẵn sàng tại http://localhost:3000');