/**
 * @file app.ts
 * @description Main application setup with routes and middleware
 * @author Nguyễn Huỳnh Sang
 */

import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from 'hono/logger';
import { corsConfig } from './config/cors.config';
import { authGuard } from './middlewares/auth.middleware';

// Import all route modules
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import analyzeRoutes from './routes/analyze.routes';
import gradeRoutes from './routes/grade.routes';
import criteriaRoutes from './routes/criteria.routes';
import customRubricRoutes from './routes/customRubric.routes';
import dashboardRoutes from './routes/dashboard.routes';
import exportRoutes from './routes/export.routes';
import ungradedRoutes from './routes/ungraded.routes';

const app = new Hono();

// Add global middlewares
app.use('*', corsConfig);
app.use('*', logger());
app.use('*', prettyJSON());

// Add error handling middleware
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  }, 500);
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Office Format Grader API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      upload: '/api/upload',
      analyze: '/api/debug',
      grade: '/api/grade',
      criteria: '/api/criteria',
      customRubrics: '/api/custom-rubrics',
      dashboard: '/api/dashboard',
      export: '/api/export',
      ungraded: '/api/ungraded'
    }
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount API routes - Public routes first
// Note: Upload route is now protected as it needs user context for automatic grading
app.use('/api/upload', authGuard);
app.route('/api/upload', uploadRoutes);
app.route('/api/debug', analyzeRoutes);

// Protected routes (require authentication)
app.use('/api/auth/me', authGuard);
app.use('/api/grade/*', authGuard);
app.use('/api/criteria/*', authGuard);
app.use('/api/custom-rubrics/*', authGuard);
app.use('/api/dashboard/*', authGuard);
app.use('/api/export/*', authGuard);
app.use('/api/ungraded/*', authGuard);

app.route('/api/auth', authRoutes);
app.route('/api/grade', gradeRoutes);
app.route('/api/criteria', criteriaRoutes);
app.route('/api/custom-rubrics', customRubricRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/export', exportRoutes);
app.route('/api/ungraded', ungradedRoutes);

export default app;