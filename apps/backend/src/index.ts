/**
 * @file index.ts
 * @description Entry point của App Bun + Hono
 * @author Nguyễn Huỳnh Sang
 */

import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { serve } from '@hono/node-server';
import app from '@/app';
import { logger } from '@core/logger';
import { startCleanupService } from '@services/cleanup.service';

// Add a global middleware to log all requests
app.use('*', async (c, next) => {
  console.log('Global middleware in index.ts called for path:', c.req.path);
  await next();
});

const port = parseInt(process.env.PORT || '3000');

logger.info(` Server đang khởi động trên cổng ${port}...`);

// Khởi động cleanup service
startCleanupService();

console.log('Attempting to start server on port', port);

try {
  serve({
    fetch: app.fetch,
    port: port,
  }, (info) => {
    logger.info(` Server đã khởi động thành công tại http://localhost:${info.port}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}