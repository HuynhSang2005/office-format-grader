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

const port = parseInt(process.env.PORT || '3000');

logger.info(` Server đang khởi động trên cổng ${port}...`);

// Khởi động cleanup service
startCleanupService();

serve({
  fetch: app.fetch,
  port: port,
}, (info) => {
  logger.info(` Server đã khởi động thành công tại http://localhost:${info.port}`);
});
